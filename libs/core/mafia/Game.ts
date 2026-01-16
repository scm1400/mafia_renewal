import { getPlayerById, parseJsonString, sendAdminConsoleMessage } from "../../utils/Common";
import { showLabel } from "../../utils/CustomLabelFunctions";
import { Localizer } from "../../utils/Localizer";
import { GameBase } from "../GameBase";
import { GameState } from "./managers/gameFlow/GameFlowManager";
import { GameRoomManager } from "./managers/gameRoom/GameRoomManager";
import { GamePlayer } from "./types/GamePlayer";
import { GameMode } from "./gameMode/GameMode";
import { createDefaultGameModes } from "./gameMode/defaultGameModes";
import { getGameModeConfigById, JobId } from "./types/JobTypes";
import { GameRoom } from "./managers/gameRoom/GameRoom";
import { MafiaPlayer } from "./managers/gameFlow/GameFlowManager";
import { WidgetManager } from "./managers/widget/WidgetManager";
import { WidgetType } from "./managers/widget/WidgetType";
import { SpriteManager, SpriteType } from "./managers/Sprite/SpriteManager";
import { CommandParser } from "./managers/command/CommandParser";
import { CommandManager } from "./managers/command/CommandManager";
import { registerCheatCommands } from "./managers/command/CheatCommands";

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
		// ScriptApp.showName = false;
		// ScriptApp.sendUpdated();
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

		// 치트 명령어 등록
		registerCheatCommands();

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

		// const color = Math.floor(Math.random() * 12);
		// //@ts-ignore
		// player.setAvatarParts({
		// 	hairId: 61 + color,
		// 	clothesId: 61 + color,
		// })

		// player.sprite = SpriteManager.getInstance().getSprite(SpriteType.CHARACTER_BASIC);

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
							type: "init",
							myPlayerId: player.id,
							myName: player.name,
							myRole: "medium",
							//TODO: 영매 채팅 위젯 초기화 데이터 전송
							// isNight: room.flowManager.currentPhase === MafiaPhase.NIGHT,
							// messages: this.chatMessages.filter((msg) => msg.target === "dead"),
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

		// 로비 네비게이션 바와 채팅 위젯 표시
		widgetManager.showWidget(player, WidgetType.LOBBY_NAVBAR);
		widgetManager.showWidget(player, WidgetType.LOBBY_CHAT);
		// LOBBY 위젯은 navbar 버튼 클릭 시에만 표시

		// 약간의 딜레이 후 데이터 전송 (위젯이 준비될 시간을 줌)
		ScriptApp.runLater(() => {
			// 네비게이션 바 초기화
			widgetManager.sendMessageToWidget(player, WidgetType.LOBBY_NAVBAR, {
				type: "init",
				isMobile: player.isMobile,
				isTablet: false,
			});

			// 로비 채팅 초기화
			widgetManager.sendMessageToWidget(player, WidgetType.LOBBY_CHAT, {
				type: "init",
				isMobile: player.isMobile,
				isTablet: false,
				userId: player.id,
				userName: player.name,
			});

			// 로비 위젯 초기화 (방 목록 팝업)
			widgetManager.sendMessageToWidget(player, WidgetType.LOBBY, {
				type: "init",
				isMobile: player.isMobile,
				isTablet: false,
				userId: player.id,
				userName: player.name,
			});

			// 게임 모드 정보 전송 (로비 위젯용)
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

		// ========== 로비 네비게이션 바 메시지 핸들러 ==========
		const lobbyNavbar = widgetManager.getWidget(player, WidgetType.LOBBY_NAVBAR);
		if (lobbyNavbar && lobbyNavbar.element) {
			if (player.tag.lobbyNavbarMessageHandler) {
				lobbyNavbar.element.onMessage.Remove(player.tag.lobbyNavbarMessageHandler);
			}

			const navbarHandler = (sender: GamePlayer, data) => {
				if (data.type === "openLobby") {
					// 방 목록 팝업 표시
					widgetManager.showWidget(sender, WidgetType.LOBBY);
					widgetManager.sendMessageToWidget(sender, WidgetType.LOBBY_NAVBAR, { type: "lobbyOpened" });
				} else if (data.type === "closeLobby") {
					// 방 목록 팝업 숨김
					widgetManager.hideWidget(sender, WidgetType.LOBBY);
					widgetManager.sendMessageToWidget(sender, WidgetType.LOBBY_NAVBAR, { type: "lobbyClosed" });
				} else if (data.type === "openUsers") {
					// 유저 목록 팝업 (추후 구현)
					widgetManager.sendMessageToWidget(sender, WidgetType.LOBBY_NAVBAR, { type: "usersOpened" });
				} else if (data.type === "closeUsers") {
					// 유저 목록 팝업 닫기
					widgetManager.sendMessageToWidget(sender, WidgetType.LOBBY_NAVBAR, { type: "usersClosed" });
				} else if (data.type === "openRoomPopup") {
					// 방 상태일 때 참가자 팝업 표시 요청
					if (sender.tag.roomInfo) {
						widgetManager.showWidget(sender, WidgetType.LOBBY);
						widgetManager.sendMessageToWidget(sender, WidgetType.LOBBY, { type: "showRoomPopup" });
					}
				} else if (data.type === "leaveRoom") {
					// 방 나가기
					if (sender.tag.roomInfo) {
						const roomNum = sender.tag.roomInfo.roomNum;
						const room = this.mafiaGameRoomManager.getRoom(roomNum.toString());
						if (room) {
							room.leavePlayer(sender.id);
							this.exitRoomState(sender);
							this.notifyPlayerLeftRoom(room, sender);
							this.updateRoomInfo();
						}
					}
				}
			};

			lobbyNavbar.element.onMessage.Add(navbarHandler);
			player.tag.lobbyNavbarMessageHandler = navbarHandler;
		}

		// ========== 로비 채팅 메시지 핸들러 ==========
		const lobbyChat = widgetManager.getWidget(player, WidgetType.LOBBY_CHAT);
		if (lobbyChat && lobbyChat.element) {
			if (player.tag.lobbyChatMessageHandler) {
				lobbyChat.element.onMessage.Remove(player.tag.lobbyChatMessageHandler);
			}

			const chatHandler = (sender: GamePlayer, data) => {
				if (data.type === "lobbyChatMessage" && data.content) {
					// 명령어 확인
					if (CommandParser.isCommand(data.content)) {
						const parsed = CommandParser.parse(data.content);
						if (parsed) {
							const executed = CommandManager.instance.executeCommand(parsed.command, parsed.args, {
								player: sender,
								room: null,
								flowManager: null,
							});
							if (executed) return;
						}
					}
					// 일반 채팅 메시지 처리
					this.sendLobbyChatMessage(sender, data.content);
				} else if (data.type === "roomChatMessage" && data.content) {
					// 방 채팅 메시지 처리
					const roomId = sender.tag.roomInfo?.roomNum;
					if (roomId) {
						const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
						if (room) {
							this.sendRoomChatMessage(room, sender, data.content);
						}
					}
				}
			};

			lobbyChat.element.onMessage.Add(chatHandler);
			player.tag.lobbyChatMessageHandler = chatHandler;
		}

		// ========== 로비 위젯 (방 목록 팝업) 메시지 핸들러 ==========
		const lobbyWidget = widgetManager.getWidget(player, WidgetType.LOBBY);
		if (lobbyWidget && lobbyWidget.element) {
			if (player.tag.lobbyWidgetMessageHandler) {
				lobbyWidget.element.onMessage.Remove(player.tag.lobbyWidgetMessageHandler);
			}

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
				} else if (data.type === "lobbyClosed") {
					// navbar에 상태 동기화
					widgetManager.sendMessageToWidget(sender, WidgetType.LOBBY_NAVBAR, { type: "lobbyClosed" });
				} else if (data.type === "createRoom" && data.data) {
					const { title, maxPlayers, gameModeId } = data.data;

					if (getGameModeConfigById(gameModeId)) {
						const room = this.mafiaGameRoomManager.createRoom({
							title,
							maxPlayers,
							gameModeId: gameModeId,
						});

						if (room) {
							room.joinPlayer(sender);

							// 방 상태로 전환 (enterRoom 메시지 전송)
							this.enterRoomState(sender, room);

							this.updateRoomInfo();
						}
					}
				} else if (data.type === "joinRoom" && data.roomId) {
					const room = this.mafiaGameRoomManager.getRoom(data.roomId);
					if (room) {
						const joinResult = room.joinPlayer(sender);

						if (joinResult) {
							// 방 상태로 전환 (enterRoom 메시지 전송)
							this.enterRoomState(sender, room);

							this.updateRoomInfo();
						} else {
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

							// 로비 상태로 전환 (exitRoom 메시지 전송)
							this.exitRoomState(sender);

							this.updateRoomInfo();
						}
					}
				}
				// Room operations from lobby widget
				else if (data.type === "requestRoomInfo") {
					const roomId = sender.tag.roomInfo?.roomNum;
					if (roomId) {
						const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
						if (room) {
							const roomData = this.buildRoomData(sender, room);
							widgetManager.sendMessageToWidget(sender, WidgetType.LOBBY, {
								type: "roomInfo",
								roomData: roomData,
							});
						}
					}
				} else if (data.type === "requestGameModeDetails") {
					const roomId = sender.tag.roomInfo?.roomNum;
					if (roomId) {
						const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
						if (room) {
							this.sendGameModeDetailsToLobbyWidget(sender, room.gameMode);
						}
					}
				} else if (data.type === "setReady") {
					const roomId = sender.tag.roomInfo?.roomNum;
					if (roomId) {
						const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
						if (room) {
							sender.tag.isReady = true;
							this.notifyReadyStatusChanged(room, sender);
						}
					}
				} else if (data.type === "cancelReady") {
					const roomId = sender.tag.roomInfo?.roomNum;
					if (roomId) {
						const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
						if (room) {
							sender.tag.isReady = false;
							this.notifyReadyStatusChanged(room, sender);
						}
					}
				} else if (data.type === "startGame") {
					const roomId = sender.tag.roomInfo?.roomNum;
					if (roomId) {
						const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
						if (room) {
							const canStart = this.canStartGame(room);
							if (canStart) {
								room.state = GameState.IN_PROGRESS;
								if (!room.hostId) {
									room.hostId = sender.id;
								}
								room.flowManager.startGame();
								this.updateRoomInfo();
							} else {
								widgetManager.sendMessageToWidget(sender, WidgetType.LOBBY, {
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
						if (room && room.hostId === sender.id) {
							const targetPlayer = ScriptApp.getPlayerByID(data.playerId) as unknown as GamePlayer;
							if (targetPlayer) {
								room.leavePlayer(targetPlayer.id);
								this.exitRoomState(targetPlayer);
								this.showLobbyWidget(targetPlayer);
								this.notifyPlayerKicked(room, targetPlayer);
								this.updateRoomInfo();
							}
						}
					}
				}
			};

			lobbyWidget.element.onMessage.Add(messageHandler);
			player.tag.lobbyWidgetMessageHandler = messageHandler;
		}
	}

	/**
	 * 로비 팝업만 숨깁니다 (방 입장 시 navbar와 chat은 유지).
	 * @param player 플레이어
	 */
	private hideLobbyPopup(player: GamePlayer) {
		const widgetManager = WidgetManager.instance;
		// LOBBY 팝업만 숨김, navbar와 chat은 ROOM 상태로 전환
		widgetManager.hideWidget(player, WidgetType.LOBBY);
	}

	/**
	 * 모든 로비 관련 위젯을 숨깁니다 (완전히 숨김).
	 * @param player 플레이어
	 */
	private hideLobbyWidgets(player: GamePlayer) {
		const widgetManager = WidgetManager.instance;
		widgetManager.hideWidget(player, WidgetType.LOBBY_NAVBAR);
		widgetManager.hideWidget(player, WidgetType.LOBBY);
		widgetManager.hideWidget(player, WidgetType.LOBBY_CHAT);
	}

	/**
	 * 방 상태로 전환합니다 (enterRoom 메시지를 모든 로비 위젯에 전송).
	 * @param player 플레이어
	 * @param room 게임 방
	 */
	private enterRoomState(player: GamePlayer, room: GameRoom) {
		const widgetManager = WidgetManager.instance;

		// LOBBY 팝업만 숨김
		this.hideLobbyPopup(player);

		// 방 데이터 구성
		const roomData = this.buildRoomData(player, room);

		// 모든 로비 위젯에 enterRoom 메시지 전송
		widgetManager.sendMessageToWidget(player, WidgetType.LOBBY_NAVBAR, {
			type: "enterRoom",
			roomData: roomData,
		});

		widgetManager.sendMessageToWidget(player, WidgetType.LOBBY, {
			type: "enterRoom",
			roomData: roomData,
		});

		widgetManager.sendMessageToWidget(player, WidgetType.LOBBY_CHAT, {
			type: "enterRoom",
			roomData: roomData,
		});

		// 약간의 딜레이 후 게임 모드 정보 전송
		ScriptApp.runLater(() => {
			this.sendGameModeDetailsToLobbyWidget(player, room.gameMode);
		}, 0.1);

		// 방에 있는 다른 플레이어들에게 새 플레이어 입장 알림
		this.notifyPlayerJoinedRoom(room, player);
	}

	/**
	 * 로비 상태로 전환합니다 (exitRoom 메시지를 모든 로비 위젯에 전송).
	 * @param player 플레이어
	 */
	private exitRoomState(player: GamePlayer) {
		const widgetManager = WidgetManager.instance;

		// 모든 로비 위젯에 exitRoom 메시지 전송
		widgetManager.sendMessageToWidget(player, WidgetType.LOBBY_NAVBAR, {
			type: "exitRoom",
		});

		widgetManager.sendMessageToWidget(player, WidgetType.LOBBY, {
			type: "exitRoom",
		});

		widgetManager.sendMessageToWidget(player, WidgetType.LOBBY_CHAT, {
			type: "exitRoom",
		});
	}

	/**
	 * 방 데이터를 구성합니다.
	 */
	private buildRoomData(player: GamePlayer, room: GameRoom) {
		const players = room.getPlayers() as MafiaPlayer[];
		let hostName = "알 수 없음";
		let hostId = room.hostId || "";

		if (room.hostId) {
			const hostPlayer = players.find((p) => p.id === hostId);
			if (hostPlayer) {
				hostName = hostPlayer.name;
			} else {
				const gamePlayer = getPlayerById(hostId);
				if (gamePlayer) {
					hostName = gamePlayer.name;
				}
			}
		}

		const playersList = players.map((p) => {
			const gamePlayer = getPlayerById(p.id);
			return {
				id: p.id,
				name: p.name,
				level: gamePlayer?.tag?.profile?.level || 1,
				isReady: gamePlayer?.tag?.isReady || false,
			};
		});

		// 준비된 플레이어 수 계산
		const readyCount = playersList.filter((p) => p.isReady || p.id === hostId).length;

		return {
			id: room.id,
			title: room.title,
			maxPlayers: room.maxPlayers,
			playerCount: players.length,
			readyCount: readyCount,
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
		};
	}

	/**
	 * 게임 모드 상세 정보를 로비 위젯에 전송합니다.
	 */
	private sendGameModeDetailsToLobbyWidget(player: GamePlayer, gameMode: GameMode) {
		const widgetManager = WidgetManager.instance;

		const jobs = gameMode.getJobs();
		const jobsData = jobs.map((job) => ({
			id: job.id,
			name: job.name,
			description: job.description,
			team: job.team,
		}));

		widgetManager.sendMessageToWidget(player, WidgetType.LOBBY, {
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
	 * 방 정보를 플레이어에게 전송합니다 (통합 로비 위젯으로).
	 */
	private sendRoomInfoToPlayer(player: GamePlayer, room: GameRoom) {
		const widgetManager = WidgetManager.instance;
		const roomData = this.buildRoomData(player, room);

		// 로비 위젯으로 방 정보 전송
		widgetManager.sendMessageToWidget(player, WidgetType.LOBBY, {
			type: "roomInfo",
			roomData: roomData,
		});

		// navbar에 상태 업데이트
		widgetManager.sendMessageToWidget(player, WidgetType.LOBBY_NAVBAR, {
			type: "updateRoomStatus",
			title: roomData.title,
			readyCount: roomData.readyCount,
			playerCount: roomData.playerCount,
		});
	}

	/**
	 * @deprecated Use sendGameModeDetailsToLobbyWidget instead
	 */
	private sendGameModeDetailsToPlayer(player: GamePlayer, gameMode: GameMode) {
		this.sendGameModeDetailsToLobbyWidget(player, gameMode);
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

				// 시스템 메시지로 입장 알림
				widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY_CHAT, {
					type: "systemMessage",
					content: `${player.name}님이 입장했습니다.`,
				});

				// 로비 위젯에 playerJoined 알림
				widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY, {
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
		const widgetManager = WidgetManager.instance;

		// 남은 플레이어들에게 알림
		room.actionToRoomPlayers((p) => {
			// 자신은 제외
			if (p.id === player.id) return;

			const gamePlayer = getPlayerById(p.id);
			if (!gamePlayer) return;

			// 시스템 메시지로 퇴장 알림
			widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY_CHAT, {
				type: "systemMessage",
				content: `${player.name}님이 퇴장했습니다.`,
			});

			// 로비 위젯에 playerLeft 알림
			widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY, {
				type: "playerLeft",
				playerId: player.id,
				playerName: player.name,
			});

			// 방 정보 업데이트
			this.sendRoomInfoToPlayer(gamePlayer, room);
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

			// 시스템 메시지로 준비 상태 알림
			const statusMsg = player.tag.isReady
				? `${player.name}님이 준비 완료했습니다.`
				: `${player.name}님이 준비를 취소했습니다.`;
			widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY_CHAT, {
				type: "systemMessage",
				content: statusMsg,
			});

			// 로비 위젯에 readyStatusChanged 알림
			widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY, {
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
		const widgetManager = WidgetManager.instance;

		// 로비 상태로 전환 (exitRoom 메시지 전송)
		this.exitRoomState(player);

		// 강퇴 알림
		showLabel(player, "방에서 강퇴되었습니다.");

		// 방에 남아있는 플레이어들에게 알림
		const players = room.getPlayers() as MafiaPlayer[];
		players.forEach((p) => {
			const gamePlayer = ScriptApp.getPlayerByID(p.id) as unknown as GamePlayer;
			if (gamePlayer) {
				// 시스템 메시지로 강퇴 알림
				widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY_CHAT, {
					type: "systemMessage",
					content: `${player.name}님이 강퇴되었습니다.`,
				});

				// 로비 위젯에 playerKicked 알림
				widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY, {
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
	 * 채팅 메시지를 방 전체에 전송합니다 (통합 로비 채팅 위젯으로).
	 */
	private sendRoomChatMessage(room: GameRoom, sender: GamePlayer, content: string) {
		const widgetManager = WidgetManager.instance;

		//@ts-ignore
		sender.sendMessageBubbleOnly(content);

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
			widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY_CHAT, chatMessage);
		});

		// 관리자 콘솔에 로그
		sendAdminConsoleMessage(`[Room Chat ${room.id}] ${sender.name}: ${content}`);
	}

	/**
	 * @deprecated Use sendRoomChatMessage instead
	 */
	private sendChatMessageToRoom(room: GameRoom, sender: GamePlayer, content: string) {
		this.sendRoomChatMessage(room, sender, content);
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

		// navbar에 접속자 수 업데이트
		widgetManager.sendMessageToWidget(player, WidgetType.LOBBY_NAVBAR, {
			type: "updateOnlineCount",
			count: usersList.length,
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

				// navbar에 접속자 수 업데이트
				widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY_NAVBAR, {
					type: "updateOnlineCount",
					count: usersList.length,
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

		// 대기중인 방 수 계산
		const waitingRoomCount = roomsList.filter(r => r.state === GameState.WAITING).length;

		// 로비에 있는 모든 플레이어에게 방 목록 전송
		for (const p of ScriptApp.players) {
			const gamePlayer = p as unknown as GamePlayer;
			// 방에 입장하지 않은 플레이어만 업데이트
			if (!gamePlayer.tag?.roomInfo) {
				widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY, {
					type: "roomsList",
					rooms: roomsList,
				});

				// navbar에 대기중 방 수 업데이트
				widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY_NAVBAR, {
					type: "updateRoomCount",
					count: waitingRoomCount,
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
			// 로비 상태로 전환 (exitRoom 메시지 전송)
			this.exitRoomState(player);

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
			const widgetManager = WidgetManager.instance;

			// 모든 플레이어에게 게임 시작 알림
			room.actionToRoomPlayers((player) => {
				const gamePlayer = getPlayerById(player.id);
				if (!gamePlayer) return;

				// 게임 시작 시스템 메시지 전송
				widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY_CHAT, {
					type: "systemMessage",
					content: "게임이 곧 시작됩니다...",
				});

				// 로비 위젯 숨김 (게임이 시작되면 로비 UI 숨김)
				widgetManager.hideWidget(gamePlayer, WidgetType.LOBBY);
			});
		});

		// 게임 종료 이벤트
		this.mafiaGameRoomManager.on("gameEnded", (room) => {
			const widgetManager = WidgetManager.instance;

			// 모든 플레이어에게 게임 종료 알림
			room.actionToRoomPlayers((player) => {
				const gamePlayer = getPlayerById(player.id);
				if (!gamePlayer) return;

				// 게임 종료 시스템 메시지 전송
				widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY_CHAT, {
					type: "systemMessage",
					content: "게임이 종료되었습니다.",
				});
			});

			// 방 정보 업데이트
			this.updateRoomInfo();
		});
	}

	/**
	 * 호스트 변경을 알립니다.
	 */
	private notifyHostChanged(room: GameRoom, newHost: GamePlayer) {
		const widgetManager = WidgetManager.instance;

		const players = room.getPlayers() as MafiaPlayer[];
		players.forEach((p) => {
			const gamePlayer = ScriptApp.getPlayerByID(p.id) as unknown as GamePlayer;
			if (gamePlayer) {
				// 시스템 메시지로 호스트 변경 알림
				widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY_CHAT, {
					type: "systemMessage",
					content: `${newHost.name}님이 새로운 방장이 되었습니다.`,
				});

				// 로비 위젯에 hostChanged 알림
				widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY, {
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
		//@ts-ignore
		sender.sendMessageBubbleOnly(content);
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
				widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY_CHAT, chatMessage);
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
				widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY_CHAT, chatMessage);
			}
		}

		// 관리자 콘솔에 로그 (디버깅용)
		sendAdminConsoleMessage(`[Lobby System] ${content}`);
	}
}
