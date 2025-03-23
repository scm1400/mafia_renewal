import { ScriptDynamicResource } from "zep-script";

// 스프라이트 이름을 enum으로 정의
export enum SpriteType {
	CHARACTER_BASIC = "character_basic",
	// 추가적인 스프라이트 타입은 여기에 추가
}

type Sprite = {
	name: string;
	sprite: ScriptDynamicResource;
};

export class SpriteManager {
	private static _instance: SpriteManager;
	private sprites: Record<string, Sprite> = {};

	public static getInstance(): SpriteManager {
		return this._instance || (this._instance = new this());
	}

	constructor() {
		const characterSprite = ScriptApp.loadSpritesheet(
        "images/character_basic.png",
			48,
			48,
			{
				left_idle: [0, 1, 2, 3],
				right_idle: [4, 5, 6, 7],
				down_idle: [8, 9, 10, 11],
				up_idle: [12, 13, 14, 15],
				left: [16, 17, 18, 19, 20, 21, 22, 23],
				right: [24, 25, 26, 27, 28, 29, 30, 31],
				down: [32, 33, 34, 35, 36, 37, 38, 39],
				up: [40, 41, 42, 43, 44, 45, 46, 47],
			},
			8
		);

		this.addSprite(SpriteType.CHARACTER_BASIC, characterSprite);
	}

	public getSprite(type: SpriteType): ScriptDynamicResource {
		return this.sprites[type].sprite;
	}

	public addSprite(type: SpriteType, sprite: ScriptDynamicResource): void {
		this.sprites[type] = {
			name: type,
			sprite,
		};
	}
}
