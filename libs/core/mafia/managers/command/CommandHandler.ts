/**
 * 명령어 핸들러 인터페이스 및 컨텍스트 정의
 */

import type { GamePlayer } from "../../types/GamePlayer";
import type { GameRoom } from "../gameRoom/GameRoom";
import type { GameFlowManager } from "../gameFlow/GameFlowManager";

/**
 * 명령어 실행 컨텍스트
 */
export interface CommandContext {
	player: GamePlayer; // 명령어 실행자
	room: GameRoom | null; // 현재 게임 방 (로비에서는 null)
	flowManager: GameFlowManager | null; // 게임 흐름 관리자 (로비에서는 null)
}

/**
 * 명령어 핸들러 인터페이스
 */
export interface ICommandHandler {
	name: string; // 명령어 이름
	description: string; // 설명
	adminOnly: boolean; // 관리자 전용 여부
	requiresGameInProgress: boolean; // 게임 진행 중에만 사용 가능 여부

	/**
	 * 명령어 실행
	 * @param context 명령어 실행 컨텍스트
	 * @param args 명령어 인자
	 * @returns true면 명령어가 처리됨, false면 실패 (채팅으로 브로드캐스트될 수 있음)
	 */
	execute(context: CommandContext, args: string[]): boolean;

	/**
	 * 사용법 반환
	 * @returns 사용법 문자열
	 */
	getUsage(): string;
}
