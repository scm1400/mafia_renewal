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
		// 로컬라이징
		Localizer.prepareLocalizationContainer(player);

		//@ts-ignore
		const customData = parseJsonString(player.customData);
	}

	private onLeavePlayer(player: GamePlayer) {}

	private update(dt: number) {
		const rooms = this.mafiaGameRoomManager.getAllRooms();
		for (const [, room] of Object.entries(rooms)) {
			if (room.flowManager.state === GameState.IN_PROGRESS) {
				if (room.flowManager.phaseTimer > 0) {
					room.flowManager.phaseTimer -= dt;
					if (room.flowManager.phaseTimer < 0) {
						room.flowManager.nextPhase();
					}
				}
			}
		}
	}

	private onDestroy() {}
}
