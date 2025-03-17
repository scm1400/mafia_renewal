import { parseJsonString } from "../../utils/Common";
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

const ROOM_COUNT = 1;
export class Game extends GameBase {
	private static _instance: Game;

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
		gameModes.forEach(mode => {
			this.mafiaGameRoomManager.registerGameMode(mode);
		});
		
		// 기본 게임방 생성
		const defaultGameMode = gameModes.find(mode => mode.getId() === "classic") || gameModes[0];
		this.mafiaGameRoomManager.createRoom({
			title: "기본 게임방",
			gameMode: defaultGameMode,
			maxPlayers: 8
		});
	}

	private onStart() {
		ScriptApp.enableFreeView = false;
		ScriptApp.sendUpdated();
	}

	private onJoinPlayer(player: GamePlayer) {
		player.tag = {
			widget: {},
			mafiaPlayer: null
		};
		// 로컬라이징
		Localizer.prepareLocalizationContainer(player);

		//@ts-ignore
		const customData = parseJsonString(player.customData);

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
		}
		
		// 로비 위젯 생성
		player.tag.widget.main = player.showWidget("widgets/lobby_widget.html", "middle", 0, 0);
		
		// 초기화 메시지 전송
		player.tag.widget.main.sendMessage({ 
			type: "init", 
			message: "코드 마피아",
			isMobile: player.isMobile,
			isTablet: player.isTablet
		});
		
		// 게임 방 정보 전송
		const rooms = [];
		for (let i = 1; i <= ROOM_COUNT; i++) {
			const room = this.mafiaGameRoomManager.getRoom(i.toString());
			if (room) {
				rooms.push({
					id: room.id,
					title: room.title,
					playerCount: room.getPlayersCount(),
					maxPlayers: room.maxPlayers,
					gameMode: room.gameMode.getName(),
					isInProgress: room.flowManager.isGameInProgress()
				});
			}
		}
		
		player.tag.widget.main.sendMessage({
			type: "updateRooms",
			rooms: rooms
		});

		// 로비 위젯 메시지 처리 설정
		player.tag.widget.main.onMessage.Add((player, data) => {
			if (data.type === "showRoleDetail" && data.role) {
				this.showRoleCard(player, data.role);
			} else if (data.type === "startGame") {
				this.showGameModeSelect(player);
			} else if (data.type === "joinRoom" && data.roomId) {
				const room = this.mafiaGameRoomManager.getRoom(data.roomId);
				if (room) {
					room.joinPlayer(player);
					
					// 방 참가 후 UI 업데이트
					player.tag.widget.main.sendMessage({
						type: "joinedRoom",
						roomId: data.roomId,
						roomInfo: {
							id: room.id,
							title: room.title,
							playerCount: room.getPlayersCount(),
							maxPlayers: room.maxPlayers,
							gameMode: room.gameMode.getName(),
							isInProgress: room.flowManager.isGameInProgress()
						}
					});
					
					// 모든 플레이어에게 방 정보 업데이트 전송
					this.updateRoomInfo();
				}
			} else if (data.type === "leaveRoom") {
				if (player.tag.roomInfo) {
					const roomNum = player.tag.roomInfo.roomNum;
					this.mafiaGameRoomManager.getRoom(roomNum.toString()).leavePlayer(player.id);
					
					// 방 퇴장 후 UI 업데이트
					player.tag.widget.main.sendMessage({
						type: "leftRoom"
					});
					
					// 모든 플레이어에게 방 정보 업데이트 전송
					this.updateRoomInfo();
				}
			} else if (data.type === "refreshRooms") {
				// 게임 방 정보 업데이트 전송
				const rooms = [];
				for (let i = 1; i <= ROOM_COUNT; i++) {
					const room = this.mafiaGameRoomManager.getRoom(i.toString());
					if (room) {
						rooms.push({
							id: room.id,
							title: room.title,
							playerCount: room.getPlayersCount(),
							maxPlayers: room.maxPlayers,
							gameMode: room.gameMode.getName(),
							isInProgress: room.flowManager.isGameInProgress()
						});
					}
				}
				
				player.tag.widget.main.sendMessage({
					type: "updateRooms",
					rooms: rooms
				});
			}
		});
	}

	/**
	 * 게임 모드 선택 위젯을 표시합니다.
	 * @param player 플레이어
	 */
	private showGameModeSelect(player: GamePlayer) {
		// 이미 게임 모드 선택 위젯이 있으면 제거
		if (player.tag.widget.gameModeSelect) {
			player.tag.widget.gameModeSelect.destroy();
		}
		
		// 게임 모드 선택 위젯 생성
		player.tag.widget.gameModeSelect = player.showWidget("widgets/game_mode_select.html", "middle", 0, 0);
		
		// 초기화 메시지 전송
		player.tag.widget.gameModeSelect.sendMessage({
			type: 'init',
			isMobile: player.isMobile,
			isTablet: player.isTablet
		});
		
		// 게임 모드 정보 전송
		player.tag.widget.gameModeSelect.sendMessage({
			type: 'init_game_modes',
			modes: GAME_MODES,
			jobs: JOBS
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
			type: 'init',
			isMobile: player.isMobile,
			isTablet: player.isTablet
		});
		
		// 역할 정보 전송
		player.tag.widget.roleCard.sendMessage({
			type: 'setRole',
			role: role
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
		// 플레이어가 속한 방이 있으면 해당 방에서 제거
		if (player.tag.roomInfo) {
			const roomNum = player.tag.roomInfo.roomNum;
			this.mafiaGameRoomManager.getRoom(roomNum.toString()).leavePlayer(player.id);
		}
	}

	private update(dt: number) {
		// 각 방의 게임 상태 업데이트
		for (let i = 1; i <= ROOM_COUNT; i++) {
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
	 * 모든 플레이어에게 방 정보를 업데이트합니다.
	 */
	private updateRoomInfo() {
		// 게임 방 정보 수집
		const rooms = [];
		for (let i = 1; i <= ROOM_COUNT; i++) {
			const room = this.mafiaGameRoomManager.getRoom(i.toString());
			if (room) {
				rooms.push({
					id: room.id,
					title: room.title,
					playerCount: room.getPlayersCount(),
					maxPlayers: room.maxPlayers,
					gameMode: room.gameMode.getName(),
					isInProgress: room.flowManager.isGameInProgress()
				});
			}
		}
		
		// 모든 플레이어에게 업데이트된 방 정보 전송
		ScriptApp.players.forEach(player => {
			if (player.tag?.widget?.main) {
				player.tag.widget.main.sendMessage({
					type: "updateRooms",
					rooms: rooms
				});
			}
		});
	}
}
