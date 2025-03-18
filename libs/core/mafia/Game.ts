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
		player.tag = {
			widget: {},
			mafiaPlayer: null,
			isReady: false,
			profile: {
				id: player.id,
				nickname: player.name,
				level: 1,
				experience: 0,
				avatar: "",
			},
		};
		// 로컬라이징
		Localizer.prepareLocalizationContainer(player);

		//@ts-ignore
		const customData = parseJsonString(player.customData);

		// 이전 게임 룸 정보가 있는지 확인
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
			}
		}

		// 로비 위젯 표시
		this.showLobbyWidget(player);
	}

	/**
	 * 로비 위젯을 표시합니다.
	 * @param player 플레이어
	 */
	private showLobbyWidget(player: GamePlayer) {
		// 이미 메인 위젯이 있으면 제거
		if (player.tag.widget.main) {
			player.tag.widget.main.destroy();
			player.tag.widget.main = null;
		}

		// 로비 위젯 생성
		player.tag.widget.main = player.showWidget("widgets/lobby_widget.html", "middle", 0, 0);

		// 초기화 메시지 전송
		player.tag.widget.main.sendMessage({
			type: "init",
			isMobile: player.isMobile,
			isTablet: player.isTablet,
			languageCode: player.language,
		});

		// 게임 모드 정보 전송
		player.tag.widget.main.sendMessage({
			type: "gameModes",
			modes: this.getGameModesForUI(),
		});

		// 유저 목록 전송
		this.sendUsersList(player);

		// 방 목록 전송
		this.sendRoomsList(player);

		// 로비 위젯 메시지 처리 설정
		player.tag.widget.main.onMessage.Add((sender: GamePlayer, data) => {
			if (data.type === "requestGameModes") {
				sender.tag.widget.main.sendMessage({
					type: "gameModes",
					modes: this.getGameModesForUI(),
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
						this.showRoomWidget(sender, room);

						// 모든 플레이어에게 방 목록 업데이트
						this.updateRoomInfo();
					} else {
						// 방 참가 실패 메시지 전송
						sender.tag.widget.main.sendMessage({
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
						this.showLobbyWidget(sender);

						// 모든 플레이어에게 방 정보 업데이트 전송
						this.updateRoomInfo();
					}
				}
			}
		});
	}

	/**
	 * 방 위젯을 표시합니다.
	 * @param player 플레이어
	 * @param room 게임 방
	 */
	private showRoomWidget(player: GamePlayer, room: GameRoom) {
		// 이미 메인 위젯이 있으면 제거
		if (player.tag.widget.main) {
			player.tag.widget.main.destroy();
			player.tag.widget.main = null;
		}

		// 방 위젯 생성
		player.tag.widget.room = player.showWidget("widgets/room_widget.html", "middle", 0, 0);

		// 초기화 메시지 전송
		player.tag.widget.room.sendMessage({
			type: "init",
			isMobile: player.isMobile,
			isTablet: player.isTablet,
			languageCode: player.language,
		});

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

		// 방에 있는 다른 플레이어들에게 새 플레이어 입장 알림
		this.notifyPlayerJoinedRoom(room, player);

		// 방 위젯 메시지 처리 설정
		player.tag.widget.room.onMessage.Add((sender: GamePlayer, data) => {
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
						// 방 위젯 닫고 로비 위젯 표시
						if (sender.tag.widget.room) {
							sender.tag.widget.room.destroy();
							sender.tag.widget.room = null;
						}
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
							sender.tag.widget.room.sendMessage({
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
								if (targetPlayer.tag?.widget?.room) {
									targetPlayer.tag.widget.room.destroy();
									targetPlayer.tag.widget.room = null;
								}
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

	/**
	 * 방 정보를 플레이어에게 전송합니다.
	 */
	private sendRoomInfoToPlayer(player: GamePlayer, room: GameRoom) {
		// player.tag나 widget.room이 없는 경우 처리
		if (!player?.tag?.widget?.room) {
			return;
		}

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
		player.tag.widget.room.sendMessage({
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
		// player.tag나 widget.room이 없는 경우 처리
		if (!player?.tag?.widget?.room) {
			return;
		}

		// 게임 모드 직업 정보 구성
		const jobs = gameMode.getJobs();
		const jobsData = jobs.map((job) => ({
			id: job.id,
			name: job.name,
			description: job.description,
			team: job.team,
		}));

		// 게임 모드 정보 전송
		player.tag.widget.room.sendMessage({
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
		const players = room.getPlayers() as MafiaPlayer[];
		players.forEach((p) => {
			// 자기 자신에게는 알림을 보내지 않음
			if (p.id !== player.id) {
				const gamePlayer = ScriptApp.getPlayerByID(p.id) as unknown as GamePlayer;
				if (gamePlayer?.tag?.widget?.room) {
					gamePlayer.tag.widget.room.sendMessage({
						type: "playerJoined",
						playerId: player.id,
						playerName: player.name,
					});

					// 방 정보 업데이트
					this.sendRoomInfoToPlayer(gamePlayer, room);
				}
			}
		});
	}

	/**
	 * 플레이어가 방을 나갔음을 알립니다.
	 */
	private notifyPlayerLeftRoom(room: GameRoom, player: GamePlayer) {
		// player가 없는 경우 처리
		if (!player) {
			return;
		}

		const players = room.getPlayers() as MafiaPlayer[];
		players.forEach((p) => {
			const gamePlayer = ScriptApp.getPlayerByID(p.id) as unknown as GamePlayer;
			if (gamePlayer?.tag?.widget?.room) {
				gamePlayer.tag.widget.room.sendMessage({
					type: "playerLeft",
					playerId: player.id,
					playerName: player.name,
				});

				// 방 정보 업데이트
				this.sendRoomInfoToPlayer(gamePlayer, room);
			}
		});
	}

	/**
	 * 플레이어가 강퇴되었음을 알립니다.
	 */
	private notifyPlayerKicked(room: GameRoom, player: GamePlayer) {
		// player가 없는 경우 처리
		if (!player) {
			return;
		}

		const players = room.getPlayers() as MafiaPlayer[];
		players.forEach((p) => {
			const gamePlayer = ScriptApp.getPlayerByID(p.id) as unknown as GamePlayer;
			if (gamePlayer?.tag?.widget?.room) {
				gamePlayer.tag.widget.room.sendMessage({
					type: "playerKicked",
					playerId: player.id,
					playerName: player.name,
				});

				// 방 정보 업데이트
				this.sendRoomInfoToPlayer(gamePlayer, room);
			}
		});
	}

	/**
	 * 준비 상태 변경을 알립니다.
	 */
	private notifyReadyStatusChanged(room: GameRoom, player: GamePlayer) {
		// player나 player.tag가 없는 경우 처리
		if (!player || !player.tag) {
			return;
		}

		const players = room.getPlayers() as MafiaPlayer[];
		players.forEach((p) => {
			const gamePlayer = ScriptApp.getPlayerByID(p.id) as unknown as GamePlayer;
			if (gamePlayer?.tag?.widget?.room) {
				gamePlayer.tag.widget.room.sendMessage({
					type: "readyStatusChanged",
					playerId: player.id,
					isReady: player.tag.isReady,
				});

				// 방 정보 업데이트
				this.sendRoomInfoToPlayer(gamePlayer, room);
			}
		});
	}

	/**
	 * 게임 시작을 알립니다.
	 */
	private notifyGameStarting(room: GameRoom) {
		const players = room.getPlayers() as MafiaPlayer[];
		players.forEach((p) => {
			const gamePlayer = ScriptApp.getPlayerByID(p.id) as unknown as GamePlayer;
			if (gamePlayer?.tag?.widget?.room) {
				gamePlayer.tag.widget.room.sendMessage({
					type: "gameStarting",
				});
			}
		});
	}

	/**
	 * 채팅 메시지를 방의 모든 플레이어에게 전송합니다.
	 */
	private sendChatMessageToRoom(room: GameRoom, sender: GamePlayer, content: string) {
		// sender가 없는 경우 처리
		if (!sender) {
			return;
		}

		const players = room.getPlayers() as MafiaPlayer[];
		players.forEach((p) => {
			const gamePlayer = ScriptApp.getPlayerByID(p.id) as unknown as GamePlayer;
			if (gamePlayer?.tag?.widget?.room) {
				gamePlayer.tag.widget.room.sendMessage({
					type: "chatMessage",
					senderId: sender.id,
					senderName: sender.name,
					content: content,
				});
			}
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
		// 이미 게임 모드 선택 위젯이 있으면 제거
		if (player.tag.widget.gameModeSelect) {
			player.tag.widget.gameModeSelect.destroy();
			player.tag.widget.gameModeSelect = null;
		}

		// 게임 모드 선택 위젯 생성
		player.tag.widget.gameModeSelect = player.showWidget("widgets/game_mode_select.html", "middle", 0, 0);

		// 초기화 메시지 전송
		player.tag.widget.gameModeSelect.sendMessage({
			type: "init",
			isMobile: player.isMobile,
			isTablet: player.isTablet,
		});

		// 게임 모드 정보 전송
		player.tag.widget.gameModeSelect.sendMessage({
			type: "init_game_modes",
			modes: GAME_MODES,
			jobs: JOBS,
		});

		// 게임 모드 선택 위젯 메시지 처리
		player.tag.widget.gameModeSelect.onMessage.Add((player, data) => {
			if (data.type === "cancel_mode_select") {
				player.tag.widget.gameModeSelect.destroy();
				player.tag.widget.gameModeSelect = null;
			} else if (data.type === "select_game_mode") {
				const modeId = data.modeId;
				const room = this.mafiaGameRoomManager.getRoom("1");

				// 게임 모드 설정
				room.flowManager.setGameMode(modeId);

				// 게임 시작
				room.flowManager.startGame();

				// 위젯 제거
				player.tag.widget.gameModeSelect.destroy();
				player.tag.widget.gameModeSelect = null;

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
		// 이미 역할 카드 위젯이 있으면 제거
		if (player.tag.widget.roleCard) {
			player.tag.widget.roleCard.destroy();
		}

		// 역할 카드 위젯 생성
		player.tag.widget.roleCard = player.showWidget("widgets/role_card.html", "middle", 0, 0);

		// 초기화 메시지 전송
		player.tag.widget.roleCard.sendMessage({
			type: "init",
			isMobile: player.isMobile,
			isTablet: player.isTablet,
		});

		// 역할 정보 전송
		player.tag.widget.roleCard.sendMessage({
			type: "setRole",
			role: role,
		});

		// 역할 카드 위젯 메시지 처리
		player.tag.widget.roleCard.onMessage.Add((player, data) => {
			if (data.type === "close") {
				player.tag.widget.roleCard.destroy();
				player.tag.widget.roleCard = null;
			}
		});
	}

	private onLeavePlayer(player: GamePlayer) {
		// player나 player.tag가 없는 경우 처리
		if (!player || !player.tag) {
			return;
		}

		// 플레이어가 속한 방이 있으면 해당 방에서 제거
		if (player.tag.roomInfo) {
			const roomNum = player.tag.roomInfo.roomNum;
			const room = this.mafiaGameRoomManager.getRoom(roomNum.toString());

			if (room) {
				// 방에서 플레이어 제거
				room.leavePlayer(player.id);

				// 위젯 정리
				if (player.tag.widget) {
					if (player.tag.widget.room) {
						player.tag.widget.room.destroy();
						player.tag.widget.room = null;
					}

					if (player.tag.widget.main) {
						player.tag.widget.main.destroy();
						player.tag.widget.main = null;
					}
				}

				// 모든 플레이어에게 방 정보 업데이트 전송
				this.updateRoomInfo();
			}
		}
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
		defaultModes.forEach((mode) => {
			gameModes.push({
				id: mode.getId(),
				name: mode.getName(),
				description: mode.getDescription(),
			});
		});
		return gameModes;
	}

	/**
	 * 방 목록을 플레이어에게 전송합니다.
	 */
	private sendRoomsList(player: GamePlayer) {
		// player.tag나 widget.main이 없는 경우 처리
		if (!player?.tag?.widget?.main) {
			return;
		}

		const rooms = [];
		for (let i = 1; i <= Game.ROOM_COUNT; i++) {
			const room = this.mafiaGameRoomManager.getRoom(i.toString());
			if (room) {
				const players = room.getPlayers();
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

				rooms.push({
					id: room.id,
					title: room.title,
					state: room.flowManager.isGameInProgress() ? "IN_PROGRESS" : "WAITING",
					host: {
						id: hostId,
						name: hostName,
					},
					players: players.map((p) => ({
						id: p.id,
						name: p.name,
					})),
					maxPlayers: room.maxPlayers,
					gameMode: room.gameMode.getName(),
				});
			}
		}

		player.tag.widget.main.sendMessage({
			type: "updateRooms",
			rooms: rooms,
		});
	}

	/**
	 * 유저 목록을 플레이어에게 전송합니다.
	 */
	private sendUsersList(player: GamePlayer) {
		// player.tag나 widget.main이 없는 경우 처리
		if (!player?.tag?.widget?.main) {
			return;
		}

		const users = [];

		// 모든 플레이어를 순회하며 필요한 정보만 추출
		ScriptApp.players.forEach((p) => {
			const gamePlayer = p as unknown as GamePlayer;
			users.push({
				id: p.id,
				name: p.name,
				level: gamePlayer?.tag?.profile?.level || 1, // 플레이어 프로필에서 레벨 가져오기
			});
		});

		player.tag.widget.main.sendMessage({
			type: "updateUsers",
			users: users,
		});
	}

	/**
	 * 모든 플레이어에게 방 정보를 업데이트합니다.
	 */
	private updateRoomInfo() {
		// 모든 플레이어에게 방 정보와 유저 목록 전송
		ScriptApp.players.forEach((p) => {
			// GamePlayer 타입으로 변환 (타입 단언 사용)
			const gamePlayer = p as unknown as GamePlayer;
			if (gamePlayer.tag?.widget?.main) {
				this.sendRoomsList(gamePlayer);
				this.sendUsersList(gamePlayer);
			}
		});
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
