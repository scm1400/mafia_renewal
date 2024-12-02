import { ScriptDynamicResource, ScriptPlayer } from "zep-script";

export class Effect {
	static removeEffect(player: ScriptPlayer) {
		//@ts-ignore
		player.setCustomEffectSprite(4, null, 0, 0, 0);
		player.sendUpdated();
	}
}
