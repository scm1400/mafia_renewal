import { parseJsonString } from "../../utils/Common";
import { showLabel } from "../../utils/CustomLabelFunctions";
import { Localizer } from "../../utils/Localizer";
import { GameBase } from "../GameBase";
import { GameState } from "./managers/gameFlow/GameFlowManager";
import { GameRoomManager } from "./managers/gameRoom/GameRoomManager";
import { GamePlayer } from "./types/GamePlayer";

const ROOM_COUNT = 1;
export class Game extends GameBase {
	private static _instance: Game;

	private mafiaGameRoomManager: GameRoomManager = new GameRoomManager(ROOM_COUNT);

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

		player.tag.widget.main = player.showWidget("widgets/fullscreen_widget.html", "middle", 0, 0);
		player.tag.widget.main.sendMessage({ type: "init", message: "코드 마피아" });

		// 역할 카드 위젯 메시지 처리 설정
		player.tag.widget.main.onMessage.Add((player, data) => {
			if (data.type === "showRoleDetail" && data.role) {
				this.showRoleCard(player, data.role);
			}
		});

		const playerId = player.id;
		ScriptApp.runLater(() => {
			player.showConfirm(
				"게임에 참가하시겠습니까?",
				(res) => {
					if (res) {
						this.mafiaGameRoomManager.getRoom(1).addPlayer(playerId);
					}
				},
				{
					content: "게임에 참가하시려면 '확인'을 눌러주세요.",
				}
			);
		}, 3);
	}

	/**
	 * 역할 카드 위젯을 표시합니다.
	 * @param player 플레이어
	 * @param role 역할
	 */
	private showRoleCard(player: GamePlayer, role: string) {
		// 이미 역할 카드 위젯이 있으면 제거
		if (player.tag.widget.roleCard) {
			player.tag.widget.roleCard.destroy();
		}
		
		// 역할 카드 위젯 생성
		player.tag.widget.roleCard = player.showWidget("widgets/role_card.html", "middle", 0, 0);
		
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
		// 플레이어가 속한 방에서 제거
		const rooms = this.mafiaGameRoomManager.getAllRooms();
		for (const [, room] of Object.entries(rooms)) {
			const playerIndex = room.players.findIndex(p => p.id === player.id);
			if (playerIndex !== -1) {
				room.players.splice(playerIndex, 1);
				break;
			}
		}
	}

	private update(dt: number) {
		const rooms = this.mafiaGameRoomManager.getAllRooms();

		for (const [, room] of Object.entries(rooms)) {
			if (room.flowManager.state === GameState.IN_PROGRESS) {
				if (room.flowManager.phaseTimer > 0) {
					room.flowManager.phaseTimer -= dt;
					room.actionToRoomPlayers((player) => {
						const gamePlayer = ScriptApp.getPlayerByID(player.id);
						if (!gamePlayer) return;
						showLabel(gamePlayer, "main", {
							labelWidth: "S",
							texts: [{ text: `⏱️ 남은 시간: ${Math.floor(room.flowManager.phaseTimer)}초`, style: { fontSize: "18px", mobileFontSize: "14px", fontWeight: 700, color: "white" } }],
							topGapPC: -2,
							topGapMobile: 10,
							labelDisplayTime: 3000,
							backgroundColor: 0x27262e,
						});
					});
					if (room.flowManager.phaseTimer < 0) {
						room.flowManager.nextPhase();
					}
				}
			} else {
				if (room.players.length >= 4 && room.flowManager.state == GameState.WAITING) {
					room.flowManager.startGame();
				}
			}
		}
	}

	private onDestroy() {}
}
