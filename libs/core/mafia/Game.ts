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
		};
		// 로컬라이징
		Localizer.prepareLocalizationContainer(player);

		//@ts-ignore
		const customData = parseJsonString(player.customData);

		player.tag.widget.main = player.showWidget("widgets/fullscreen_widget.html", "middel", 0, 0);
		player.tag.widget.main.sendMessage({ type: "init", message: "코드 마피아" });

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

	private onLeavePlayer(player: GamePlayer) {}

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
