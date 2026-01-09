/**
 * BotActionScheduler - 봇 자동 행동 스케줄러
 *
 * 각 페이즈에서 봇 플레이어들의 자동 행동을 스케줄링하고 실행
 * ScriptApp.runLater()를 사용하여 지연 실행
 */

import { BotManager } from "./BotManager";
import { GameFlowManager, MafiaPhase, MafiaPlayer } from "../gameFlow/GameFlowManager";
import { sendAdminConsoleMessage } from "../../../../utils/Common";
import { JobId, getJobById, JobAbilityType } from "../../types/JobTypes";

export class BotActionScheduler {
	private flowManager: GameFlowManager;
	private botManager: BotManager;

	// 봇 행동 딜레이 (초)
	private readonly BOT_ACTION_MIN_DELAY = 2;
	private readonly BOT_ACTION_MAX_DELAY = 5;

	constructor(flowManager: GameFlowManager) {
		this.flowManager = flowManager;
		this.botManager = BotManager.instance;
	}

	/**
	 * 랜덤 딜레이 생성 (초 단위)
	 */
	private getRandomDelay(): number {
		return this.BOT_ACTION_MIN_DELAY +
			Math.random() * (this.BOT_ACTION_MAX_DELAY - this.BOT_ACTION_MIN_DELAY);
	}

	/**
	 * 페이즈 변경 시 봇 행동 스케줄링
	 */
	scheduleActionsForPhase(phase: MafiaPhase): void {
		const botIds = this.botManager.getAllBotIds();
		if (botIds.length === 0) return;

		switch (phase) {
			case MafiaPhase.VOTING:
				this.scheduleVotingActions();
				break;
			case MafiaPhase.APPROVAL_VOTING:
				this.scheduleApprovalVotingActions();
				break;
			case MafiaPhase.NIGHT:
				this.scheduleNightActions();
				break;
			// DAY, FINAL_DEFENSE는 봇이 별도 행동 불필요
		}
	}

	/**
	 * 투표 페이즈에서 봇 투표 스케줄링
	 */
	private scheduleVotingActions(): void {
		const room = this.flowManager["room"];
		if (!room) return;

		// 살아있는 봇 플레이어 찾기
		const aliveBots = room.players.filter(
			(p: MafiaPlayer) => p.isAlive && this.botManager.isBot(p.id)
		);

		// 투표 대상 후보 (살아있는 플레이어)
		const candidates = room.players
			.filter((p: MafiaPlayer) => p.isAlive)
			.map((p: MafiaPlayer) => p.id);

		for (const bot of aliveBots) {
			const delay = this.getRandomDelay();

			ScriptApp.runLater(() => {
				// 현재 페이즈가 아직 VOTING인지 확인
				if (this.flowManager.currentPhase !== MafiaPhase.VOTING) return;

				const target = this.botManager.selectRandomTarget(candidates, bot.id);
				if (target) {
					this.flowManager.processVote(bot.id, target);
					sendAdminConsoleMessage(`[BOT] ${bot.name}가 투표했습니다.`);
				}
			}, delay);
		}
	}

	/**
	 * 찬반 투표 페이즈에서 봇 투표 스케줄링
	 */
	private scheduleApprovalVotingActions(): void {
		const room = this.flowManager["room"];
		if (!room) return;

		// 피고인 ID 가져오기 (최다 득표자)
		const defendantId = this.flowManager["defendantId"];

		// 살아있는 봇 플레이어 찾기 (피고인 제외)
		const aliveBots = room.players.filter(
			(p: MafiaPlayer) => p.isAlive && this.botManager.isBot(p.id) && p.id !== defendantId
		);

		for (const bot of aliveBots) {
			const delay = this.getRandomDelay();

			ScriptApp.runLater(() => {
				// 현재 페이즈가 아직 APPROVAL_VOTING인지 확인
				if (this.flowManager.currentPhase !== MafiaPhase.APPROVAL_VOTING) return;

				const vote = this.botManager.selectRandomApproval();
				this.flowManager.processApprovalVote(bot.id, vote);
				sendAdminConsoleMessage(`[BOT] ${bot.name}가 ${vote === "approve" ? "찬성" : "반대"} 투표했습니다.`);
			}, delay);
		}
	}

	/**
	 * 밤 페이즈에서 봇 능력 사용 스케줄링
	 */
	private scheduleNightActions(): void {
		const room = this.flowManager["room"];
		if (!room) return;

		// 살아있는 봇 플레이어 중 밤 능력이 있는 플레이어 찾기
		const aliveBots = room.players.filter(
			(p: MafiaPlayer) => p.isAlive && this.botManager.isBot(p.id)
		);

		for (const bot of aliveBots) {
			const job = getJobById(bot.jobId);
			if (!job || !job.nightAbility) continue;

			// 능력 사용 여부 결정 (80% 확률)
			if (!this.botManager.shouldUseAbility()) continue;

			const delay = this.getRandomDelay();

			ScriptApp.runLater(() => {
				// 현재 페이즈가 아직 NIGHT인지 확인
				if (this.flowManager.currentPhase !== MafiaPhase.NIGHT) return;

				this.executeNightAction(bot, job);
			}, delay);
		}
	}

	/**
	 * 봇의 밤 능력 실행
	 */
	private executeNightAction(bot: MafiaPlayer, job: ReturnType<typeof getJobById>): void {
		if (!job) return;

		const room = this.flowManager["room"];
		if (!room) return;

		// 대상 후보 결정
		let candidates: string[] = [];

		switch (job.abilityType) {
			case JobAbilityType.ARMOR:
				// 군인: 자기 자신
				candidates = [bot.id];
				break;

			case JobAbilityType.COPY:
				// 도굴꾼: 죽은 플레이어의 능력 복사
				candidates = this.flowManager.deadPlayers;
				break;

			case JobAbilityType.KILL:
			case JobAbilityType.INVESTIGATE:
			case JobAbilityType.PROTECT:
			case JobAbilityType.CONTACT:
			case JobAbilityType.LISTEN:
			case JobAbilityType.BLOCK:
			case JobAbilityType.TRACK:
			case JobAbilityType.CONVERT:
			case JobAbilityType.SUICIDE:
			default:
				// 대부분의 능력: 다른 살아있는 플레이어를 대상으로 함
				candidates = room.players
					.filter((p: MafiaPlayer) => p.isAlive && p.id !== bot.id)
					.map((p: MafiaPlayer) => p.id);
				break;
		}

		const target = this.botManager.selectRandomTarget(candidates);
		if (target) {
			this.flowManager.processAbility(bot.id, target);
			sendAdminConsoleMessage(`[BOT] ${bot.name}(${job.name})가 능력을 사용했습니다.`);
		}
	}
}
