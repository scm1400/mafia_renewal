import { getPlayerById, parseJsonString } from "../../utils/Common";
import { showLabel } from "../../utils/CustomLabelFunctions";
import { Localizer } from "../../utils/Localizer";
import { GameBase } from "../GameBase";
import { GameState } from "./managers/gameFlow/GameFlowManager";
import { GameRoomManager } from "./managers/gameRoom/GameRoomManager";
import { GamePlayer } from "./types/GamePlayer";
import { JOBS, GAME_MODES, getGameModeById } from "./types/JobTypes";
import { GameMode } from "./gameMode/GameMode";
import { createDefaultGameModes } from "./gameMode/defaultGameModes";
import { JobId } from "./types/JobTypes";
import { GameRoom } from "./managers/gameRoom/GameRoom";
import { MafiaPlayer } from "./managers/gameFlow/GameFlowManager";
import { WidgetManager } from "./managers/widget/WidgetManager";
import { WidgetType } from "./managers/widget/WidgetType";

export class Game extends GameBase {
	private static _instance: Game;
	public static ROOM_COUNT = 0;

	private mafiaGameRoomManager: GameRoomManager = new GameRoomManager();

	static create() {
		if (!Game._instance) {
			Game._instance = new Game();
		}
	}

	constructor() {
		super();
		this.addOnStartCallback(this.onStart.bind(this));
		this.addOnJoinPlayerCallback(this.onJoinPlayer.bind(this));
		this.addOnLeavePlayerCallback(this.onLeavePlayer.bind(this));
		this.addOnUpdateCallback(this.update.bind(this));
		this.addOnDestroyCallback(this.onDestroy.bind(this));

		// 게임 모드 등록
		const gameModes = createDefaultGameModes();
		gameModes.forEach((mode) => {
			this.mafiaGameRoomManager.registerGameMode(mode);
		});

		for (let i = 1; i <= 20; i++) {
			if (ScriptMap.hasLocation(`GameRoom_${i}`)) {
				Game.ROOM_COUNT++;
			}
		}

		// 게임룸 매니저 이벤트 리스너 설정
		this.setupGameRoomManagerListeners();
	}

	private onStart() {
		ScriptApp.enableFreeView = false;
		ScriptApp.sendUpdated();
	}

	private onJoinPlayer(player: GamePlayer) {
		// console.log("플레이어 입장:", player.name);
		
		// 플레이어 태그 초기화
		player.tag = {
			widget: {},
			isReady: false,
			profile: this.getDefaultProfile(player)
		};
		
		// 로컬라이징
		Localizer.prepareLocalizationContainer(player);
		
		//@ts-ignore
		const customData = parseJsonString(player.customData);
		
		// 위젯 관리자를 통한 위젯 초기화
		const widgetManager = WidgetManager.instance;
		widgetManager.initPlayerWidgets(player);
		
		// 이전 게임 룸 정보가 있는지 확인 (기존 코드 유지)
		if (player.tag.roomInfo) {
			const roomNum = player.tag.roomInfo.roomNum;
			const room = this.mafiaGameRoomManager.getRoom(roomNum.toString());
			
			if (room) {
				// 게임이 진행 중인지 확인
				const gameFlow = room.flowManager;
				if (gameFlow && gameFlow.isGameInProgress()) {
					// 이미 사망한 플레이어인지 확인
					const deadPlayers = gameFlow.getDeadPlayers();
					if (deadPlayers && deadPlayers.includes(player.id)) {
						// 죽은 플레이어 채팅 위젯 표시 (위젯 관리자 사용)
						widgetManager.showWidget(player, WidgetType.DEAD_CHAT);
						widgetManager.sendMessageToWidget(player, WidgetType.DEAD_CHAT, {
							type: "initDeadChat",
							messages: [] // 필요한 경우 채팅 메시지 가져오는 로직 구현
						});
					}
					
					// 영매인지 확인
					const mafiaPlayer = room.getPlayer(player.id);
					if (mafiaPlayer && mafiaPlayer.jobId === JobId.MEDIUM && mafiaPlayer.isAlive) {
						// 영매용 채팅 위젯 표시 (위젯 관리자 사용)
						widgetManager.showWidget(player, WidgetType.DEAD_CHAT);
						widgetManager.sendMessageToWidget(player, WidgetType.DEAD_CHAT, {
							type: "initMediumChat"
						});
					}
				}
			}
		} else {
			// 로비 위젯 표시 - showLobbyWidget 메서드를 사용하도록 수정
			this.showLobbyWidget(player);
		}
		
		// 모든 플레이어에게 유저 목록 업데이트 전송 (기존 코드 유지)
		this.updateUsersInfo();
	}

	/**
	 * 기본 플레이어 프로필 생성
	 */
	private getDefaultProfile(player: GamePlayer) {
		return {
			id: player.id,
			nickname: player.name,
			level: 1,
			experience: 0,
			avatar: ""
		};
	}

	/**
	 * 로비 위젯을 표시합니다.
	 * @param player 플레이어
	 */
	private showLobbyWidget(player: GamePlayer) {
		const widgetManager = WidgetManager.instance;
		
		// 위젯 관리자를 통해 로비 위젯 표시
		widgetManager.showWidget(player, WidgetType.LOBBY);
		
		// 약간의 딜레이 후 데이터 전송 (위젯이 준비될 시간을 줌)
		ScriptApp.runLater(() => {
			// 게임 모드 정보 전송
			const gameModes = this.getGameModesForUI();
			ScriptApp.sayToStaffs(`게임 모드 정보 전송 (플레이어: ${player.name}, 모드 수: ${gameModes.length})`);
			
			widgetManager.sendMessageToWidget(player, WidgetType.LOBBY, {
				type: "gameModes",
				modes: gameModes,
			});

			// 유저 목록 전송
			this.sendUsersList(player);

			// 방 목록 전송
			this.sendRoomsList(player);
		}, 0.1); // 0.1초 딜레이 (위젯이 준비되는 시간)

		// 로비 위젯 메시지 처리 설정
		const lobbyWidget = widgetManager.getWidget(player, WidgetType.LOBBY);
		if (lobbyWidget && lobbyWidget.element) {
			lobbyWidget.element.onMessage.Add((sender: GamePlayer, data) => {
				if (data.type === "requestGameModes") {
					const gameModes = this.getGameModesForUI();
					ScriptApp.sayToStaffs(`게임 모드 정보 요청 처리 (플레이어: ${sender.name}, 모드 수: ${gameModes.length})`);
					
					widgetManager.sendMessageToWidget(sender, WidgetType.LOBBY, {
						type: "gameModes",
						modes: gameModes,
					});
				} else if (data.type === "requestRooms") {
					this.sendRoomsList(sender);
				} else if (data.type === "requestUsers") {
					this.sendUsersList(sender);
				} else if (data.type === "createRoom" && data.data) {
					const { title, maxPlayers, gameMode } = data.data;
					const gameModeObj = this.mafiaGameRoomManager.getGameMode(gameMode);

					if (gameModeObj) {
						const room = this.mafiaGameRoomManager.createRoom({
							title,
							maxPlayers,
							gameMode: gameModeObj,
						});

						if (room) {
							// 방 생성 후 해당 방에 플레이어 입장
							room.joinPlayer(sender);

							// 로비 위젯 닫고 방 위젯 표시
							widgetManager.hideWidget(sender, WidgetType.LOBBY);
							this.showRoomWidget(sender, room);

							// 모든 플레이어에게 방 목록 업데이트
							this.updateRoomInfo();
						}
					}
				} else if (data.type === "joinRoom" && data.roomId) {
					const room = this.mafiaGameRoomManager.getRoom(data.roomId);
					if (room) {
						const joinResult = room.joinPlayer(sender);

						if (joinResult) {
							// 로비 위젯 닫고 방 위젯 표시
							widgetManager.hideWidget(sender, WidgetType.LOBBY);
							this.showRoomWidget(sender, room);

							// 모든 플레이어에게 방 목록 업데이트
							this.updateRoomInfo();
						} else {
							// 방 참가 실패 메시지 전송
							widgetManager.sendMessageToWidget(sender, WidgetType.LOBBY, {
								type: "error",
								message: "방에 입장할 수 없습니다.",
							});
						}
					}
				} else if (data.type === "leaveRoom") {
					if (sender.tag.roomInfo) {
						const roomNum = sender.tag.roomInfo.roomNum;
						const room = this.mafiaGameRoomManager.getRoom(roomNum.toString());
						if (room) {
							room.leavePlayer(sender.id);

							// 방 위젯 닫고 로비 위젯 표시
							widgetManager.hideWidget(sender, WidgetType.ROOM);
							this.showLobbyWidget(sender);

							// 모든 플레이어에게 방 정보 업데이트 전송
							this.updateRoomInfo();
						}
					}
				}
			});
		}
	}

	/**
	 * 방 위젯을 표시합니다.
	 * @param player 플레이어
	 * @param room 게임 방
	 */
	private showRoomWidget(player: GamePlayer, room: GameRoom) {
		const widgetManager = WidgetManager.instance;
		
		// 위젯 관리자를 통해 방 위젯 표시
		widgetManager.showWidget(player, WidgetType.ROOM);

		// 약간의 딜레이 후 데이터 전송 (위젯이 준비될 시간을 줌)
		ScriptApp.runLater(() => {
			// 방 정보 전송
			this.sendRoomInfoToPlayer(player, room);

			// 게임 모드 상세 정보 전송
			this.sendGameModeDetailsToPlayer(player, room.gameMode);

			// 게임이 진행 중인지 확인
			const gameFlow = room.flowManager;
			if (gameFlow && gameFlow.isGameInProgress()) {
				// 이미 사망한 플레이어인지 확인
				const deadPlayers = gameFlow.getDeadPlayers();
				if (deadPlayers && deadPlayers.includes(player.id)) {
					// 죽은 플레이어 채팅 위젯 표시
					gameFlow.showPermanentDeadChatWidget(player);
				}
				
				// 영매인지 확인
				const mafiaPlayer = room.getPlayer(player.id);
				if (mafiaPlayer && mafiaPlayer.jobId === JobId.MEDIUM && mafiaPlayer.isAlive) {
					// 영매용 채팅 위젯 표시
					gameFlow.showMediumChatWidget(player);
				}
			}
		}, 0.1); // 0.1초 딜레이

		// 방에 있는 다른 플레이어들에게 새 플레이어 입장 알림
		this.notifyPlayerJoinedRoom(room, player);

		// 방 위젯 메시지 처리 설정
		const roomWidget = widgetManager.getWidget(player, WidgetType.ROOM);
		if (roomWidget && roomWidget.element) {
			roomWidget.element.onMessage.Add((sender: GamePlayer, data) => {
				if (data.type === "requestRoomInfo") {
					const roomId = sender.tag.roomInfo?.roomNum;
					if (roomId) {
						const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
						if (room) {
							this.sendRoomInfoToPlayer(sender, room);
						}
					}
				} else if (data.type === "requestGameModeDetails") {
					const roomId = sender.tag.roomInfo?.roomNum;
					if (roomId) {
						const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
						if (room) {
							this.sendGameModeDetailsToPlayer(sender, room.gameMode);
						}
					}
				} else if (data.type === "leaveRoom") {
					const roomId = sender.tag.roomInfo?.roomNum;
					if (roomId) {
						const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
						if (room) {
							room.leavePlayer(sender.id);
							
							// 방 위젯 숨기기
							widgetManager.hideWidget(sender, WidgetType.ROOM);
							
							// 로비 위젯 표시
							this.showLobbyWidget(sender);

							// 모든 플레이어에게 방 정보 업데이트 전송
							this.updateRoomInfo();

							// 방에 남아있는 플레이어들에게 퇴장 메시지 전송
							this.notifyPlayerLeftRoom(room, sender);
						}
					}
				} else if (data.type === "setReady") {
					const roomId = sender.tag.roomInfo?.roomNum;
					if (roomId) {
						const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
						if (room) {
							// 플레이어 준비 상태 설정
							sender.tag.isReady = true;

							// 방의 모든 플레이어에게 준비 상태 변경 알림
							this.notifyReadyStatusChanged(room, sender);
						}
					}
				} else if (data.type === "cancelReady") {
					const roomId = sender.tag.roomInfo?.roomNum;
					if (roomId) {
						const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
						if (room) {
							// 플레이어 준비 상태 해제
							sender.tag.isReady = false;

							// 방의 모든 플레이어에게 준비 상태 변경 알림
							this.notifyReadyStatusChanged(room, sender);
						}
					}
				} else if (data.type === "startGame") {
					const roomId = sender.tag.roomInfo?.roomNum;
					if (roomId) {
						const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
						if (room) {
							// 게임 시작 조건 확인
							const canStart = this.canStartGame(room);

							if (canStart) {
								// 게임 시작
								room.flowManager.startGame();

								// 방의 모든 플레이어에게 게임 시작 알림
								this.notifyGameStarting(room);

								// 모든 플레이어에게 방 정보 업데이트 전송
								this.updateRoomInfo();
							} else {
								// 게임 시작 실패 메시지 전송
								widgetManager.sendMessageToWidget(sender, WidgetType.ROOM, {
									type: "error",
									message: "모든 플레이어가 준비 상태여야 합니다.",
								});
							}
						}
					}
				} else if (data.type === "kickPlayer" && data.playerId) {
					const roomId = sender.tag.roomInfo?.roomNum;
					if (roomId) {
						const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
						if (room) {
							// 방장 권한 확인
							const isHost = room.hostId === sender.id;

							if (isHost) {
								// 강퇴할 플레이어 찾기
								const targetPlayer = ScriptApp.getPlayerByID(data.playerId) as unknown as GamePlayer;

								if (targetPlayer) {
									// 플레이어 강퇴
									room.leavePlayer(targetPlayer.id);

									// 강퇴된 플레이어에게 로비 위젯 표시
									widgetManager.hideWidget(targetPlayer, WidgetType.ROOM);
									this.showLobbyWidget(targetPlayer);

									// 방의 모든 플레이어에게 강퇴 알림
									this.notifyPlayerKicked(room, targetPlayer);

									// 모든 플레이어에게 방 정보 업데이트 전송
									this.updateRoomInfo();
								}
							}
						}
					}
				} else if (data.type === "sendChatMessage" && data.content) {
					const roomId = sender.tag.roomInfo?.roomNum;
					if (roomId) {
						const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
						if (room) {
							// 채팅 메시지 전송
							this.sendChatMessageToRoom(room, sender, data.content);
						}
					}
				}
			});
		}
	}

	/**
	 * 방 정보를 플레이어에게 전송합니다.
	 */
	private sendRoomInfoToPlayer(player: GamePlayer, room: GameRoom) {
		const widgetManager = WidgetManager.instance;

		const players = room.getPlayers() as MafiaPlayer[];
		// host 정보 가져오기 (타입 안전하게 처리)
		let hostName = "알 수 없음";
		let hostId = "";

		if (room.hostId) {
			hostId = room.hostId; // 이제 room.host는 이미 string 타입
			const hostPlayer = players.find((p) => p.id === hostId);
			if (hostPlayer) {
				hostName = hostPlayer.name;
			}
		}

		// 플레이어 정보 구성
		const playersList = players.map((p) => {
			// MafiaPlayer에서 필요한 정보만 추출하고, GamePlayer에서 추가 정보 가져오기
			const gamePlayer = getPlayerById(p.id);
			return {
				id: p.id,
				name: p.name,
				level: gamePlayer?.tag?.profile?.level || 1, // 플레이어 프로필에서 레벨 가져오기
				isReady: gamePlayer?.tag?.isReady || false,
			};
		});

		// 방 정보 전송
		widgetManager.sendMessageToWidget(player, WidgetType.ROOM, {
			type: "roomInfo",
			roomData: {
				id: room.id,
				title: room.title,
				maxPlayers: room.maxPlayers,
				gameMode: room.gameMode.getName(),
				host: {
					id: hostId,
					name: hostName,
				},
				players: playersList,
				currentUser: {
					id: player.id,
					name: player.name,
					isReady: player.tag?.isReady || false,
				},
			},
		});
	}

	/**
	 * 게임 모드 상세 정보를 플레이어에게 전송합니다.
	 */
	private sendGameModeDetailsToPlayer(player: GamePlayer, gameMode: GameMode) {
		const widgetManager = WidgetManager.instance;

		// 게임 모드 직업 정보 구성
		const jobs = gameMode.getJobs();
		const jobsData = jobs.map((job) => ({
			id: job.id,
			name: job.name,
			description: job.description,
			team: job.team,
		}));

		// 게임 모드 정보 전송
		widgetManager.sendMessageToWidget(player, WidgetType.ROOM, {
			type: "gameModeDetails",
			modeData: {
				id: gameMode.getId(),
				name: gameMode.getName(),
				description: gameMode.getDescription(),
				jobs: jobsData,
			},
		});
	}

	/**
	 * 플레이어가 방에 입장했음을 알립니다.
	 */
	private notifyPlayerJoinedRoom(room: GameRoom, player: GamePlayer) {
		const widgetManager = WidgetManager.instance;
		
		const players = room.getPlayers() as MafiaPlayer[];
		players.forEach((p) => {
			// 자기 자신에게는 알림을 보내지 않음
			if (p.id !== player.id) {
				const gamePlayer = ScriptApp.getPlayerByID(p.id) as unknown as GamePlayer;
				widgetManager.sendMessageToWidget(gamePlayer, WidgetType.ROOM, {
					type: "playerJoined",
					playerId: player.id,
					playerName: player.name,
				});

				// 방 정보 업데이트
				this.sendRoomInfoToPlayer(gamePlayer, room);
			}
		});
	}

	/**
	 * 플레이어가 방에서 나갔음을 알립니다.
	 */
	private notifyPlayerLeftRoom(room: GameRoom, player: GamePlayer) {
		const widgetManager = WidgetManager.instance;
		
		const players = room.getPlayers() as MafiaPlayer[];
		players.forEach((p) => {
			const gamePlayer = ScriptApp.getPlayerByID(p.id) as unknown as GamePlayer;
			widgetManager.sendMessageToWidget(gamePlayer, WidgetType.ROOM, {
				type: "playerLeft",
				playerId: player.id,
				playerName: player.name,
			});

			// 방 정보 업데이트
			this.sendRoomInfoToPlayer(gamePlayer, room);
		});
	}

	/**
	 * 준비 상태 변경을 알립니다.
	 */
	private notifyReadyStatusChanged(room: GameRoom, player: GamePlayer) {
		const widgetManager = WidgetManager.instance;
		
		const players = room.getPlayers() as MafiaPlayer[];
		players.forEach((p) => {
			const gamePlayer = ScriptApp.getPlayerByID(p.id) as unknown as GamePlayer;
			widgetManager.sendMessageToWidget(gamePlayer, WidgetType.ROOM, {
				type: "readyStatusChanged",
				playerId: player.id,
				isReady: player.tag.isReady,
			});

			// 방 정보 업데이트
			this.sendRoomInfoToPlayer(gamePlayer, room);
		});
	}

	/**
	 * 게임 시작을 알립니다.
	 */
	private notifyGameStarting(room: GameRoom) {
		const widgetManager = WidgetManager.instance;
		
		const players = room.getPlayers() as MafiaPlayer[];
		players.forEach((p) => {
			const gamePlayer = ScriptApp.getPlayerByID(p.id) as unknown as GamePlayer;
			widgetManager.sendMessageToWidget(gamePlayer, WidgetType.ROOM, {
				type: "gameStarting",
			});
		});
	}

	/**
	 * 플레이어가 강퇴됐음을 알립니다.
	 */
	private notifyPlayerKicked(room: GameRoom, player: GamePlayer) {
		// 플레이어의 방 위젯 숨기기 (오브젝트 풀 패턴 사용)
		if (player.tag?.widget?.room) {
			const widgetManager = WidgetManager.instance;
			widgetManager.hideWidget(player, WidgetType.ROOM);
		}

		// 로비 위젯 표시
		this.showLobbyWidget(player);
		// 강퇴 알림
		showLabel(player, "방에서 강퇴되었습니다.");
	}

	/**
	 * 채팅 메시지를 방 전체에 전송합니다.
	 */
	private sendChatMessageToRoom(room: GameRoom, sender: GamePlayer, content: string) {
		const widgetManager = WidgetManager.instance;
		
		const chatMessage = {
			type: "chatMessage",
			playerId: sender.id,
			playerName: sender.name,
			content: content,
			timestamp: Date.now(),
		};

		// 방의 모든 플레이어에게 메시지 전송
		const players = room.getPlayers() as MafiaPlayer[];
		players.forEach((p) => {
			const gamePlayer = ScriptApp.getPlayerByID(p.id) as unknown as GamePlayer;
			widgetManager.sendMessageToWidget(gamePlayer, WidgetType.ROOM, chatMessage);
		});
	}

	/**
	 * 게임 시작 가능 여부를 확인합니다.
	 */
	private canStartGame(room: GameRoom): boolean {
		const players = room.getPlayers() as MafiaPlayer[];

		// 최소 인원 확인 (4명 이상)
		if (players.length < 4) {
			return false;
		}

		// 모든 플레이어가 준비 상태인지 확인 (방장 제외)
		const hostId = room.hostId;

		for (const mafiaPlayer of players) {
			if (mafiaPlayer.id !== hostId) {
				const gamePlayer = ScriptApp.getPlayerByID(mafiaPlayer.id) as unknown as GamePlayer;
				if (!gamePlayer?.tag?.isReady) {
					return false;
				}
			}
		}

		return true;
	}

	/**
	 * 게임 모드 선택 위젯을 표시합니다.
	 * @param player 플레이어
	 */
	private showGameModeSelect(player: GamePlayer) {
		// 이미 게임 모드 선택 위젯이 있으면 숨기기 (오브젝트 풀 패턴 사용)
		const widgetManager = WidgetManager.instance;
		widgetManager.hideWidget(player, WidgetType.GAME_MODE_SELECT);

		// 게임 모드 선택 위젯 표시
		widgetManager.showWidget(player, WidgetType.GAME_MODE_SELECT);



		// 게임 모드 정보 전송
		player.tag.widget.gameModeSelect.sendMessage({
			type: "init_game_modes",
			modes: GAME_MODES,
			jobs: JOBS,
		});

		// 게임 모드 선택 위젯 메시지 처리
		player.tag.widget.gameModeSelect.onMessage.Add((player: GamePlayer, data) => {
			if (data.type === "cancel_mode_select") {
				// 위젯 숨기기 (오브젝트 풀 패턴 사용)
				const widgetManager = WidgetManager.instance;
				widgetManager.hideWidget(player, WidgetType.GAME_MODE_SELECT);
			} else if (data.type === "select_game_mode") {
				const modeId = data.modeId;
				const room = this.mafiaGameRoomManager.getRoom("1");

				// 게임 모드 설정
				room.flowManager.setGameMode(modeId);

				// 게임 시작
				room.flowManager.startGame();

				// 위젯 숨기기 (오브젝트 풀 패턴 사용)
				const widgetManager = WidgetManager.instance;
				widgetManager.hideWidget(player, WidgetType.GAME_MODE_SELECT);

				// 모든 플레이어에게 방 정보 업데이트 전송
				this.updateRoomInfo();
			}
		});
	}

	/**
	 * 역할 카드 위젯을 표시합니다.
	 * @param player 플레이어
	 * @param role 역할
	 */
	private showRoleCard(player: GamePlayer, role: JobId | string) {
		// 이미 역할 카드 위젯이 있으면 숨기기 (오브젝트 풀 패턴 사용)
		const widgetManager = WidgetManager.instance;
		widgetManager.hideWidget(player, WidgetType.ROLE_CARD);

		// 역할 카드 위젯 표시
		widgetManager.showWidget(player, WidgetType.ROLE_CARD);


		// 역할 정보 전송
		player.tag.widget.roleCard.sendMessage({
			type: "setRole",
			role: role,
		});

		// 역할 카드 위젯 메시지 처리
		player.tag.widget.roleCard.onMessage.Add((player: GamePlayer, data) => {
			if (data.type === "close") {
				// 위젯 숨기기 (오브젝트 풀 패턴 사용)
				const widgetManager = WidgetManager.instance;
				widgetManager.hideWidget(player, WidgetType.ROLE_CARD);
			}
		});
	}

	/**
	 * 플레이어가 게임에서 나갈 때 호출되는 메서드
	 * @param player 나가는 플레이어
	 */
	protected onLeavePlayer(player: GamePlayer): void {
		ScriptApp.sayToStaffs(`[Game] Player ${player.name} (${player.id}) 퇴장`);

		// 방에 있는 경우 방에서도 퇴장 처리
		if (player.tag?.roomInfo) {
			const roomNum = player.tag.roomInfo.roomNum;
			const room = this.mafiaGameRoomManager.getRoom(roomNum.toString());
			if (room) {
				room.leavePlayer(player.id);
				// 방의 다른 플레이어들에게 퇴장 알림
				this.notifyPlayerLeftRoom(room, player);
			}
		}

		// 위젯 관리자를 통해 모든 위젯 정리
		const widgetManager = WidgetManager.instance;
		widgetManager.cleanupPlayerWidgets(player);

		// 방 목록 업데이트
		this.updateRoomInfo();
		
		// 모든 플레이어에게 유저 목록 업데이트 전송
		this.updateUsersInfo();
	}

	private update(dt: number) {
		// 각 방의 게임 상태 업데이트
		for (let i = 1; i <= Game.ROOM_COUNT; i++) {
			const room = this.mafiaGameRoomManager.getRoom(i.toString());
			if (room && room.flowManager.isGameInProgress()) {
				// 타이머 업데이트
				if (room.flowManager.phaseTimer > 0) {
					room.flowManager.phaseTimer -= dt;

					// 타이머가 0 이하가 되면 다음 단계로 진행
					if (room.flowManager.phaseTimer <= 0) {
						room.flowManager.nextPhase();
					}
				}
			}
		}
	}

	private onDestroy() {
		// 게임 종료 시 필요한 정리 작업
	}

	/**
	 * 게임 모드 정보를 UI에 맞게 변환합니다.
	 */
	private getGameModesForUI() {
		// 등록된 모든 게임 모드 가져오기
		const gameModes = [];
		const defaultModes = createDefaultGameModes();
		
		// 디버깅 로그
		ScriptApp.sayToStaffs(`기본 게임 모드 로드: ${defaultModes.length}개`);
		
		defaultModes.forEach((mode) => {
			// 직업 객체에서 ID 목록 추출
			const jobs = mode.getJobs();
			const jobIds = jobs.map(job => job.id);
			
			gameModes.push({
				id: mode.getId(),
				name: mode.getName(),
				description: mode.getDescription(),
				minPlayers: mode.getMinPlayers(),
				maxPlayers: mode.getMaxPlayers(),
				jobIds: jobIds
			});
		});
		
		// 디버깅 로그
		ScriptApp.sayToStaffs(`게임 모드 UI 데이터 생성 완료: ${gameModes.length}개`);
		
		return gameModes;
	}

	/**
	 * 플레이어에게 유저 목록을 전송합니다.
	 */
	private sendUsersList(player: GamePlayer) {
		const widgetManager = WidgetManager.instance;
		
		const usersList = [];
		for (const p of ScriptApp.players) {
			const gamePlayer = p as unknown as GamePlayer;
			usersList.push({
				id: gamePlayer.id,
				name: gamePlayer.name,
				level: gamePlayer.tag?.profile?.level || 1,
			});
		}

		widgetManager.sendMessageToWidget(player, WidgetType.LOBBY, {
			type: "usersList",
			users: usersList,
		});
	}

	/**
	 * 모든 플레이어에게 유저 목록 업데이트를 전송합니다.
	 */
	private updateUsersInfo() {
		const widgetManager = WidgetManager.instance;
		
		const usersList = [];
		for (const p of ScriptApp.players) {
			const gamePlayer = p as unknown as GamePlayer;
			usersList.push({
				id: gamePlayer.id,
				name: gamePlayer.name,
				level: gamePlayer.tag?.profile?.level || 1,
			});
		}

		// 로비에 있는 모든 플레이어에게 유저 목록 전송
		for (const p of ScriptApp.players) {
			const gamePlayer = p as unknown as GamePlayer;
			// 방에 입장하지 않은 플레이어만 업데이트
			if (!gamePlayer.tag?.roomInfo) {
				widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY, {
					type: "usersList",
					users: usersList,
				});
			}
		}
	}

	/**
	 * 플레이어에게 방 목록을 전송합니다.
	 */
	private sendRoomsList(player: GamePlayer) {
		const widgetManager = WidgetManager.instance;
		
		// 모든 방을 배열로 변환
		const roomsList = [];
		for (let i = 1; i <= Game.ROOM_COUNT; i++) {
			const room = this.mafiaGameRoomManager.getRoom(i.toString());
			if (room) {
				roomsList.push({
					id: room.id,
					title: room.title,
					playerCount: room.getPlayersCount(),
					maxPlayers: room.maxPlayers,
					gameMode: room.gameMode.getName(),
					isPlaying: room.flowManager.isGameInProgress(),
				});
			}
		}

		widgetManager.sendMessageToWidget(player, WidgetType.LOBBY, {
			type: "roomsList",
			rooms: roomsList,
		});
	}

	/**
	 * 모든 플레이어에게 방 목록 업데이트를 전송합니다.
	 */
	private updateRoomInfo() {
		const widgetManager = WidgetManager.instance;
		
		// 모든 방을 배열로 변환
		const roomsList = [];
		for (let i = 1; i <= Game.ROOM_COUNT; i++) {
			const room = this.mafiaGameRoomManager.getRoom(i.toString());
			if (room) {
				roomsList.push({
					id: room.id,
					title: room.title,
					playerCount: room.getPlayersCount(),
					maxPlayers: room.maxPlayers,
					gameMode: room.gameMode.getName(),
					isPlaying: room.flowManager.isGameInProgress(),
				});
			}
		}

		// 로비에 있는 모든 플레이어에게 방 목록 전송
		for (const p of ScriptApp.players) {
			const gamePlayer = p as unknown as GamePlayer;
			// 방에 입장하지 않은 플레이어만 업데이트
			if (!gamePlayer.tag?.roomInfo) {
				widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY, {
					type: "roomsList",
					rooms: roomsList,
				});
			}
		}
	}

	/**
	 * 게임룸 매니저 이벤트 리스너 설정
	 */
	private setupGameRoomManagerListeners() {
		// 플레이어 퇴장 이벤트
		this.mafiaGameRoomManager.on("playerLeftRoom", (room, player) => {
			this.notifyPlayerLeftRoom(room, player);

			// 호스트가 있고 플레이어가 남아있으면 호스트 변경 알림
			if (room.getPlayersCount() > 0 && room.hostId) {
				const hostPlayer = getPlayerById(room.hostId);
				if (hostPlayer) {
					this.notifyHostChanged(room, hostPlayer);
				}
			}
		});

		// 방 생성 이벤트
		this.mafiaGameRoomManager.on("roomCreated", (room) => {
			// 모든 플레이어에게 방 목록 업데이트 전송
			this.updateRoomInfo();
			ScriptApp.sayToStaffs(`[Game] 새로운 방이 생성되었습니다: ${room.id} - ${room.title}`);
		});

		// 플레이어 입장 이벤트
		this.mafiaGameRoomManager.on("playerJoinedRoom", (room, player) => {
			// 방에 플레이어가 입장할 때도 방 목록 업데이트
			this.updateRoomInfo();
			ScriptApp.sayToStaffs(`[Game] 플레이어 ${player.name}가 방 ${room.id}에 입장했습니다.`);
		});

		// 플레이어 강퇴 이벤트
		this.mafiaGameRoomManager.on("playerKicked", (room, player) => {
			// 플레이어의 방 위젯 제거
			if (player.tag?.widget?.room) {
				player.tag.widget.room.destroy();
				player.tag.widget.room = null;
			}

			// 로비 위젯 표시
			this.showLobbyWidget(player);

			// 강퇴 알림
			this.notifyPlayerKicked(room, player);
		});

		// 호스트 변경 이벤트
		this.mafiaGameRoomManager.on("hostChanged", (room, newHost) => {
			this.notifyHostChanged(room, newHost);
		});

		// 준비 상태 변경 이벤트
		this.mafiaGameRoomManager.on("readyStatusChanged", (room, player, isReady) => {
			player.tag.isReady = isReady;
			this.notifyReadyStatusChanged(room, player);
		});

		// 게임 시작 이벤트
		this.mafiaGameRoomManager.on("gameStarted", (room) => {
			// 모든 플레이어에게 게임 시작 알림
			room.actionToRoomPlayers((player) => {
				const gamePlayer = getPlayerById(player.id);
				if (!gamePlayer) return;

				// 게임 시작 메시지 전송
				if (gamePlayer.tag.widget.room) {
					gamePlayer.tag.widget.room.sendMessage({
						type: "gameStarting"
					});
				}
			});
		});

		// 게임 종료 이벤트
		this.mafiaGameRoomManager.on("gameEnded", (room) => {
			// 모든 플레이어에게 게임 종료 알림
			room.actionToRoomPlayers((player) => {
				const gamePlayer = getPlayerById(player.id);
				if (!gamePlayer) return;

				// 게임 종료 메시지 전송
				if (gamePlayer.tag.widget.room) {
					gamePlayer.tag.widget.room.sendMessage({
						type: "gameEnded"
					});
				}
			});

			// 방 정보 업데이트
			this.updateRoomInfo();
		});
	}

	/**
	 * 호스트 변경을 알립니다.
	 */
	private notifyHostChanged(room: GameRoom, newHost: GamePlayer) {
		const players = room.getPlayers() as MafiaPlayer[];
		players.forEach((p) => {
			const gamePlayer = ScriptApp.getPlayerByID(p.id) as unknown as GamePlayer;
			if (gamePlayer?.tag?.widget?.room) {
				gamePlayer.tag.widget.room.sendMessage({
					type: "hostChanged",
					newHostId: newHost.id,
					newHostName: newHost.name,
				});

				// 방 정보 업데이트
				this.sendRoomInfoToPlayer(gamePlayer, room);
			}
		});
	}
}

