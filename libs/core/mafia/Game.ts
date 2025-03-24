import { getPlayerById, parseJsonString, sendAdminConsoleMessage } from "../../utils/Common";
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
import { SpriteManager, SpriteType } from "./managers/Sprite/SpriteManager";

export const adminList = [];
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

		// ScriptApp.cameraEffect = 1; // 1 = 비네팅 효과
		// ScriptApp.cameraEffectParam1 = 2000;
		ScriptApp.showName = false;
		ScriptApp.sendUpdated();
		SpriteManager.getInstance();

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
		// 플레이어 태그 초기화
		player.tag = {
			widget: {},
			isReady: false,
			profile: this.getDefaultProfile(player),
		};

		player.sprite = SpriteManager.getInstance().getSprite(SpriteType.CHARACTER_BASIC);

		if (!player.isMobile) {
			player.displayRatio = 1.25;
		}

		if (player.role >= 3000) {
			adminList.push(player.id);
			player.tag.widget.system = player.showWidget("widgets/system.html", "topleft", 0, 0);
		}

		player.playSound("sounds/lobby_bgm.mp3", true, true, "bgm", 0.4);

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
							messages: [], // 필요한 경우 채팅 메시지 가져오는 로직 구현
						});
					}

					// 영매인지 확인
					const mafiaPlayer = room.getPlayer(player.id);
					if (mafiaPlayer && mafiaPlayer.jobId === JobId.MEDIUM && mafiaPlayer.isAlive) {
						// 영매용 채팅 위젯 표시 (위젯 관리자 사용)
						widgetManager.showWidget(player, WidgetType.DEAD_CHAT);
						widgetManager.sendMessageToWidget(player, WidgetType.DEAD_CHAT, {
							type: "initMediumChat",
						});
					}
				}
			}
		} else {
			// 로비 위젯 표시 - showLobbyWidget 메서드를 사용하도록 수정
			ScriptApp.runLater(() => {
				const lobbyLocation = ScriptMap.getLocationList("Lobby");
				player.setCameraTarget(lobbyLocation[0].x + lobbyLocation[0].width / 2, lobbyLocation[0].y + lobbyLocation[0].height / 2, 0);
				player.spawnAtLocation("Lobby");
				this.showLobbyWidget(player);
			}, 1);
		}

		// 모든 플레이어에게 유저 목록 업데이트 전송 (기존 코드 유지)
		this.updateUsersInfo();

		// 새 플레이어 입장 시스템 메시지 전송
		this.sendSystemLobbyChatMessage(`${player.name}님이 게임에 입장했습니다.`);
		player.sendUpdated();
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
			avatar: "",
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
			// 초기화 메시지에 플레이어 ID와 이름 포함
			widgetManager.sendMessageToWidget(player, WidgetType.LOBBY, {
				type: "init",
				isMobile: player.isMobile,
				isTablet: false, // 태블릿 구분 로직이 없으면 기본값
				userId: player.id,
				userName: player.name,
			});

			// 게임 모드 정보 전송
			const gameModes = this.getGameModesForUI();
			sendAdminConsoleMessage(`게임 모드 정보 전송 (플레이어: ${player.name}, 모드 수: ${gameModes.length})`);

			widgetManager.sendMessageToWidget(player, WidgetType.LOBBY, {
				type: "gameModes",
				modes: gameModes,
			});

			// 유저 목록 전송
			this.sendUsersList(player);

			// 방 목록 전송
			this.updateRoomInfo();
		}, 0.1); // 0.1초 딜레이 (위젯이 준비되는 시간)

		// 로비 위젯 메시지 처리 설정
		const lobbyWidget = widgetManager.getWidget(player, WidgetType.LOBBY);
		if (lobbyWidget && lobbyWidget.element) {
			// 이미 이벤트 리스너가 있으면 먼저 제거
			if (player.tag.lobbyWidgetMessageHandler) {
				lobbyWidget.element.onMessage.Remove(player.tag.lobbyWidgetMessageHandler);
			}
			
			// 새 메시지 핸들러 생성
			const messageHandler = (sender: GamePlayer, data) => {
				if (data.type === "requestGameModes") {
					const gameModes = this.getGameModesForUI();
					sendAdminConsoleMessage(`게임 모드 정보 요청 처리 (플레이어: ${sender.name}, 모드 수: ${gameModes.length})`);

					widgetManager.sendMessageToWidget(sender, WidgetType.LOBBY, {
						type: "gameModes",
						modes: gameModes,
					});
				} else if (data.type === "requestRooms") {
					this.updateRoomInfo();
				} else if (data.type === "requestUsers") {
					this.sendUsersList(sender);
				} else if (data.type === "lobbyChatMessage" && data.content) {
					// 로비 채팅 메시지 처리
					this.sendLobbyChatMessage(sender, data.content);
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
			};
			
			// 메시지 핸들러 등록 및 플레이어 태그에 저장
			lobbyWidget.element.onMessage.Add(messageHandler);
			player.tag.lobbyWidgetMessageHandler = messageHandler;
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
				// const deadPlayers = gameFlow.getDeadPlayers();
				// if (deadPlayers && deadPlayers.includes(player.id)) {
				// 	// 죽은 플레이어 채팅 위젯 표시
				// 	gameFlow.showPermanentDeadChatWidget(player);
				// }

				// // 영매인지 확인
				// const mafiaPlayer = room.getPlayer(player.id);
				// if (mafiaPlayer && mafiaPlayer.jobId === JobId.MEDIUM && mafiaPlayer.isAlive) {
				// 	// 영매용 채팅 위젯 표시
				// 	gameFlow.showMediumChatWidget(player);
				// }
			}
		}, 0.1); // 0.1초 딜레이 (위젯이 준비되는 시간)

		// 방에 있는 다른 플레이어들에게 새 플레이어 입장 알림
		this.notifyPlayerJoinedRoom(room, player);

		// 방 위젯 메시지 처리 설정
		const roomWidget = widgetManager.getWidget(player, WidgetType.ROOM);
		if (roomWidget && roomWidget.element) {
			// 이미 이벤트 리스너가 있으면 먼저 제거
			if (player.tag.roomWidgetMessageHandler) {
				roomWidget.element.onMessage.Remove(player.tag.roomWidgetMessageHandler);
			}
			
			// 새 메시지 핸들러 생성
			const messageHandler = (sender: GamePlayer, data) => {
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
				} else if (data.type === "toggleReady") {
					const roomId = sender.tag.roomInfo?.roomNum;
					if (roomId) {
						const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
						if (room) {
							// 현재 준비 상태 반전
							const isReady = !sender.tag.isReady;
							sender.tag.isReady = isReady;

							// 방 내 모든 플레이어에게 준비 상태 변경 알림
							this.notifyReadyStatusChanged(room, sender);
						}
					}
				} else if (data.type === "startGame") {
					const roomId = sender.tag.roomInfo?.roomNum;
					if (roomId) {
						const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
						if (room && room.hostId === sender.id) {
							// 방장인 경우만 게임 시작 가능
							if (this.canStartGame(room)) {
								// TODO: 게임 시작 처리
							}
						}
					}
				} else if (data.type === "chatMessage" && data.content) {
					const roomId = sender.tag.roomInfo?.roomNum;
					if (roomId) {
						const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
						if (room) {
							// 채팅 메시지 처리
							this.sendChatMessageToRoom(room, sender, data.content);
						}
					}
				} else if (data.type === "kickPlayer" && data.playerId) {
					const roomId = sender.tag.roomInfo?.roomNum;
					if (roomId) {
						const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
						// 방장인 경우만 강퇴 가능
						if (room && room.hostId === sender.id) {
							const targetPlayer = ScriptApp.getPlayerByID(data.playerId) as unknown as GamePlayer;
							if (targetPlayer) {
								room.leavePlayer(targetPlayer.id);
								
								// 방 위젯 숨기기
								widgetManager.hideWidget(targetPlayer, WidgetType.ROOM);
								
								// 로비 위젯 표시
								this.showLobbyWidget(targetPlayer);
								
								// 방에 남아있는 플레이어들에게 퇴장 메시지 전송
								this.notifyPlayerKicked(room, targetPlayer);
								
								// 모든 플레이어에게 방 정보 업데이트 전송
								this.updateRoomInfo();
							}
						}
					}
				}
			};
			
			// 메시지 핸들러 등록 및 플레이어 태그에 저장
			roomWidget.element.onMessage.Add(messageHandler);
			player.tag.roomWidgetMessageHandler = messageHandler;
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
			} else {
				// 플레이어 목록에 없는 경우 getPlayerById로 한번 더 시도
				const gamePlayer = getPlayerById(hostId);
				if (gamePlayer) {
					hostName = gamePlayer.name;
				}
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
				state: room.state,
				isPlaying: room.state === GameState.IN_PROGRESS,
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
	 * 플레이어가 방을 나갔을 때 다른 플레이어들에게 알립니다.
	 */
	private notifyPlayerLeftRoom(room: GameRoom, player: GamePlayer) {
		// 남은 플레이어들에게 알림
		room.actionToRoomPlayers((p) => {
			// 자신은 제외
			if (p.id === player.id) return;

			const gamePlayer = getPlayerById(p.id);
			if (!gamePlayer) return;

			if (gamePlayer.tag.widget.room) {
				gamePlayer.tag.widget.room.sendMessage({
					type: "playerLeft",
					playerId: player.id,
					playerName: player.name,
				});
			}
		});

		// 방 정보 업데이트
		this.updateRoomInfo();
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
			senderId: sender.id,
			senderName: sender.name,
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
		sendAdminConsoleMessage(`[Game] Player ${player.name} (${player.id}) 퇴장`);

		// 방에 있는 경우 방에서도 퇴장 처리
		if (player.tag?.roomInfo) {
			const roomNum = player.tag.roomInfo.roomNum;
			const roomId = roomNum.toString();
			const room = this.mafiaGameRoomManager.getRoom(roomId);
			
			if (room) {
				// 플레이어 퇴장 처리
				room.leavePlayer(player.id);
				// 방의 다른 플레이어들에게 퇴장 알림
				this.notifyPlayerLeftRoom(room, player);
				
				// 방에 플레이어가 남아있지 않으면 방 삭제 확인
				if (room.getPlayersCount() === 0) {
					sendAdminConsoleMessage(`[Game] 방 ${roomId}에 플레이어가 없어 삭제 확인`);
					
					// 방 삭제 시도
					const removed = this.mafiaGameRoomManager.removeRoom(roomId);
					sendAdminConsoleMessage(`[Game] 방 삭제 결과: ${removed ? "성공" : "실패"}`);
					
					// 방이 여전히 존재하면 강제 삭제
					if (!removed && this.mafiaGameRoomManager.getRoom(roomId)) {
						sendAdminConsoleMessage(`[Game] 방을 강제로 삭제합니다: ${roomId}`);
						// 직접 참조로 방 삭제
						// @ts-ignore - private 필드에 접근
						delete this.mafiaGameRoomManager.gameRooms[roomId];
					}
				}
			}
		} else {
			// 로비에 있는 경우 퇴장 메시지 전송
			this.sendSystemLobbyChatMessage(`${player.name}님이 게임을 나갔습니다.`);
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
				// 새로 추가한 updateGameState 메서드를 사용하여 게임 상태 업데이트
				room.flowManager.updateGameState(dt);
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
		sendAdminConsoleMessage(`기본 게임 모드 로드: ${defaultModes.length}개`);

		defaultModes.forEach((mode) => {
			// 직업 객체에서 ID 목록 추출
			const jobs = mode.getJobs();
			const jobIds = jobs.map((job) => job.id);

			gameModes.push({
				id: mode.getId(),
				name: mode.getName(),
				description: mode.getDescription(),
				minPlayers: mode.getMinPlayers(),
				maxPlayers: mode.getMaxPlayers(),
				jobIds: jobIds,
			});
		});

		// 디버깅 로그
		sendAdminConsoleMessage(`게임 모드 UI 데이터 생성 완료: ${gameModes.length}개`);

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
	 * 모든 플레이어에게 방 목록 업데이트를 전송합니다.
	 */
	private updateRoomInfo() {
		const widgetManager = WidgetManager.instance;

		// 모든 방을 배열로 변환
		const roomsList = [];
		for (let i = 1; i <= Game.ROOM_COUNT; i++) {
			const room = this.mafiaGameRoomManager.getRoom(i.toString());
			if (room) {
				// 호스트 이름 가져오기
				let hostName = "알 수 없음";
				if (room.hostId) {
					const hostPlayer = getPlayerById(room.hostId);
					if (hostPlayer) {
						hostName = hostPlayer.name;
					}
				}

				roomsList.push({
					id: room.id,
					title: room.title,
					playerCount: room.getPlayersCount(),
					maxPlayers: room.maxPlayers,
					gameMode: room.gameMode.getName(),
					isPlaying: room.state === GameState.IN_PROGRESS,
					state: room.state,
					hostId: room.hostId,
					hostName: hostName,
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
			sendAdminConsoleMessage(`[Game] 새로운 방이 생성되었습니다: ${room.id} - ${room.title}`);
		});

		// 플레이어 입장 이벤트
		this.mafiaGameRoomManager.on("playerJoinedRoom", (room, player) => {
			// 방에 플레이어가 입장할 때도 방 목록 업데이트
			this.updateRoomInfo();
			sendAdminConsoleMessage(`[Game] 플레이어 ${player.name}가 방 ${room.id}에 입장했습니다.`);
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
						type: "gameStarting",
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
						type: "gameEnded",
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

	/**
	 * 로비 채팅 메시지를 모든 로비 플레이어에게 전송합니다.
	 */
	private sendLobbyChatMessage(sender: GamePlayer, content: string) {
		const widgetManager = WidgetManager.instance;

		// 메시지 객체 생성
		const chatMessage = {
			type: "chatMessage",
			senderId: sender.id,
			senderName: sender.name,
			content: content,
			timestamp: Date.now(),
		};

		// 로비에 있는 모든 플레이어에게 메시지 전송
		for (const p of ScriptApp.players) {
			const gamePlayer = p as unknown as GamePlayer;
			// 방에 입장하지 않은 플레이어만 메시지 전송
			if (!gamePlayer.tag?.roomInfo) {
				widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY, chatMessage);
			}
		}

		// 관리자 콘솔에 로그 (디버깅용)
		sendAdminConsoleMessage(`[Lobby Chat] ${sender.name}: ${content}`);
	}

	/**
	 * 시스템 메시지를 로비에 있는 모든 플레이어에게 전송합니다.
	 */
	private sendSystemLobbyChatMessage(content: string) {
		const widgetManager = WidgetManager.instance;

		// 시스템 메시지 객체 생성 (senderId와 senderName은 null로 설정)
		const chatMessage = {
			type: "chatMessage",
			senderId: null,
			senderName: null,
			content: content,
			timestamp: Date.now(),
		};

		// 로비에 있는 모든 플레이어에게 메시지 전송
		for (const p of ScriptApp.players) {
			const gamePlayer = p as unknown as GamePlayer;
			// 방에 입장하지 않은 플레이어만 메시지 전송
			if (!gamePlayer.tag?.roomInfo) {
				widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY, chatMessage);
			}
		}

		// 관리자 콘솔에 로그 (디버깅용)
		sendAdminConsoleMessage(`[Lobby System] ${content}`);
	}
}
