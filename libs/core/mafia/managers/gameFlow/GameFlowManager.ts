import { GamePlayer } from "../../types/GamePlayer";
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
	[MafiaPhase.DAY]: 20,
	[MafiaPhase.VOTING]: 30,
	[MafiaPhase.FINAL_DEFENSE]: 20,
	[MafiaPhase.APPROVAL_VOTING]: 30,
};

// 각 플레이어에 대한 정보 인터페이스입니다.
export interface MafiaPlayer {
	id: string;
	name: string;
	role: MafiaGameRole;
	isAlive: boolean;
}

export class GameFlowManager {
	public state: GameState = GameState.WAITING;
	private currentPhase: MafiaPhase;
	private dayCount: number = 0;
	private phaseCycle: MafiaPhase[];
	public phaseTimer: number;

	// 밤에 수행되는 액션들을 저장하는 변수들
	private mafiaTarget: string | null = null;
	private doctorTarget: string | null = null;
	private policeTarget: string | null = null;

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
			ScriptApp.showCenterLabel("게임 시작을 위해 최소 4명의 플레이어가 필요합니다");
			return;
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
			// this.phaseCycle = [MafiaPhase.DAY, MafiaPhase.VOTING, MafiaPhase.FINAL_DEFENSE, MafiaPhase.APPROVAL_VOTING];
			this.phaseCycle = [MafiaPhase.DAY, MafiaPhase.VOTING, MafiaPhase.NIGHT];
		} else {
			// 4명보다 많은 경우: 밤 → 낮 → 투표 → 최후 변론 → 찬반 투표 → 밤 …
			// this.phaseCycle = [MafiaPhase.NIGHT, MafiaPhase.DAY, MafiaPhase.VOTING, MafiaPhase.FINAL_DEFENSE, MafiaPhase.APPROVAL_VOTING];
			this.phaseCycle = [MafiaPhase.NIGHT, MafiaPhase.DAY, MafiaPhase.VOTING];
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
			ScriptApp.sayToAll("게임이 진행 중이 아닙니다.");
			return;
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
				{
					ScriptApp.sayToAll(`Room ${this.room.id}: 밤 단계 - 마피아가 희생자를 선택합니다.`);

					this.room.actionToRoomPlayers((player) => {
						const gamePlayer: GamePlayer = ScriptApp.getPlayerByID(player.id);
						if (!gamePlayer) {
							player.isAlive = false;
							return;
						}
						let message = "🌙밤이 되었습니다";
						if (this.dayCount == 0) {
							message += `\n 당신은 [ ${player.role} ] 입니다`;
						}

						if (gamePlayer.tag.widget.main) {
							gamePlayer.tag.widget.main.sendMessage({
								type: "init",
								message,
							});
						}

						if (!gamePlayer.tag.widget.action) {
							gamePlayer.tag.widget.action = gamePlayer.showWidget("widgets/action.html", "middle", 0, 0);
						}

						if (player.isAlive) {
							gamePlayer.tag.widget.action.sendMessage({
								type: "init",
								gameData: {
									role: player.role,
									currentPhase: this.currentPhase,
									players: this.room.players,
								},
							});
						}
					});

					// 예: this.mafiaAction();
				}
				break;
			case MafiaPhase.DAY:
				{
					this.evaluateNightActions();
					ScriptApp.sayToAll(`Room ${this.room.id}: 낮 단계 - 플레이어들이 토론을 진행합니다.`);

					this.room.actionToRoomPlayers((player) => {
						let message = "🔅낮이 되었습니다";
						const gamePlayer: GamePlayer = ScriptApp.getPlayerByID(player.id);
						if (!gamePlayer) {
							player.isAlive = false;
							return;
						}
						if (this.dayCount == 0) {
							message += `\n 당신은 [ ${player.role} ] 입니다`;
						}

						if (gamePlayer.tag.widget.main) {
							gamePlayer.tag.widget.main.sendMessage({
								type: "init",
								message,
							});
						}

						if (gamePlayer.tag.widget.action) {
							gamePlayer.tag.widget.action.sendMessage({
								type: "hide",
							});
						}
					});
				}
				break;
			case MafiaPhase.VOTING:
				{
					const message = "⚖️ 투표 시간 입니다";
					ScriptApp.sayToAll(`Room ${this.room.id}: 낮 단계 - 플레이어들이 토론을 진행합니다.`);

					this.room.actionToRoomPlayers((player) => {
						const gamePlayer: GamePlayer = ScriptApp.getPlayerByID(player.id);
						if (!gamePlayer) {
							player.isAlive = false;
							return;
						}

						if (gamePlayer.tag.widget.main) {
							gamePlayer.tag.widget.main.sendMessage({
								type: "init",
								message,
							});
						}
					});
				}
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
		if (this.dayCount == 0) this.dayCount = 1;
	}

	/**
	 * 투표 종료 후 처리 예시
	 * @param votes 각 플레이어의 투표 수를 { playerId: voteCount } 형태로 전달
	 */
	endVoting(votes: { [playerId: string]: number }) {
		if (this.currentPhase !== MafiaPhase.VOTING && this.currentPhase !== MafiaPhase.APPROVAL_VOTING) {
			ScriptApp.sayToAll("현재 투표 단계가 아닙니다.");
			return;
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

	/**
	 * 밤 단계에서 마피아가 희생 대상을 선택합니다.
	 * @param targetPlayerId 선택한 대상 플레이어의 ID
	 */
	mafiaAction(targetPlayerId: string): void {
		if (this.currentPhase !== MafiaPhase.NIGHT) {
			ScriptApp.sayToAll("마피아 액션은 밤 단계에서만 수행할 수 있습니다.");
			return;
		}
		// (선택 대상이 존재하고 살아있는지 등의 추가 검증 로직을 필요 시 추가)
		this.mafiaTarget = targetPlayerId;
		ScriptApp.sayToAll(`Room ${this.room.id}: 마피아가 ${targetPlayerId}를 희생 대상으로 선택했습니다.`);
	}

	/**
	 * 밤 단계에서 의사가 보호할 대상을 선택합니다.
	 * @param targetPlayerId 선택한 보호 대상 플레이어의 ID
	 */
	doctorAction(targetPlayerId: string): void {
		if (this.currentPhase !== MafiaPhase.NIGHT) {
			ScriptApp.sayToAll("의사 액션은 밤 단계에서만 수행할 수 있습니다.");
			return;
		}
		this.doctorTarget = targetPlayerId;
		ScriptApp.sayToAll(`Room ${this.room.id}: 의사가 ${targetPlayerId}를 보호 대상으로 선택했습니다.`);
	}

	/**
	 * 밤 단계에서 경찰이 조사할 대상을 선택합니다.
	 * 선택한 플레이어의 역할을 확인하여 결과를 출력합니다.
	 * @param targetPlayerId 조사할 플레이어의 ID
	 */
	policeAction(targetPlayerId: string): void {
		if (this.currentPhase !== MafiaPhase.NIGHT) {
			ScriptApp.sayToAll("경찰 액션은 밤 단계에서만 수행할 수 있습니다.");
			return;
		}
		this.policeTarget = targetPlayerId;
		const targetPlayer = this.room.players.find((p) => p.id === targetPlayerId);
		if (!targetPlayer) {
			console.error(`Room ${this.room.id}: 경찰 액션 실패 - 플레이어 ${targetPlayerId}를 찾을 수 없습니다.`);
			return;
		}
		ScriptApp.sayToAll(`Room ${this.room.id}: 경찰이 ${targetPlayerId}를 조사한 결과, 역할은 ${targetPlayer.role} 입니다.`);
		// 필요에 따라 경찰에게 조사 결과를 반환하거나 별도 로직을 추가할 수 있습니다.
	}

	/**
	 * 밤 단계 액션 평가
	 * - 마피아가 선택한 대상이 의사의 보호 대상과 동일하면 보호 성공.
	 * - 그렇지 않으면 해당 플레이어를 사망 처리합니다.
	 * 밤 액션 평가 후, 내부 액션 변수들을 초기화합니다.
	 */
	evaluateNightActions(): void {
		if (this.mafiaTarget) {
			if (this.mafiaTarget === this.doctorTarget) {
				ScriptApp.sayToAll(`Room ${this.room.id}: 의사의 보호로 ${this.mafiaTarget}는 살해되지 않았습니다.`);
			} else {
				ScriptApp.sayToAll(`Room ${this.room.id}: ${this.mafiaTarget}가 마피아의 공격으로 사망했습니다.`);
				// 해당 플레이어를 사망 처리 (예: isAlive 상태 변경)
				const targetPlayer = this.room.players.find((p) => p.id === this.mafiaTarget);
				if (targetPlayer) {
					targetPlayer.isAlive = false;
				}
			}
		}
		// 다음 밤을 위해 액션 변수 초기화
		this.mafiaTarget = null;
		this.doctorTarget = null;
		this.policeTarget = null;
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

	getCurrentPhase(): MafiaPhase {
		return this.currentPhase;
	}

	isGameInProgress(): boolean {
		return this.state === GameState.IN_PROGRESS;
	}
}
