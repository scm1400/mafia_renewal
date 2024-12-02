import { ScriptPlayer } from "zep-script/src/ScriptPlayer";
import { Localizer } from "../../utils/Localizer";
import { GameBase } from "../GameBase";

export class Game extends GameBase {
	private static _instance: Game;

	static create() {}

	constructor() {
		super();
		this.addOnStartCallback(this.onStart.bind(this));
		this.addOnJoinPlayerCallback(this.onJoinPlayer.bind(this));
		this.addOnLeavePlayerCallback(this.onLeavePlayer.bind(this));
		this.addOnUpdateCallback(this.update.bind(this));
		this.addOnDestroyCallback(this.onDestroy.bind(this));
	}

	private onStart() {}

	private onDestroy() {}

	private onJoinPlayer(player: ScriptPlayer) {
		// // 로컬라이징
		Localizer.prepareLocalizationContainer(player);

		//@ts-ignore
		const customData = parseJsonString(player.customData);
	}

	private onLeavePlayer(player: ScriptPlayer) {}

	private update(dt: number) {}
}
