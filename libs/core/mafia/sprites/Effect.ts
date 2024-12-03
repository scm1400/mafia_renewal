import { GamePlayer } from "../types/GamePlayer";

export class Effect {
	static removeEffect(player: GamePlayer) {
		//@ts-ignore
		player.setCustomEffectSprite(4, null, 0, 0, 0);
		player.sendUpdated();
	}
}
