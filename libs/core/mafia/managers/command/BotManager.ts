/**
 * BotManager - 봇 플레이어 상태 및 자동 행동 관리 (Singleton)
 *
 * 기능:
 * - 플레이어의 봇 상태 관리 (isBot)
 * - 랜덤 행동 선택 (투표 대상, 밤 능력 대상, 찬반 투표)
 * - 봇 행동 실행
 */

import { sendAdminConsoleMessage } from "../../../../utils/Common";

export class BotManager {
	private static _instance: BotManager;

	// 봇으로 설정된 플레이어 ID 목록
	private botPlayers: { [playerId: string]: boolean } = {};

	static get instance(): BotManager {
		if (!BotManager._instance) {
			BotManager._instance = new BotManager();
		}
		return BotManager._instance;
	}

	private constructor() {}

	/**
	 * 플레이어를 봇으로 설정
	 */
	setBot(playerId: string, isBot: boolean): void {
		if (isBot) {
			this.botPlayers[playerId] = true;
			sendAdminConsoleMessage(`[BOT] 플레이어 ${playerId}가 봇으로 설정되었습니다.`);
		} else {
			delete this.botPlayers[playerId];
			sendAdminConsoleMessage(`[BOT] 플레이어 ${playerId}의 봇 상태가 해제되었습니다.`);
		}
	}

	/**
	 * 플레이어가 봇인지 확인
	 */
	isBot(playerId: string): boolean {
		return this.botPlayers[playerId] === true;
	}

	/**
	 * 모든 봇 플레이어 ID 가져오기
	 */
	getAllBotIds(): string[] {
		const ids: string[] = [];
		for (const id in this.botPlayers) {
			if (this.botPlayers[id]) {
				ids.push(id);
			}
		}
		return ids;
	}

	/**
	 * 봇 플레이어 수 가져오기
	 */
	getBotCount(): number {
		return this.getAllBotIds().length;
	}

	/**
	 * 모든 봇 상태 초기화
	 */
	clearAllBots(): void {
		this.botPlayers = {};
		sendAdminConsoleMessage("[BOT] 모든 봇 상태가 초기화되었습니다.");
	}

	/**
	 * 랜덤으로 대상 선택 (투표, 밤 능력용)
	 * @param candidates 후보 ID 배열
	 * @param excludeId 제외할 ID (자기 자신)
	 * @returns 선택된 대상 ID 또는 null
	 */
	selectRandomTarget(candidates: string[], excludeId?: string): string | null {
		// 자기 자신 제외
		const filtered = excludeId
			? candidates.filter(id => id !== excludeId)
			: candidates;

		if (filtered.length === 0) return null;

		const randomIndex = Math.floor(Math.random() * filtered.length);
		return filtered[randomIndex];
	}

	/**
	 * 랜덤으로 찬반 투표 선택 (50% 확률)
	 * @returns "approve" 또는 "reject"
	 */
	selectRandomApproval(): string {
		return Math.random() < 0.5 ? "approve" : "reject";
	}

	/**
	 * 봇이 능력을 사용할지 결정 (80% 확률로 사용)
	 */
	shouldUseAbility(): boolean {
		return Math.random() < 0.8;
	}
}
