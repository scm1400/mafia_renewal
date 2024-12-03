import { ScriptPlayer, ScriptWidget } from "zep-script";

export interface GamePlayer extends Omit<ScriptPlayer, "tag"> {
	tag: PlayerTag;
}

export interface PlayerProfile {
	id: string; // 플레이어의 고유 ID
	nickname: string; // 플레이어의 닉네임
	level: number; // 플레이어의 레벨
	experience: number; // 플레이어의 경험치
	avatar: string; // 아바타 URL 또는 이미지 경로
}

export interface PlayerTag {
	profile: PlayerProfile;
	widget: Record<string, ScriptWidget>;
}
