import { GamePlayer } from "../../types/GamePlayer";
import { GameRoom } from "../gameRoom/GameRoom";
import { getPlayerById } from "../../../../utils/Common";
import { Job, JobTeam, JobAbilityType, getJobById, getJobsByGameMode, JobId } from "../../types/JobTypes";

// GameState Enum: 게임의 주요 상태를 정의
export enum GameState {
	WAITING = "WAITING",
	IN_PROGRESS = "IN_PROGRESS",
	ENDED = "ENDED",
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
	jobId: JobId; // 직업 ID (enum으로 변경)
	isAlive: boolean;
	emoji?: string; // 플레이어 아바타 이모지
	abilityUses?: number; // 능력 사용 횟수 추적
	isImmune?: boolean; // 면역 상태 (군인 등)
	isBlocked?: boolean; // 투표 불가 상태 (건달 능력)
}

// 투표 결과를 저장하는 인터페이스
interface VoteResults {
	[playerId: string]: number;
}

// 능력 사용 결과를 저장하는 인터페이스
interface AbilityAction {
	playerId: string; // 능력 사용자 ID
	targetId: string; // 대상 ID
	jobId: JobId; // 직업 ID (enum으로 변경)
}

export class GameFlowManager {
	public state: GameState = GameState.WAITING;
	private currentPhase: MafiaPhase;
	private dayCount: number = 0;
	private phaseCycle: MafiaPhase[];
	public phaseTimer: number;
	private gameMode: string = "classic"; // 기본 게임 모드
	private roomNumber: number;
	private room: GameRoom | null = null;

	// 밤에 수행되는 액션들을 저장하는 변수들
	private nightActions: AbilityAction[] = [];
	
	// 투표 결과를 저장하는 변수
	private voteResults: VoteResults = {};
	private playerVotes: { [playerId: string]: string } = {}; // 각 플레이어가 누구에게 투표했는지

	constructor(roomNumber: number) {
		this.roomNumber = roomNumber;
	}
	
	/**
	 * 게임 룸 설정
	 */
	setGameRoom(room: GameRoom) {
		this.room = room;
	}

	/**
	 * 게임 모드 설정
	 * @param mode 게임 모드 ID
	 */
	setGameMode(mode: string) {
		this.gameMode = mode;
	}

	/**
	 * 게임 시작
	 * - 최소 4명의 플레이어가 있어야 합니다.
	 * - 플레이어 역할을 무작위로 배정합니다.
	 * - 플레이어 수에 따라 초기 단계가 결정됩니다.
	 *   → 4명: 낮부터 시작
	 *   → 4명보다 많은 경우: 밤부터 시작
	 */
	startGame() {
		if (!this.room) {
			ScriptApp.sayToAll("게임 룸이 설정되지 않았습니다.");
			return;
		}
		
		if (this.room.players.length < 4) {
			ScriptApp.showCenterLabel("게임 시작을 위해 최소 4명의 플레이어가 필요합니다");
			return;
		}

		// 플레이어 역할 무작위 배정
		const playersShuffled = [...this.room.players];
		playersShuffled.sort(() => Math.random() - 0.5);

		// 기본 이모지 할당
		const emojis = ["😀", "😎", "🤠", "🧐", "🤓", "😊", "🙂", "��", "😁", "🤩"];
		
		// 게임 모드에 따른 직업 배정
		const availableJobs = this.getAvailableJobs();
		const jobsNeeded = Math.min(playersShuffled.length, availableJobs.length);
		
		// 직업 배정 및 이모지 할당
		for (let i = 0; i < playersShuffled.length; i++) {
			// 이모지 할당
			playersShuffled[i].emoji = emojis[i % emojis.length];
			
			// 직업 배정
			if (i < jobsNeeded) {
				playersShuffled[i].jobId = availableJobs[i].id as JobId;
				// 능력 사용 횟수 초기화
				if (availableJobs[i].usesPerGame) {
					playersShuffled[i].abilityUses = availableJobs[i].usesPerGame;
				}
			} else {
				// 남은 플레이어는 시민으로 설정
				playersShuffled[i].jobId = JobId.CITIZEN;
			}
			
			playersShuffled[i].isAlive = true;
		}

		// 게임 상태 초기화
		this.state = GameState.IN_PROGRESS;
		this.dayCount = 1;
		
		// 플레이어 수에 따라 초기 단계 결정
		if (this.room.players.length <= 4) {
			this.phaseCycle = [MafiaPhase.DAY, MafiaPhase.VOTING, MafiaPhase.FINAL_DEFENSE, MafiaPhase.APPROVAL_VOTING];
			this.setPhase(MafiaPhase.DAY);
		} else {
			this.phaseCycle = [MafiaPhase.NIGHT, MafiaPhase.DAY, MafiaPhase.VOTING, MafiaPhase.FINAL_DEFENSE, MafiaPhase.APPROVAL_VOTING];
			this.setPhase(MafiaPhase.NIGHT);
		}
		
		// 게임 시작 메시지 표시
		ScriptApp.showCenterLabel("게임이 시작되었습니다!");
		
		// 각 플레이어에게 역할 카드 표시
		this.room.players.forEach(player => {
			const gamePlayer = this.room.getGamePlayer(player.id);
			if (gamePlayer) {
				this.showRoleCard(gamePlayer, player.jobId);
				this.initGameStatusWidgets();
			}
		});
		
		// 첫 단계 실행
		this.executePhaseActions();
	}

	// 게임 모드에 따라 사용 가능한 직업 목록 가져오기
	private getAvailableJobs(): Job[] {
		// JobTypes.ts에서 getJobsByGameMode 함수 사용
		const jobs = getJobsByGameMode(this.gameMode);
		
		// 직업 섞기
		return [...jobs].sort(() => Math.random() - 0.5);
	}

	// 역할 카드 표시
	private showRoleCard(player: GamePlayer, jobId: JobId) {
		const job = getJobById(jobId);
		if (!job) return;
		
		// 역할 카드 위젯 표시
		player.tag.widget.roleCard = player.showWidget("widgets/role_card.html", "popup", 300, 400);
		
		// 초기화 메시지 전송
		player.tag.widget.roleCard.sendMessage({
			type: "init",
			isMobile: player.isMobile,
			isTablet: player.isTablet
		});
		
		// 역할 정보 전송
		player.tag.widget.roleCard.sendMessage({
			type: "role_info",
			role: job.name,
			team: job.team,
			description: job.description,
			ability: job.abilityDescription,
			icon: job.icon || "❓"
		});
	}

	/**
	 * 게임 상태 위젯을 모든 플레이어에게 초기화합니다.
	 */
	private initGameStatusWidgets() {
		if (!this.room) return;
		
		this.room.actionToRoomPlayers((player) => {
			const gamePlayer: GamePlayer = getPlayerById(player.id);
			if (!gamePlayer) return;

			// 게임 상태 위젯 생성
			if (!gamePlayer.tag.widget) {
				gamePlayer.tag.widget = {};
			}
			
			// 게임 상태 위젯 생성
			gamePlayer.tag.widget.gameStatus = gamePlayer.showWidget("widgets/game_status.html", "middleright", 10, 10);
			
			// 초기화 메시지 전송
			gamePlayer.tag.widget.gameStatus.sendMessage({
				type: "init",
				isMobile: gamePlayer.isMobile,
				isTablet: gamePlayer.isTablet
			});
			
			// 게임 상태 정보 전송
			this.updateGameStatusWidget(gamePlayer, player);
		});
	}

	/**
	 * 특정 플레이어의 게임 상태 위젯을 업데이트합니다.
	 */
	private updateGameStatusWidget(gamePlayer: GamePlayer, player: MafiaPlayer) {
		if (!gamePlayer || !gamePlayer.tag.widget.gameStatus) return;

		gamePlayer.tag.widget.gameStatus.sendMessage({
			type: 'updateGameStatus',
			phase: this.currentPhase,
			day: this.dayCount,
			players: this.room?.players || [],
			myRole: player.jobId,
			myPlayerId: player.id,
			timeRemaining: this.phaseTimer
		});
	}

	/**
	 * 모든 플레이어의 게임 상태 위젯을 업데이트합니다.
	 */
	public updateAllGameStatusWidgets() {
		if (!this.room) return;
		
		this.room.actionToRoomPlayers((player) => {
			const gamePlayer: GamePlayer = getPlayerById(player.id);
			if (!gamePlayer) return;
			this.updateGameStatusWidget(gamePlayer, player);
		});
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
		// 사이클이 처음으로 돌아오면 dayCount 증가
		if (nextIndex === 0) {
			this.dayCount++;
		}
		this.setPhase(this.phaseCycle[nextIndex]);
		ScriptApp.sayToAll(`Room ${this.room.id}: 단계 전환 -> ${this.currentPhase} (Day ${this.dayCount})`);

		// 모든 플레이어의 게임 상태 위젯 업데이트
		this.updateAllGameStatusWidgets();

		// 단계별 액션 실행
		this.executePhaseActions();
	}

	/**
	 * 각 단계에 따른 행동을 추상화하여 처리합니다.
	 */
	private executePhaseActions() {
		if (!this.room) return;
		
		switch (this.currentPhase) {
			case MafiaPhase.NIGHT:
				{
					ScriptApp.sayToAll(`Room ${this.room.id}: 밤 단계 - 마피아가 희생자를 선택합니다.`);

					// 투표 결과 초기화
					this.voteResults = {};
					this.playerVotes = {};

					this.room.actionToRoomPlayers((player) => {
						const gamePlayer = getPlayerById(player.id) as GamePlayer;
						if (!gamePlayer) {
							player.isAlive = false;
							return;
						}

						// 밤 액션 위젯 표시
						if (player.isAlive) {
							// 밤 액션 위젯 생성
							gamePlayer.tag.widget.nightAction = gamePlayer.showWidget("widgets/night_action.html", "middle", 0, 0);
							
							// 초기화 메시지 전송
							gamePlayer.tag.widget.nightAction.sendMessage({
								type: 'init',
								isMobile: gamePlayer.isMobile,
								isTablet: gamePlayer.isTablet
							});
							
							// 밤 액션 위젯에 데이터 전송
							gamePlayer.tag.widget.nightAction.sendMessage({
								type: 'init',
								players: this.room?.players || [],
								myPlayerId: player.id,
								role: player.jobId,
								timeLimit: phaseDurations[MafiaPhase.NIGHT]
							});
							
							// 밤 액션 위젯 메시지 처리
							gamePlayer.tag.widget.nightAction.onMessage.Add((player, data) => {
								const mafiaPlayer = player.tag.mafiaPlayer;
								if (data.type === "kill" && mafiaPlayer?.jobId === JobId.MAFIA) {
									this.mafiaAction(data.targetId);
								} else if (data.type === "investigate" && mafiaPlayer?.jobId === JobId.POLICE) {
									this.policeAction(data.targetId, player);
								} else if (data.type === "heal" && mafiaPlayer?.jobId === JobId.DOCTOR) {
									this.doctorAction(data.targetId);
								} else if (data.type === "close") {
									player.tag.widget.nightAction.destroy();
									player.tag.widget.nightAction = null;
								}
							});
						}
					});
				}
				break;
			case MafiaPhase.DAY:
				{
					// 밤 액션 결과 평가
					this.evaluateNightActions();
					
					ScriptApp.sayToAll(`Room ${this.room.id}: 낮 단계 - 플레이어들이 토론을 진행합니다.`);

					this.room.actionToRoomPlayers((player) => {
						const gamePlayer: GamePlayer = getPlayerById(player.id);
						if (!gamePlayer) {
							player.isAlive = false;
							return;
						}

						// 밤 액션 위젯 제거
						if (gamePlayer.tag.widget.nightAction) {
							gamePlayer.tag.widget.nightAction.destroy();
							gamePlayer.tag.widget.nightAction = null;
						}
						
						// 플레이어 정보 저장
						gamePlayer.tag.mafiaPlayer = player;
					});
					
					// 승리 조건 체크
					this.checkWinCondition();
				}
				break;
			case MafiaPhase.VOTING:
				{
					ScriptApp.sayToAll(`Room ${this.room.id}: 투표 단계 - 마피아로 의심되는 플레이어에게 투표하세요.`);

					// 투표 결과 초기화
					this.voteResults = {};
					this.playerVotes = {};

					this.room.actionToRoomPlayers((player) => {
						const gamePlayer: GamePlayer = getPlayerById(player.id);
						if (!gamePlayer) {
							player.isAlive = false;
							return;
						}

						// 투표 위젯 표시 (살아있는 플레이어만)
						if (player.isAlive) {
							// 투표 위젯 생성
							gamePlayer.tag.widget.voteWidget = gamePlayer.showWidget("widgets/vote_widget.html", "middle", 0, 0);
							
							// 초기화 메시지 전송
							gamePlayer.tag.widget.voteWidget.sendMessage({
								type: 'init',
								isMobile: gamePlayer.isMobile,
								isTablet: gamePlayer.isTablet
							});
							
							// 투표 위젯에 데이터 전송
							gamePlayer.tag.widget.voteWidget.sendMessage({
								type: 'init',
								players: this.room?.players || [],
								myPlayerId: player.id,
								timeLimit: phaseDurations[MafiaPhase.VOTING]
							});
							
							// 투표 위젯 메시지 처리
							gamePlayer.tag.widget.voteWidget.onMessage.Add((player, data) => {
								if (data.type === "vote") {
									this.processVote(player.id, data.targetId);
								} else if (data.type === "close") {
									player.tag.widget.voteWidget.destroy();
									player.tag.widget.voteWidget = null;
								}
							});
						}
					});
				}
				break;
			default:
				ScriptApp.sayToAll(`Room ${this.room.id}: 알 수 없는 단계입니다.`);
		}
		if (this.dayCount == 0) this.dayCount = 1;
	}

	/**
	 * 투표 처리
	 * @param voterId 투표한 플레이어 ID
	 * @param targetId 투표 대상 플레이어 ID
	 */
	processVote(voterId: string, targetId: string) {
		// 이미 투표한 경우 이전 투표 취소
		if (this.playerVotes[voterId]) {
			const previousTarget = this.playerVotes[voterId];
			this.voteResults[previousTarget]--;
		}
		
		// 새 투표 등록
		this.playerVotes[voterId] = targetId;
		
		// 투표 결과 업데이트
		if (!this.voteResults[targetId]) {
			this.voteResults[targetId] = 1;
		} else {
			this.voteResults[targetId]++;
		}
		
		// 모든 플레이어에게 투표 결과 업데이트
		this.updateVoteResults();
		
		// 모든 플레이어가 투표했는지 확인
		const alivePlayers = this.room.players.filter(p => p.isAlive);
		const votedPlayers = Object.keys(this.playerVotes).length;
		
		if (votedPlayers >= alivePlayers.length) {
			// 모든 플레이어가 투표 완료
			this.finalizeVoting();
		}
	}

	/**
	 * 모든 플레이어에게 투표 결과 업데이트
	 */
	updateVoteResults() {
		if (!this.room) return;
		
		this.room.actionToRoomPlayers((player) => {
			const gamePlayer: GamePlayer = getPlayerById(player.id);
			if (!gamePlayer || !gamePlayer.tag.widget.voteWidget) return;
			
			gamePlayer.tag.widget.voteWidget.sendMessage({
				type: 'updateVotes',
				votes: this.voteResults
			});
		});
	}

	/**
	 * 투표 종료 및 결과 처리
	 */
	finalizeVoting() {
		if (!this.room) return;
		
		// 가장 많은 표를 받은 플레이어 찾기
		let maxVotes = 0;
		let eliminatedPlayerId = null;
		
		for (const [playerId, votes] of Object.entries(this.voteResults)) {
			if (votes > maxVotes) {
				maxVotes = votes;
				eliminatedPlayerId = playerId;
			}
		}
		
		// 투표 결과 표시
		this.room.actionToRoomPlayers((player) => {
			const gamePlayer: GamePlayer = getPlayerById(player.id);
			if (!gamePlayer || !gamePlayer.tag.widget.voteWidget) return;
			
			gamePlayer.tag.widget.voteWidget.sendMessage({
				type: 'showResults',
				results: this.voteResults
			});
		});
		
		// 3초 후 투표 위젯 제거 및 다음 단계로
		ScriptApp.runLater(() => {
			if (!this.room) return;
			
			// 투표 위젯 제거
			this.room.actionToRoomPlayers((player) => {
				const gamePlayer: GamePlayer = getPlayerById(player.id);
				if (!gamePlayer || !gamePlayer.tag.widget.voteWidget) return;
				
				gamePlayer.tag.widget.voteWidget.destroy();
				gamePlayer.tag.widget.voteWidget = null;
			});
			
			// 플레이어 탈락 처리
			if (eliminatedPlayerId) {
				const targetPlayer = this.room.players.find(p => p.id === eliminatedPlayerId);
				if (targetPlayer) {
					targetPlayer.isAlive = false;
					ScriptApp.sayToAll(`Room ${this.room.id}: ${targetPlayer.name}(${targetPlayer.jobId}) 플레이어가 투표로 탈락했습니다.`);
				}
			}
			
			// 승리 조건 체크
			this.checkWinCondition();
			
			// 다음 단계로
			if (this.state === GameState.IN_PROGRESS) {
				this.nextPhase();
			}
		}, 3);
	}

	/**
	 * 밤 단계에서 마피아가 희생 대상을 선택합니다.
	 * @param targetPlayerId 선택한 대상 플레이어의 ID
	 */
	mafiaAction(targetPlayerId: string): void {
		if (this.currentPhase !== MafiaPhase.NIGHT) {
			return;
		}
		this.nightActions.push({
			playerId: targetPlayerId,
			targetId: targetPlayerId,
			jobId: JobId.MAFIA
		});
	}

	/**
	 * 밤 단계에서 의사가 보호할 대상을 선택합니다.
	 * @param targetPlayerId 선택한 보호 대상 플레이어의 ID
	 */
	doctorAction(targetPlayerId: string): void {
		if (this.currentPhase !== MafiaPhase.NIGHT) {
			return;
		}
		this.nightActions.push({
			playerId: targetPlayerId,
			targetId: targetPlayerId,
			jobId: JobId.DOCTOR
		});
	}

	/**
	 * 밤 단계에서 경찰이 조사할 대상을 선택합니다.
	 * @param targetPlayerId 조사할 플레이어의 ID
	 * @param policePlayer 경찰 플레이어
	 */
	policeAction(targetPlayerId: string, policePlayer: GamePlayer): void {
		if (this.currentPhase !== MafiaPhase.NIGHT) {
			return;
		}
		this.nightActions.push({
			playerId: targetPlayerId,
			targetId: targetPlayerId,
			jobId: JobId.POLICE
		});
		
		// 대상 플레이어 찾기
		const targetPlayer = this.room.players.find(p => p.id === targetPlayerId);
		if (!targetPlayer) return;
		
		// 조사 결과 전송
		const isMafia = targetPlayer.jobId === JobId.MAFIA;
		
		// 경찰 플레이어에게 결과 전송
		if (policePlayer.tag.widget.nightAction) {
			policePlayer.tag.widget.nightAction.sendMessage({
				type: 'investigationResult',
				isMafia: isMafia
			});
		}
	}

	/**
	 * 밤 단계 액션 평가
	 * - 마피아가 선택한 대상이 의사의 보호 대상과 동일하면 보호 성공.
	 * - 그렇지 않으면 해당 플레이어를 사망 처리합니다.
	 */
	evaluateNightActions(): void {
		// 밤 액션 처리 로직
		const killedPlayers: string[] = [];
		const protectedPlayers: string[] = [];
		const blockedPlayers: string[] = [];
		
		// 보호 액션 먼저 처리
		this.nightActions.forEach(action => {
			const job = getJobById(action.jobId);
			if (!job) return;
			
			// 의사 등의 보호 능력
			if (job.abilityType === JobAbilityType.PROTECT) {
				protectedPlayers.push(action.targetId);
			}
			
			// 투표 방해 능력
			if (job.abilityType === JobAbilityType.BLOCK) {
				blockedPlayers.push(action.targetId);
			}
		});
		
		// 살해 액션 처리
		this.nightActions.forEach(action => {
			const job = getJobById(action.jobId);
			if (!job) return;
			
			// 마피아 등의 살해 능력
			if (job.abilityType === JobAbilityType.KILL) {
				const target = this.room.players.find(p => p.id === action.targetId);
				if (!target || !target.isAlive) return;
				
				// 보호되지 않았고, 면역이 없으면 사망
				if (!protectedPlayers.includes(action.targetId) && !target.isImmune) {
					killedPlayers.push(action.targetId);
				} else if (target.isImmune) {
					// 면역이 있으면 면역 소모
					target.isImmune = false;
				}
			}
		});
		
		// 투표 방해 상태 적용
		blockedPlayers.forEach(playerId => {
			const player = this.room.players.find(p => p.id === playerId);
			if (player) {
				player.isBlocked = true;
			}
		});
		
		// 사망 처리
		killedPlayers.forEach(playerId => {
			const player = this.room.players.find(p => p.id === playerId);
			if (player) {
				player.isAlive = false;
				
				// 사망 메시지 표시
				ScriptApp.showCenterLabel(`${player.name}님이 사망했습니다.`);
				
				// 사망한 플레이어에게 메시지 전송
				const gamePlayer = this.room.getGamePlayer(playerId);
				if (gamePlayer) {
					gamePlayer.tag.widget.main.sendMessage({
						type: "player_died",
						message: "당신은 사망했습니다."
					});
				}
			}
		});
		
		// 밤 액션 초기화
		this.nightActions = [];
		
		// 승리 조건 확인
		this.checkWinCondition();
	}

	/**
	 * 승리 조건 체크
	 * - 살아있는 플레이어 중 마피아가 0명이면 시민 승리
	 * - 마피아 수가 시민(및 기타) 수 이상이면 마피아 승리
	 */
	checkWinCondition() {
		const alivePlayers = this.room.players.filter(p => p.isAlive);
		const aliveMafia = alivePlayers.filter(p => this.isMafia(p));
		const aliveCitizens = alivePlayers.filter(p => !this.isMafia(p));
		
		// 마피아가 모두 사망한 경우 시민 승리
		if (aliveMafia.length === 0) {
			this.showGameResult(JobTeam.CITIZEN);
			return true;
		}
		
		// 마피아 수가 시민 수 이상인 경우 마피아 승리
		if (aliveMafia.length >= aliveCitizens.length) {
			this.showGameResult(JobTeam.MAFIA);
			return true;
		}
		
		return false;
	}

	/**
	 * 게임 결과 표시
	 * @param winnerTeam 승리한 팀
	 */
	showGameResult(winnerTeam: JobTeam) {
		// 게임 종료 상태로 변경
		this.state = GameState.ENDED;
		
		// 승리 메시지 표시
		const winMessage = winnerTeam === JobTeam.MAFIA ? "마피아 팀이 승리했습니다!" : "시민 팀이 승리했습니다!";
		ScriptApp.showCenterLabel(winMessage);
		
		// 모든 플레이어에게 결과 메시지 전송
		this.room.players.forEach(player => {
			const gamePlayer = this.room.getGamePlayer(player.id);
			if (gamePlayer) {
				const job = getJobById(player.jobId);
				const isWinner = job?.team === winnerTeam;
				
				gamePlayer.tag.widget.main.sendMessage({
					type: "game_result",
					winner: winnerTeam,
					isWinner: isWinner,
					message: winMessage
				});
			}
		});
		
		// 5초 후 게임 리셋
		setTimeout(() => {
			this.resetGame();
		}, 5000);
	}

	// 게임 리셋: 게임 상태와 단계 등을 초기화합니다.
	resetGame() {
		if (!this.room) return;
		
		this.state = GameState.WAITING;

		if (this.phaseCycle) {
			this.setPhase(this.phaseCycle[0]);
		} else {
			this.setPhase(MafiaPhase.DAY);
		}
		this.dayCount = 1;
		
		// 모든 위젯 제거
		this.room.actionToRoomPlayers((player) => {
			const gamePlayer: GamePlayer = getPlayerById(player.id);
			if (!gamePlayer) return;
			
			if (gamePlayer.tag.widget) {
				if (gamePlayer.tag.widget.gameStatus) {
					gamePlayer.tag.widget.gameStatus.destroy();
					gamePlayer.tag.widget.gameStatus = null;
				}
				
				if (gamePlayer.tag.widget.nightAction) {
					gamePlayer.tag.widget.nightAction.destroy();
					gamePlayer.tag.widget.nightAction = null;
				}
				
				if (gamePlayer.tag.widget.voteWidget) {
					gamePlayer.tag.widget.voteWidget.destroy();
					gamePlayer.tag.widget.voteWidget = null;
				}
			}
		});
		
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

	// 플레이어의 팀 확인 (마피아 여부)
	isMafia(player: MafiaPlayer): boolean {
		const job = getJobById(player.jobId);
		return job?.team === JobTeam.MAFIA;
	}

	// 능력 사용 처리
	processAbility(playerId: string, targetId: string): void {
		if (!this.room) return;
		
		const player = this.room.getPlayer(playerId);
		if (!player || !player.isAlive) return;
		
		const job = getJobById(player.jobId);
		if (!job) return;
		
		// 능력 사용 횟수 확인
		if (job.usesPerGame !== undefined && player.abilityUses !== undefined) {
			if (player.abilityUses <= 0) return;
			player.abilityUses--;
		}
		
		// 밤 능력인데 현재 밤이 아니면 사용 불가
		if (job.nightAbility && this.currentPhase !== MafiaPhase.NIGHT) return;
		
		// 낮 능력인데 현재 낮이 아니면 사용 불가
		if (job.dayAbility && this.currentPhase !== MafiaPhase.DAY) return;
		
		// 능력 사용 기록
		this.nightActions.push({
			playerId,
			targetId,
			jobId: player.jobId
		});
		
		// 플레이어에게 능력 사용 확인 메시지 전송
		const gamePlayer = this.room.getGamePlayer(playerId);
		if (gamePlayer) {
			gamePlayer.tag.widget.main.sendMessage({
				type: "ability_used",
				success: true,
				message: `${job.name} 능력을 사용했습니다.`
			});
		}
	}
}
