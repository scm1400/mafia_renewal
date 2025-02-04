import { GameRoom } from "../gameRoom/GameRoom";

// GameState Enum: 게임의 주요 상태를 정의
export enum GameState {
	WAITING = "WAITING",
	IN_PROGRESS = "IN_PROGRESS",
	ENDED = "ENDED",
}

// 마피아 게임의 역할을 정의합니다.
export enum MafiaGameRole {
	MAFIA = "MAFIA",
	POLICE = "POLICE",
	DOCTOR = "DOCTOR",
	CITIZEN = "CITIZEN",
}

// 마피아 게임의 단계(phase)를 정의합니다.
export enum MafiaPhase {
	// 4명보다 많은 경우에 사용되는 단계 순서: 밤 → 낮 → 투표 → 최후 변론 → 찬반 투표 → 밤 …
	NIGHT = "NIGHT",
	DAY = "DAY",
	VOTING = "VOTING",
	FINAL_DEFENSE = "FINAL_DEFENSE",
	APPROVAL_VOTING = "APPROVAL_VOTING",
}

export const phaseDurations: { [key in MafiaPhase]: number } = {
	[MafiaPhase.NIGHT]: 30,
	[MafiaPhase.DAY]: 60,
	[MafiaPhase.VOTING]: 30,
	[MafiaPhase.FINAL_DEFENSE]: 20,
	[MafiaPhase.APPROVAL_VOTING]: 30,
};

// 각 플레이어에 대한 정보 인터페이스입니다.
export interface MafiaPlayer {
	id: string;
	role: MafiaGameRole;
	isAlive: boolean;
}

export class GameFlowManager {
	public state: GameState = GameState.WAITING;
	private currentPhase: MafiaPhase;
	private dayCount: number = 1;
	private phaseCycle: MafiaPhase[];
	public phaseTimer: number;

	constructor(private room: GameRoom) {}

	/**
	 * 게임 시작
	 * - 최소 4명의 플레이어가 있어야 합니다.
	 * - 플레이어 역할을 무작위로 배정합니다.
	 *   (첫 번째: 마피아, 두 번째: 경찰, 세 번째: 의사, 나머지: 시민)
	 * - 플레이어 수에 따라 초기 단계가 결정됩니다.
	 *   → 4명: 낮부터 시작
	 *   → 4명보다 많은 경우: 밤부터 시작
	 */
	startGame() {
		if (this.room.players.length < 4) {
			ScriptApp.sayToAll("게임 시작을 위해 최소 4명의 플레이어가 필요합니다");
		}

		// 플레이어 역할 무작위 배정
		const playersShuffled = [...this.room.players];
		playersShuffled.sort(() => Math.random() - 0.5);

		if (playersShuffled.length > 0) playersShuffled[0].role = MafiaGameRole.MAFIA;
		if (playersShuffled.length > 1) playersShuffled[1].role = MafiaGameRole.POLICE;
		if (playersShuffled.length > 2) playersShuffled[2].role = MafiaGameRole.DOCTOR;
		for (let i = 3; i < playersShuffled.length; i++) {
			playersShuffled[i].role = MafiaGameRole.CITIZEN;
		}
		// 역할 배정된 객체는 참조를 공유하므로 room.players에 반영됩니다.

		// 플레이어 수에 따른 게임 단계 순서 설정
		if (this.room.players.length === 4) {
			// 4명인 경우: 낮 → 투표 → 최후 변론 → 찬반 투표 → 낮 …
			this.phaseCycle = [MafiaPhase.DAY, MafiaPhase.VOTING, MafiaPhase.FINAL_DEFENSE, MafiaPhase.APPROVAL_VOTING];
		} else {
			// 4명보다 많은 경우: 밤 → 낮 → 투표 → 최후 변론 → 찬반 투표 → 밤 …
			this.phaseCycle = [MafiaPhase.NIGHT, MafiaPhase.DAY, MafiaPhase.VOTING, MafiaPhase.FINAL_DEFENSE, MafiaPhase.APPROVAL_VOTING];
		}

		// 초기 단계 설정
		this.setPhase(this.phaseCycle[0]);
		this.state = GameState.IN_PROGRESS;
		ScriptApp.sayToAll(`Room ${this.room.id}: 게임 시작! 초기 단계는 ${this.currentPhase} 입니다.`);

		// 초기 단계에 따른 액션 실행 (필요에 따라 확장)
		this.executePhaseActions();
	}

	/**
	 * 현재 단계에서 다음 단계로 전환합니다.
	 * 단계 순서는 phaseCycle 배열에 따라 진행되며,
	 * 사이클이 처음으로 돌아오면 dayCount를 증가시킵니다.
	 */
	nextPhase() {
		if (this.state !== GameState.IN_PROGRESS) {
			throw new Error("게임이 진행 중이 아닙니다.");
		}
		const currentIndex = this.phaseCycle.indexOf(this.currentPhase);
		const nextIndex = (currentIndex + 1) % this.phaseCycle.length;
		// 사이클이 처음으로 돌아오면 (예, 4명인 경우 DAY 단계) dayCount 증가
		if (nextIndex === 0) {
			this.dayCount++;
		}
		this.setPhase(this.phaseCycle[nextIndex]);
		ScriptApp.sayToAll(`Room ${this.room.id}: 단계 전환 -> ${this.currentPhase} (Day ${this.dayCount})`);

		// 단계별 액션 실행
		this.executePhaseActions();
	}

	/**
	 * 각 단계에 따른 행동을 추상화하여 처리합니다.
	 * 실제 게임 로직에 맞게 해당 메서드를 확장할 수 있습니다.
	 */
	private executePhaseActions() {
		switch (this.currentPhase) {
			case MafiaPhase.NIGHT:
				ScriptApp.sayToAll(`Room ${this.room.id}: 밤 단계 - 마피아가 희생자를 선택합니다.`);
				// 예: this.mafiaAction();
				break;
			case MafiaPhase.DAY:
				ScriptApp.sayToAll(`Room ${this.room.id}: 낮 단계 - 플레이어들이 토론을 진행합니다.`);
				break;
			case MafiaPhase.VOTING:
				ScriptApp.sayToAll(`Room ${this.room.id}: 투표 단계 - 플레이어들이 투표를 진행합니다.`);
				break;
			case MafiaPhase.FINAL_DEFENSE:
				ScriptApp.sayToAll(`Room ${this.room.id}: 최후 변론 단계 - 피의자가 최후 변론을 합니다.`);
				break;
			case MafiaPhase.APPROVAL_VOTING:
				ScriptApp.sayToAll(`Room ${this.room.id}: 찬반 투표 단계 - 최종 표결을 진행합니다.`);
				break;
			default:
				ScriptApp.sayToAll(`Room ${this.room.id}: 알 수 없는 단계입니다.`);
		}
	}

	/**
	 * 투표 종료 후 처리 예시
	 * @param votes 각 플레이어의 투표 수를 { playerId: voteCount } 형태로 전달
	 */
	endVoting(votes: { [playerId: string]: number }) {
		if (this.currentPhase !== MafiaPhase.VOTING && this.currentPhase !== MafiaPhase.APPROVAL_VOTING) {
			throw new Error("현재 투표 단계가 아닙니다.");
		}

		// 가장 많은 표를 받은 플레이어 탈락 처리
		const eliminatedPlayerId = Object.keys(votes).reduce((a, b) => (votes[a] > votes[b] ? a : b));
		ScriptApp.sayToAll(`Room ${this.room.id}: 플레이어 ${eliminatedPlayerId} 탈락.`);
		// 해당 플레이어의 isAlive를 false로 업데이트합니다.
		this.room.players = this.room.players.map((player) => (player.id === eliminatedPlayerId ? { ...player, isAlive: false } : player));

		// 승리 조건 체크
		this.checkWinCondition();
		// 탈락 후 다음 단계로 전환
		this.nextPhase();
	}

	/**
	 * 승리 조건 체크
	 * - 살아있는 플레이어 중 마피아가 0명이면 시민 승리
	 * - 마피아 수가 시민(및 기타) 수 이상이면 마피아 승리
	 */
	checkWinCondition() {
		const alivePlayers = this.room.players.filter((p) => p.isAlive);
		const mafiaAlive = alivePlayers.filter((p) => p.role === MafiaGameRole.MAFIA).length;
		const othersAlive = alivePlayers.length - mafiaAlive;

		if (mafiaAlive === 0) {
			ScriptApp.sayToAll(`Room ${this.room.id}: 시민 팀 승리!`);
			this.state = GameState.ENDED;
		} else if (mafiaAlive >= othersAlive) {
			ScriptApp.sayToAll(`Room ${this.room.id}: 마피아 팀 승리!`);
			this.state = GameState.ENDED;
		}
	}

	// 게임 리셋: 게임 상태와 단계 등을 초기화합니다.
	resetGame() {
		this.state = GameState.WAITING;

		if (this.phaseCycle) {
			this.setPhase(this.phaseCycle[0]);
		} else {
			this.setPhase(MafiaPhase.DAY);
		}
		this.dayCount = 1;
		ScriptApp.sayToAll(`Room ${this.room.id}: 게임이 리셋되었습니다.`);
	}

	setPhase(phase: MafiaPhase) {
		this.currentPhase = phase;
		this.phaseTimer = phaseDurations[this.currentPhase];
	}
}
