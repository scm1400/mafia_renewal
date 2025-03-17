import { ScriptPlayer, ScriptWidget } from "zep-script";
import { MafiaPlayer } from "../managers/gameFlow/GameFlowManager";
import { ComponentInfo } from "../../@common/types/phaserGo";

export interface PlayerTag {
	widget: {
		[key: string]: any;
	};
	mafiaPlayer?: MafiaPlayer;
	roomInfo?: {
		roomNum: number;
	};
	guestId?: string;
}

export interface GamePlayer extends ScriptPlayer {
	tag: PlayerTag;
	showWidget(
		widgetSrc: string, 
		align: 'popup' | 'sidebar' | 'top' | 'topleft' | 'topright' | 'middle' | 'middleleft' | 'middleright' | 'bottom' | 'bottomleft' | 'bottomright', 
		width: number, 
		height: number
	): ScriptWidget;
	disappearObject(key: string): void;
	putIndividualObject(key: string, x: number, y: number): void;
	addPhaserGo(componentInfo: ComponentInfo):void;
}

export interface PlayerProfile {
	id: string; // 플레이어의 고유 ID
	nickname: string; // 플레이어의 닉네임
	level: number; // 플레이어의 레벨
	experience: number; // 플레이어의 경험치
	avatar: string; // 아바타 URL 또는 이미지 경로
}
