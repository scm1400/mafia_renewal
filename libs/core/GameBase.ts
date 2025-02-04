import { isDevServer, log } from "../utils/Common";
import { GamePlayer } from "./mafia/types/GamePlayer";

export abstract class GameBase {
	protected onStartCallbacks: (() => void)[] = [];
	protected onDestroyCallbacks: (() => void)[] = [];
	private onJoinPlayerCallbacks: ((player: GamePlayer) => void)[] = [];
	private onLeavePlayerCallbacks: ((player: GamePlayer) => void)[] = [];
	private onUpdateCallbacks: ((dt: number) => void)[] = [];
	private onTriggerObjectCallbacks: ((sender: GamePlayer, layerId: number, x: number, y: number, key: string | undefined) => void)[] = [];

	constructor() {
		this.initEventListeners();
	}

	private initEventListeners() {
		ScriptApp.onStart.Add(() => {
			this.onStartCallbacks.forEach((callback) => {
				try {
					callback();
				} catch (error) {
					//*
				}
			});
		});
		ScriptApp.onJoinPlayer.Add((player: GamePlayer) => {
			this.onJoinPlayerCallbacks.forEach((callback) => {
				try {
					callback(player);
				} catch (error) {
					//*
				}
			});
		});

		ScriptApp.onLeavePlayer.Add((player: GamePlayer) => {
			this.onLeavePlayerCallbacks.forEach((callback) => {
				try {
					callback(player);
				} catch (error) {
					//*
				}
			});
		});

		ScriptApp.onUpdate.Add((dt) => {
			this.onUpdateCallbacks.forEach((callback) => {
				try {
					callback(dt);
				} catch (error) {
					//*
				}
			});
		});

		ScriptApp.onDestroy.Add(() => {
			this.onDestroyCallbacks.forEach((callback) => {
				try {
					callback();
				} catch (error) {
					//*
				}
			});
		});

		ScriptApp.onTriggerObject.Add((sender: GamePlayer, layerId, x, y, key) => {
			this.onTriggerObjectCallbacks.forEach((callback) => {
				try {
					callback(sender, layerId, x, y, key);
				} catch (error) {
					//*
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

	public addOnJoinPlayerCallback(callback: (player: GamePlayer) => void): void {
		this.onJoinPlayerCallbacks.push(callback);
	}

	public addOnLeavePlayerCallback(callback: (player: GamePlayer) => void): void {
		this.onLeavePlayerCallbacks.push(callback);
	}

	public addOnUpdateCallback(callback: (dt: number) => void): void {
		this.onUpdateCallbacks.push(callback);
	}

	public addOnTriggerObjectCallback(callback: (sender: GamePlayer, layerId: number, x: number, y: number, key: string | undefined) => void): void {
		this.onTriggerObjectCallbacks.push(callback);
	}
}
