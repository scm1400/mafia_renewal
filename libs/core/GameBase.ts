import { ScriptPlayer } from "zep-script";
import { isDevServer, log } from "../utils/Common";

export abstract class GameBase {
	protected onStartCallbacks: (() => void)[] = [];
	protected onDestroyCallbacks: (() => void)[] = [];
	private onJoinPlayerCallbacks: ((player: ScriptPlayer) => void)[] = [];
	private onLeavePlayerCallbacks: ((player: ScriptPlayer) => void)[] = [];
	private onUpdateCallbacks: ((dt: number) => void)[] = [];
	private onTriggerObjectCallbacks: ((sender: ScriptPlayer, layerId: number, x: number, y: number, key: string | undefined) => void)[] = [];

	constructor() {
		this.initEventListeners();
	}

	private initEventListeners() {
		ScriptApp.onStart.Add(() => {
			this.onStartCallbacks.forEach((callback) => {
				try {
					callback();
				} catch (error) {
					log(`[zep-quiz] ${error}`);
				}
			});
		});
		ScriptApp.onJoinPlayer.Add((player) => {
			this.onJoinPlayerCallbacks.forEach((callback) => {
				try {
					callback(player);
				} catch (error) {
					log(`[zep-quiz] ${error}`);
				}
			});
		});

		ScriptApp.onLeavePlayer.Add((player) => {
			this.onLeavePlayerCallbacks.forEach((callback) => {
				try {
					callback(player);
				} catch (error) {
					log(`[zep-quiz] ${error}`);
				}
			});
		});

		ScriptApp.onUpdate.Add((dt) => {
			this.onUpdateCallbacks.forEach((callback) => {
				try {
					callback(dt);
				} catch (error) {
					log(`[zep-quiz] ${error}`);
				}
			});
		});

		ScriptApp.onDestroy.Add(() => {
			this.onDestroyCallbacks.forEach((callback) => {
				try {
					callback();
				} catch (error) {
					log(`[zep-quiz] ${error}`);
				}
			});
		});

		ScriptApp.onTriggerObject.Add((sender, layerId, x, y, key) => {
			this.onTriggerObjectCallbacks.forEach((callback) => {
				try {
					callback(sender, layerId, x, y, key);
				} catch (error) {
					log(`[zep-quiz] ${error}`);
				}
			});
		});
	}

	public addOnStartCallback(callback: () => void): void {
		this.onStartCallbacks.push(callback);
	}

	public addOnDestroyCallback(callback: () => void): void {
		this.onDestroyCallbacks.push(callback);
	}

	public addOnJoinPlayerCallback(callback: (player: ScriptPlayer) => void): void {
		this.onJoinPlayerCallbacks.push(callback);
	}

	public addOnLeavePlayerCallback(callback: (player: ScriptPlayer) => void): void {
		this.onLeavePlayerCallbacks.push(callback);
	}

	public addOnUpdateCallback(callback: (dt: number) => void): void {
		this.onUpdateCallbacks.push(callback);
	}

	public addOnTriggerObjectCallback(callback: (sender: ScriptPlayer, layerId: number, x: number, y: number, key: string | undefined) => void): void {
		this.onTriggerObjectCallbacks.push(callback);
	}
}
