import { GamePlayer } from "../../types/GamePlayer";
import { GameRoom } from "../gameRoom/GameRoom";
import { getPlayerById } from "../../../../utils/Common";
import { Job, JobTeam, JobAbilityType, getJobById, getJobsByGameMode, JobId } from "../../types/JobTypes";
import { showLabel } from "../../../../utils/CustomLabelFunctions";

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

	// 최후 변론 관련 변수
	private defenseText: string = "";
	private approvalVoteResults: { approve: number; reject: number } = { approve: 0, reject: 0 };
	private approvalPlayerVotes: { [playerId: string]: string } = {};

	// 채팅 관련 프로퍼티
	private loverPlayers: string[] = []; // 연인 플레이어 ID 목록
	private deadPlayers: string[] = []; // 죽은 플레이어 ID 목록
	private chatMessages: { target: string; sender: string; senderName: string; message: string }[] = [];
	private deadChatWidgetShown: { [playerId: string]: boolean } = {}; // 죽은 플레이어별 채팅 위젯 표시 여부

	constructor(roomNumber: number) {
		this.roomNumber = roomNumber;
		this.currentPhase = MafiaPhase.DAY;
		// 기본 단계 순서 설정: 밤 → 낮 → 투표 → 최후 변론 → 찬반 투표 → 밤 ... 의 순환
		this.phaseCycle = [
			MafiaPhase.NIGHT,
			MafiaPhase.DAY,
			MafiaPhase.VOTING,
			MafiaPhase.FINAL_DEFENSE,
			MafiaPhase.APPROVAL_VOTING
		];
		this.phaseTimer = phaseDurations[this.currentPhase];
	}

	/**
	 * 게임 방의 모든 플레이어에게 중앙 라벨 메시지를 표시합니다.
	 * @param message 표시할 메시지
	 * @param duration 표시 시간 (ms)
	 */
	private showRoomLabel(message: string, duration: number = 3000) {
		if (!this.room) return;
		
		this.room.actionToRoomPlayers((player) => {
			const gamePlayer = getPlayerById(player.id);
			if (!gamePlayer) return;
			
			showLabel(gamePlayer, "room_message", {
				labelWidth: "L",
				labelDisplayTime: duration,
				texts: [{ text: message }],
				fixedPosition: false // 위치 자동 조정 활성화
			});
		});
	}

	/**
	 * 게임 방의 모든 플레이어에게 메시지를 전송합니다.
	 * @param message 전송할 메시지
	 */
	private sayToRoom(message: string) {
		if (!this.room) return;
		
		this.room.actionToRoomPlayers((player) => {
			const gamePlayer = getPlayerById(player.id);
			if (!gamePlayer) return;
			
			showLabel(gamePlayer, "room_chat", {
				labelWidth: "M",
				backgroundColor: 0x000000,
				labelDisplayTime: 4000,
				texts: [{ text: message }],
				fixedPosition: false // 위치 자동 조정 활성화
			});
		});
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
			this.sayToRoom("게임 룸이 설정되지 않았습니다.");
			return;
		}

		if (this.room.players.length < 4) {
			this.showRoomLabel("게임 시작을 위해 최소 4명의 플레이어가 필요합니다");
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

		// 특수 직업 연인 배정의 경우 따로 처리
		this.loverPlayers = playersShuffled
			.filter(p => p.jobId === JobId.LOVER)
			.map(p => p.id);
		
		// 채팅 메시지 초기화
		this.chatMessages = [];

		// 게임 상태 초기화
		this.state = GameState.IN_PROGRESS;
		this.dayCount = 1;

		// 플레이어 수에 따라 초기 단계 결정
		if (this.room.players.length <= 4) {
			this.phaseCycle = [MafiaPhase.DAY, MafiaPhase.VOTING, MafiaPhase.FINAL_DEFENSE, MafiaPhase.APPROVAL_VOTING, MafiaPhase.NIGHT];
			this.setPhase(MafiaPhase.DAY);
		} else {
			this.phaseCycle = [MafiaPhase.NIGHT, MafiaPhase.DAY, MafiaPhase.VOTING, MafiaPhase.FINAL_DEFENSE, MafiaPhase.APPROVAL_VOTING];
			this.setPhase(MafiaPhase.NIGHT);
		}

		// 게임 시작 메시지 표시
		this.showRoomLabel("게임이 시작되었습니다!");

		// 각 플레이어에게 역할 카드 표시
		this.room.players.forEach((player) => {
			const gamePlayer = this.room.getGamePlayer(player.id);
			if (gamePlayer) {
				this.showRoleCard(gamePlayer, player.jobId);
				this.initGameStatusWidgets();
			}
		});

		// 영매에게 죽은 플레이어 채팅 위젯 표시
		this.room.players.forEach(player => {
			if (player.jobId === JobId.MEDIUM && player.isAlive) {
				const gamePlayer = getPlayerById(player.id) as GamePlayer;
				if (gamePlayer) {
					this.showMediumChatWidget(gamePlayer);
				}
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
			isTablet: player.isTablet,
		});

		// 역할 정보 전송
		player.tag.widget.roleCard.sendMessage({
			type: "role_info",
			role: job.name,
			team: job.team,
			description: job.description,
			ability: job.abilityDescription,
			icon: job.icon || "❓",
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
				isTablet: gamePlayer.isTablet,
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
			type: "updateGameStatus",
			phase: this.currentPhase,
			day: this.dayCount,
			players: this.room?.players || [],
			myRole: player.jobId,
			myPlayerId: player.id,
			timeRemaining: this.phaseTimer,
			serverTime: Date.now(), // 서버 시간 전송
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
			this.sayToRoom("게임이 진행 중이 아닙니다.");
			return;
		}

		// 이전 단계의 위젯 정리
		this.cleanupPhaseWidgets();

		const currentIndex = this.phaseCycle.indexOf(this.currentPhase);
		const nextIndex = (currentIndex + 1) % this.phaseCycle.length;
		// 사이클이 처음으로 돌아오면 dayCount 증가
		if (nextIndex === 0) {
			this.dayCount++;
		}
		this.setPhase(this.phaseCycle[nextIndex]);
		this.sayToRoom(`단계 전환 -> ${this.currentPhase} (Day ${this.dayCount})`);

		// 모든 플레이어의 게임 상태 위젯 업데이트
		this.updateAllGameStatusWidgets();

		// 단계별 액션 실행
		this.executePhaseActions();
	}

	/**
	 * 현재 단계의 위젯을 정리합니다.
	 */
	private cleanupPhaseWidgets() {
		if (!this.room) return;

		this.room.actionToRoomPlayers((player) => {
			const gamePlayer: GamePlayer = getPlayerById(player.id);
			if (!gamePlayer) return;

			// 단계별 위젯 정리
			switch (this.currentPhase) {
				case MafiaPhase.NIGHT:
					if (gamePlayer.tag.widget.nightAction) {
						gamePlayer.tag.widget.nightAction.destroy();
						gamePlayer.tag.widget.nightAction = null;
					}
					break;
				case MafiaPhase.VOTING:
					if (gamePlayer.tag.widget.voteWidget) {
						gamePlayer.tag.widget.voteWidget.destroy();
						gamePlayer.tag.widget.voteWidget = null;
					}
					break;
				case MafiaPhase.FINAL_DEFENSE:
					if (gamePlayer.tag.widget.finalDefense) {
						gamePlayer.tag.widget.finalDefense.destroy();
						gamePlayer.tag.widget.finalDefense = null;
					}
					break;
				case MafiaPhase.APPROVAL_VOTING:
					if (gamePlayer.tag.widget.approvalVote) {
						gamePlayer.tag.widget.approvalVote.destroy();
						gamePlayer.tag.widget.approvalVote = null;
					}
					break;
			}
		});
	}

	/**
	 * 각 단계에 따른 행동을 추상화하여 처리합니다.
	 */
	private executePhaseActions() {
		if (!this.room) return;

		switch (this.currentPhase) {
			case MafiaPhase.NIGHT:
				{
					this.sayToRoom(`밤 단계 - 마피아가 희생자를 선택합니다.`);

					// 투표 결과 초기화
					this.voteResults = {};
					this.playerVotes = {};

					this.room.actionToRoomPlayers((player) => {
						const gamePlayer = getPlayerById(player.id) as GamePlayer;
						if (!gamePlayer) {
							player.isAlive = false;
							return;
						}

						// 이전 단계 위젯 정리
						if (gamePlayer.tag.widget.approvalVote) {
							gamePlayer.tag.widget.approvalVote.destroy();
							gamePlayer.tag.widget.approvalVote = null;
						}

						// 밤 액션 위젯 표시
						if (player.isAlive) {
							// 밤 액션 위젯 생성
							gamePlayer.tag.widget.nightAction = gamePlayer.showWidget("widgets/night_action.html", "middle", 0, 0);

							// 초기화 메시지 전송
							gamePlayer.tag.widget.nightAction.sendMessage({
								type: "init",
								isMobile: gamePlayer.isMobile,
								isTablet: gamePlayer.isTablet,
							});

							// 밤 액션 위젯에 데이터 전송
							gamePlayer.tag.widget.nightAction.sendMessage({
								type: "init",
								players: this.room?.players || [],
								myPlayerId: player.id,
								role: player.jobId.toLowerCase(),
								timeLimit: phaseDurations[MafiaPhase.NIGHT],
								serverTime: Date.now(), // 서버 시간 전송
							});

							// 밤 액션 위젯 메시지 처리
							gamePlayer.tag.widget.nightAction.onMessage.Add((player: GamePlayer, data) => {
								const mafiaPlayer = player.tag.mafiaPlayer;
								if (!mafiaPlayer) return;
								
								// 액션 타입에 따른 처리
								switch (data.type) {
									case "kill":
										if (mafiaPlayer.jobId === JobId.MAFIA) {
											this.mafiaAction(data.targetId);
										}
										break;
									case "investigate":
										if (mafiaPlayer.jobId === JobId.POLICE) {
											this.policeAction(data.targetId, player);
										}
										break;
									case "heal":
										if (mafiaPlayer.jobId === JobId.DOCTOR) {
											this.doctorAction(data.targetId);
										}
										break;
									case "contact":
										if (mafiaPlayer.jobId === JobId.SPY || mafiaPlayer.jobId === JobId.MADAM) {
											this.processAbility(mafiaPlayer.id, data.targetId);
										}
										break;
									case "listen":
										if (mafiaPlayer.jobId === JobId.MEDIUM) {
											this.processAbility(mafiaPlayer.id, data.targetId);
										}
										break;
									case "announce":
										if (mafiaPlayer.jobId === JobId.JOURNALIST) {
											this.processAbility(mafiaPlayer.id, data.targetId);
										}
										break;
									case "convert":
										if (mafiaPlayer.jobId === JobId.WEREWOLF) {
											this.processAbility(mafiaPlayer.id, data.targetId);
										}
										break;
									case "block":
										if (mafiaPlayer.jobId === JobId.GANGSTER) {
											this.processAbility(mafiaPlayer.id, data.targetId);
										}
										break;
									case "track":
										if (mafiaPlayer.jobId === JobId.DETECTIVE) {
											this.processAbility(mafiaPlayer.id, data.targetId);
										}
										break;
									case "initChat":
										// 채팅 초기화 - 연인 또는 영매의 채팅 시작
										if (data.chatTarget === "lover" && mafiaPlayer.jobId === JobId.LOVER) {
											// 연인의 채팅 초기화
											this.initLoverChat(player);
										} else if (data.chatTarget === "dead" && mafiaPlayer.jobId === JobId.MEDIUM) {
											// 영매의 채팅 초기화
											this.initMediumChat(player);
										}
										break;
									case "chatMessage":
										// 채팅 메시지 처리
										if (data.chatTarget === "lover" && mafiaPlayer.jobId === JobId.LOVER) {
											// 연인의 채팅 메시지
											this.broadcastLoverMessage(player, data.message);
										} else if (data.chatTarget === "dead" && mafiaPlayer.jobId === JobId.MEDIUM) {
											// 영매의 채팅 메시지 (영매는 메시지를 보낼 수 없음, 듣기만 가능)
											// 영매의 메시지는 죽은 플레이어들에게 전달되지 않음
										}
										break;
									case "close":
										player.tag.widget.nightAction.destroy();
										player.tag.widget.nightAction = null;
										break;
									default:
										// 액션이 없거나 특별한 처리가 필요 없는 직업은 여기서 처리
										if (data.targetId) {
											this.processAbility(mafiaPlayer.id, data.targetId);
										}
										break;
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

					this.sayToRoom(`낮 단계 - 플레이어들이 토론을 진행합니다.`);

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
					this.sayToRoom(`투표 단계 - 마피아로 의심되는 플레이어에게 투표하세요.`);

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
								type: "init",
								isMobile: gamePlayer.isMobile,
								isTablet: gamePlayer.isTablet,
							});

							// 투표 위젯에 데이터 전송
							gamePlayer.tag.widget.voteWidget.sendMessage({
								type: "init",
								players: this.room?.players || [],
								myPlayerId: player.id,
								timeLimit: phaseDurations[MafiaPhase.VOTING],
								serverTime: Date.now(), // 서버 시간 전송
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
			case MafiaPhase.FINAL_DEFENSE:
				{
					this.sayToRoom(`최후 변론 단계 - 가장 많은 표를 받은 플레이어가 최후 변론을 합니다.`);

					// 투표 결과 확인
					let maxVotes = 0;
					let defendantId = null;
					let defendantName = "";

					// 가장 많은 표를 받은 플레이어 찾기
					for (const [playerId, votes] of Object.entries(this.voteResults)) {
						if (votes > maxVotes) {
							maxVotes = votes;
							defendantId = playerId;
						}
					}

					// 피고인 정보 가져오기
					const defendant = this.room.players.find((p) => p.id === defendantId);
					if (!defendant) {
						// 피고인이 없으면 다음 단계로 넘어감
						this.nextPhase();
						return;
					}
					defendantName = defendant.name;

					// 최후 변론 위젯 표시
					this.room.actionToRoomPlayers((player) => {
						const gamePlayer: GamePlayer = getPlayerById(player.id);
						if (!gamePlayer) return;

						// 이전 단계 위젯 정리
						if (gamePlayer.tag.widget.voteWidget) {
							gamePlayer.tag.widget.voteWidget.destroy();
							gamePlayer.tag.widget.voteWidget = null;
						}

						// 최후 변론 위젯 생성
						gamePlayer.tag.widget.finalDefense = gamePlayer.showWidget("widgets/final_defense_widget.html", "middle", 0, 0);

						// 초기화 메시지 전송
						gamePlayer.tag.widget.finalDefense.sendMessage({
							type: "init",
							isMobile: gamePlayer.isMobile,
							isTablet: gamePlayer.isTablet,
							defendantId: defendantId,
							defendantName: defendantName,
							myPlayerId: player.id,
							timeLimit: phaseDurations[MafiaPhase.FINAL_DEFENSE],
							serverTime: Date.now(), // 서버 시간 전송
						});

						// 최후 변론 위젯 메시지 처리
						gamePlayer.tag.widget.finalDefense.onMessage.Add((player, data) => {
							if (data.type === "submitDefense") {
								// 변론 내용 브로드캐스트
								this.broadcastDefense(data.defense);
							} else if (data.type === "closeDefenseWidget") {
								if (player.tag.widget.finalDefense) {
									player.tag.widget.finalDefense.destroy();
									player.tag.widget.finalDefense = null;
								}
							}
						});
					});

					// 타이머 설정 - 시간이 다 되면 자동으로 다음 단계로 넘어감
					ScriptApp.runLater(() => {
						this.room.actionToRoomPlayers((player) => {
							const gamePlayer: GamePlayer = getPlayerById(player.id);
							if (!gamePlayer || !gamePlayer.tag.widget.finalDefense) return;
							gamePlayer.tag.widget.finalDefense.destroy();
							gamePlayer.tag.widget.finalDefense = null;
						});
						if (this.state === GameState.IN_PROGRESS) {
							this.nextPhase();
						}
					}, phaseDurations[MafiaPhase.FINAL_DEFENSE]);
				}
				break;
			case MafiaPhase.APPROVAL_VOTING:
				{
					this.sayToRoom(`찬반 투표 단계 - 최후 변론을 들은 후 처형에 대한 찬반 투표를 진행합니다.`);

					// 투표 결과 확인
					let maxVotes = 0;
					let defendantId = null;
					let defendantName = "";

					// 가장 많은 표를 받은 플레이어 찾기
					for (const [playerId, votes] of Object.entries(this.voteResults)) {
						if (votes > maxVotes) {
							maxVotes = votes;
							defendantId = playerId;
						}
					}

					// 피고인 정보 가져오기
					const defendant = this.room.players.find((p) => p.id === defendantId);
					if (!defendant) {
						// 피고인이 없으면 다음 단계로 넘어감
						this.nextPhase();
						return;
					}
					defendantName = defendant.name;

					// 찬반 투표 결과 초기화
					this.approvalVoteResults = { approve: 0, reject: 0 };
					this.approvalPlayerVotes = {};

					// 찬반 투표 위젯 표시
					this.room.actionToRoomPlayers((player) => {
						const gamePlayer: GamePlayer = getPlayerById(player.id);
						if (!gamePlayer) return;

						// 이전 단계 위젯 정리
						if (gamePlayer.tag.widget.finalDefense) {
							gamePlayer.tag.widget.finalDefense.destroy();
							gamePlayer.tag.widget.finalDefense = null;
						}

						// 찬반 투표 위젯 생성
						gamePlayer.tag.widget.approvalVote = gamePlayer.showWidget("widgets/approval_vote_widget.html", "middle", 0, 0);

						// 초기화 메시지 전송
						gamePlayer.tag.widget.approvalVote.sendMessage({
							type: "init",
							isMobile: gamePlayer.isMobile,
							isTablet: gamePlayer.isTablet,
							defendantId: defendantId,
							defendantName: defendantName,
							myPlayerId: player.id,
							isAlive: player.isAlive,
							defenseText: this.defenseText || "변론이 제출되지 않았습니다.",
							timeLimit: phaseDurations[MafiaPhase.APPROVAL_VOTING],
							serverTime: Date.now(), // 서버 시간 전송
						});

						// 찬반 투표 위젯 메시지 처리
						gamePlayer.tag.widget.approvalVote.onMessage.Add((player, data) => {
							if (data.type === "submitApprovalVote") {
								// 찬반 투표 처리
								this.processApprovalVote(player.id, data.vote);
							} else if (data.type === "closeApprovalVoteWidget") {
								if (player.tag.widget.approvalVote) {
									player.tag.widget.approvalVote.destroy();
									player.tag.widget.approvalVote = null;
								}
							}
						});
					});

					// 타이머 설정 - 시간이 다 되면 자동으로 결과 처리
					ScriptApp.runLater(() => {
						this.finalizeApprovalVoting();
					}, phaseDurations[MafiaPhase.APPROVAL_VOTING]); // 5초 후 다음 단계로
				}
				break;
			default:
				this.sayToRoom(`알 수 없는 단계입니다.`);
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
		const alivePlayers = this.room.players.filter((p) => p.isAlive);
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
				type: "updateVotes",
				votes: this.voteResults,
			});
		});
	}

	/**
	 * 투표 종료 및 결과 처리
	 */
	finalizeVoting() {
		if (!this.room) return;

		// 최종 투표 결과 확인
		let maxVotes = 0;
		let executedPlayerId = null;
		
		for (const [playerId, votes] of Object.entries(this.voteResults)) {
			if (votes > maxVotes) {
				maxVotes = votes;
				executedPlayerId = playerId;
			}
		}
		
		// 동률인 경우 처형하지 않음
		const tiedPlayers = Object.entries(this.voteResults)
			.filter(([_, votes]) => votes === maxVotes)
			.map(([playerId, _]) => playerId);
		
		if (tiedPlayers.length > 1) {
			this.sayToRoom(`투표 결과 동률로 처형이 진행되지 않습니다.`);
			return null;
		}
		
		// 처형될 플레이어가 있는 경우
		if (executedPlayerId) {
			const player = this.room.players.find(p => p.id === executedPlayerId);
			if (player) {
				player.isAlive = false;
				
				// 죽은 플레이어 목록에 추가
				if (!this.deadPlayers.includes(executedPlayerId)) {
					this.deadPlayers.push(executedPlayerId);
				}
				
				// 사망 메시지 표시
				this.sayToRoom(`${player.name}님이 마을 투표로 처형되었습니다.`);
				
				// 사망한 플레이어에게 메시지 전송
				const gamePlayer = getPlayerById(executedPlayerId) as GamePlayer;
				if (gamePlayer) {
					// 메인 위젯에 사망 알림
					if (gamePlayer.tag.widget.main) {
						gamePlayer.tag.widget.main.sendMessage({
							type: "player_died",
							message: "당신은 처형되었습니다.",
						});
					}
					
					// 죽은 플레이어용 채팅 위젯 표시
					this.showPermanentDeadChatWidget(gamePlayer);
				}
				
				return executedPlayerId;
			}
		}
		
		return null;
	}
	
	/**
	 * 죽은 플레이어 목록 반환
	 */
	public getDeadPlayers(): string[] {
		return [...this.deadPlayers];
	}

	/**
	 * 죽은 플레이어를 위한 영구 채팅 위젯 표시
	 */
	public showPermanentDeadChatWidget(player: GamePlayer) {
		// 이미 위젯이 표시되어 있는 경우 중복 생성 방지
		if (this.deadChatWidgetShown[player.id]) return;
		
		// 위젯이 있으면 제거
		if (player.tag.widget.deadChat) {
			player.tag.widget.deadChat.destroy();
			player.tag.widget.deadChat = null;
		}
		
		// 죽은 플레이어용 채팅 위젯 생성
		player.tag.widget.deadChat = player.showWidget("widgets/dead_chat_widget.html", "bottomright", 0, 0);
		
		// 초기화 메시지 전송
		player.tag.widget.deadChat.sendMessage({
			type: "init",
			isMobile: player.isMobile,
			isTablet: player.isTablet,
			myPlayerId: player.id,
			myName: player.name,
			myRole: "dead",  // 기본 역할 - 죽은 플레이어
			messages: this.chatMessages.filter(msg => msg.target === 'dead')  // 기존 채팅 기록 전송
		});
		
		// 위젯 메시지 처리
		player.tag.widget.deadChat.onMessage.Add((player: GamePlayer, data) => {
			if (data.type === "deadChatMessage") {
				// 죽은 플레이어 채팅 메시지 처리
				this.broadcastPermanentDeadMessage(player, data.message);
			} else if (data.type === "hideDeadChat") {
				// 채팅 위젯 최소화 (제거하지 않음)
				this.deadChatWidgetShown[player.id] = false;
			} else if (data.type === "showDeadChat") {
				// 채팅 위젯 다시 표시
				this.deadChatWidgetShown[player.id] = true;
			}
		});
		
		// 위젯 표시 상태 기록
		this.deadChatWidgetShown[player.id] = true;
	}
	
	/**
	 * 영매에게 죽은 플레이어 채팅 위젯 표시
	 */
	showMediumChatWidget(player: GamePlayer) {
		// 영매가 아니면 리턴
		if (player.tag.mafiaPlayer.jobId !== JobId.MEDIUM) return;
		
		// 이미 위젯이 표시되어 있는 경우 중복 생성 방지
		if (this.deadChatWidgetShown[player.id]) return;
		
		// 위젯이 있으면 제거
		if (player.tag.widget.deadChat) {
			player.tag.widget.deadChat.destroy();
			player.tag.widget.deadChat = null;
		}
		
		// 영매용 채팅 위젯 생성
		player.tag.widget.deadChat = player.showWidget("widgets/dead_chat_widget.html", "bottomright", 0, 0);
		
		// 초기화 메시지 전송
		player.tag.widget.deadChat.sendMessage({
			type: "init",
			isMobile: player.isMobile,
			isTablet: player.isTablet,
			myPlayerId: player.id,
			myName: player.name,
			myRole: "medium",  // 영매 역할
			messages: this.chatMessages.filter(msg => msg.target === 'dead')  // 기존 채팅 기록 전송
		});
		
		// 위젯 메시지 처리
		player.tag.widget.deadChat.onMessage.Add((player: GamePlayer, data) => {
			if (data.type === "hideDeadChat") {
				// 채팅 위젯 최소화 (제거하지 않음)
				this.deadChatWidgetShown[player.id] = false;
			} else if (data.type === "showDeadChat") {
				// 채팅 위젯 다시 표시
				this.deadChatWidgetShown[player.id] = true;
			}
		});
		
		// 위젯 표시 상태 기록
		this.deadChatWidgetShown[player.id] = true;
	}
	
	/**
	 * 죽은 플레이어 메시지 브로드캐스트 (상시)
	 */
	private broadcastPermanentDeadMessage(sender: GamePlayer, message: string) {
		// 메시지 저장
		this.chatMessages.push({
			target: 'dead',
			sender: sender.id,
			senderName: sender.name,
			message: message
		});
		
		// 다른 죽은 플레이어들과 영매에게 메시지 전송
		this.room?.actionToRoomPlayers((player) => {
			// 죽은 플레이어에게 전송
			if (!player.isAlive || this.deadPlayers.includes(player.id)) {
				const deadPlayer = getPlayerById(player.id) as GamePlayer;
				if (deadPlayer && deadPlayer.tag.widget.deadChat && deadPlayer.id !== sender.id) {
					deadPlayer.tag.widget.deadChat.sendMessage({
						type: "chatMessage",
						senderId: sender.id,
						senderName: sender.name,
						message: message
					});
				}
			}
			// 영매에게도 전송
			else if (player.jobId === JobId.MEDIUM) {
				const mediumPlayer = getPlayerById(player.id) as GamePlayer;
				if (mediumPlayer && mediumPlayer.tag.widget.deadChat) {
					mediumPlayer.tag.widget.deadChat.sendMessage({
						type: "chatMessage",
						senderId: sender.id,
						senderName: sender.name,
						message: message
					});
				}
			}
		});
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
			jobId: JobId.MAFIA,
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
			jobId: JobId.DOCTOR,
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
			jobId: JobId.POLICE,
		});

		// 대상 플레이어 찾기
		const targetPlayer = this.room.players.find((p) => p.id === targetPlayerId);
		if (!targetPlayer) return;

		// 조사 결과 전송
		const isMafia = targetPlayer.jobId === JobId.MAFIA;

		// 경찰 플레이어에게 결과 전송
		if (policePlayer.tag.widget.nightAction) {
			policePlayer.tag.widget.nightAction.sendMessage({
				type: "investigationResult",
				isMafia: isMafia,
			});
		}
	}

	/**
	 * 밤 단계 액션 평가
	 */
	evaluateNightActions(): void {
		// 밤 액션 처리 로직
		const killedPlayers: string[] = [];
		const protectedPlayers: string[] = [];
		const blockedPlayers: string[] = [];

		// 보호 액션 먼저 처리
		this.nightActions.forEach((action) => {
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
		this.nightActions.forEach((action) => {
			const job = getJobById(action.jobId);
			if (!job) return;

			// 마피아 등의 살해 능력
			if (job.abilityType === JobAbilityType.KILL) {
				const target = this.room.players.find((p) => p.id === action.targetId);
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
		blockedPlayers.forEach((playerId) => {
			const player = this.room.players.find((p) => p.id === playerId);
			if (player) {
				player.isBlocked = true;
			}
		});

		// 사망 처리
		killedPlayers.forEach((playerId) => {
			const player = this.room.players.find((p) => p.id === playerId);
			if (player) {
				player.isAlive = false;
				
				// 죽은 플레이어 목록에 추가
				if (!this.deadPlayers.includes(playerId)) {
					this.deadPlayers.push(playerId);
				}

				// 사망 메시지 표시
				this.showRoomLabel(`${player.name}님이 사망했습니다.`);

				// 사망한 플레이어에게 메시지 전송
				const gamePlayer = getPlayerById(playerId) as GamePlayer;
				if (gamePlayer) {
					// 메인 위젯에 사망 알림
					if (gamePlayer.tag.widget.main) {
						gamePlayer.tag.widget.main.sendMessage({
							type: "player_died",
							message: "당신은 사망했습니다.",
						});
					}
					
					// 죽은 플레이어용 채팅 위젯 표시
					this.showPermanentDeadChatWidget(gamePlayer);
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
		const alivePlayers = this.room.players.filter((p) => p.isAlive);
		const aliveMafia = alivePlayers.filter((p) => this.isMafia(p));
		const aliveCitizens = alivePlayers.filter((p) => !this.isMafia(p));

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
		if (!this.room) return;

		this.state = GameState.ENDED;

		// 승리 메시지 표시
		let winMessage = winnerTeam === JobTeam.MAFIA ? "마피아 승리!" : "시민 승리!";
		this.showRoomLabel(winMessage, 5000);

		// 모든 플레이어에게 결과 메시지 전송
		this.room.actionToRoomPlayers((player) => {
			const gamePlayer: GamePlayer = getPlayerById(player.id);
			if (!gamePlayer) return;

			// 게임 결과 위젯 표시 (여기서는 단순히 메시지만 표시)
			if (gamePlayer.tag.widget.gameStatus) {
				gamePlayer.tag.widget.gameStatus.sendMessage({
					type: "gameResult",
					winnerTeam: winnerTeam,
				});
			}
		});
		
		// 5초 후 게임 리셋
		ScriptApp.runLater(() => {
			this.resetGame();

			// 게임 종료 처리
			if (this.room) {
				this.room.endGame();
			}
		}, 5); // 5초 후 실행
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

				if (gamePlayer.tag.widget.finalDefense) {
					gamePlayer.tag.widget.finalDefense.destroy();
					gamePlayer.tag.widget.finalDefense = null;
				}

				if (gamePlayer.tag.widget.approvalVote) {
					gamePlayer.tag.widget.approvalVote.destroy();
					gamePlayer.tag.widget.approvalVote = null;
				}
				
				if (gamePlayer.tag.widget.deadChat) {
					gamePlayer.tag.widget.deadChat.destroy();
					gamePlayer.tag.widget.deadChat = null;
				}
			}
		});

		// 변수 초기화
		this.voteResults = {};
		this.playerVotes = {};
		this.approvalVoteResults = { approve: 0, reject: 0 };
		this.approvalPlayerVotes = {};
		this.defenseText = "";
		this.nightActions = [];

		// 죽은 플레이어 목록 초기화
		this.deadPlayers = [];
		
		// 채팅 메시지 초기화
		this.chatMessages = [];
		
		// 죽은 플레이어 채팅 위젯 표시 상태 초기화
		this.deadChatWidgetShown = {};

		this.sayToRoom(`게임이 리셋되었습니다.`);
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
			jobId: player.jobId,
		});

		// 플레이어에게 능력 사용 확인 메시지 전송
		const gamePlayer = this.room.getGamePlayer(playerId);
		if (gamePlayer) {
			gamePlayer.tag.widget.main.sendMessage({
				type: "ability_used",
				success: true,
				message: `${job.name} 능력을 사용했습니다.`,
			});
		}
	}

	/**
	 * 최후 변론 내용을 모든 플레이어에게 전송
	 * @param defense 변론 내용
	 */
	private broadcastDefense(defense: string) {
		if (!this.room) return;

		// 변론 내용 저장
		this.defenseText = defense;

		// 모든 플레이어에게 변론 내용 전송
		this.room.actionToRoomPlayers((player) => {
			const gamePlayer: GamePlayer = getPlayerById(player.id);
			if (!gamePlayer || !gamePlayer.tag.widget.finalDefense) return;

			gamePlayer.tag.widget.finalDefense.sendMessage({
				type: "updateDefense",
				defense: defense,
			});
		});
	}

	/**
	 * 찬반 투표 처리
	 * @param voterId 투표한 플레이어 ID
	 * @param vote 투표 (approve 또는 reject)
	 */
	processApprovalVote(voterId: string, vote: string) {
		// 이미 투표한 경우 이전 투표 취소
		if (this.approvalPlayerVotes[voterId]) {
			const previousVote = this.approvalPlayerVotes[voterId];
			this.approvalVoteResults[previousVote]--;
		}

		// 새 투표 등록
		this.approvalPlayerVotes[voterId] = vote;

		// 투표 결과 업데이트
		this.updateApprovalVoteResults();

		// 모든 플레이어가 투표했는지 확인
		const alivePlayers = this.room.players.filter((p) => p.isAlive);
		const votedPlayers = Object.keys(this.approvalPlayerVotes).length;

		if (votedPlayers >= alivePlayers.length) {
			// 모든 플레이어가 투표 완료
			this.finalizeApprovalVoting();
		}
	}

	/**
	 * 모든 플레이어에게 찬반 투표 결과 업데이트
	 */
	updateApprovalVoteResults() {
		if (!this.room) return;

		this.room.actionToRoomPlayers((player) => {
			const gamePlayer: GamePlayer = getPlayerById(player.id);
			if (!gamePlayer || !gamePlayer.tag.widget.approvalVote) return;

			gamePlayer.tag.widget.approvalVote.sendMessage({
				type: "showResults",
				results: this.approvalVoteResults,
			});
		});
	}

	/**
	 * 찬반 투표 결과를 최종 처리합니다.
	 */
	finalizeApprovalVoting() {
		if (!this.room) return;

		// 찬반 투표 결과 업데이트
		this.updateApprovalVoteResults();

		// 찬반 투표 결과 표시
		this.room.actionToRoomPlayers((player) => {
			const gamePlayer: GamePlayer = getPlayerById(player.id);
			if (!gamePlayer || !gamePlayer.tag.widget.approvalVote) return;

			// 결과 표시
			gamePlayer.tag.widget.approvalVote.sendMessage({
				type: "showResults",
				results: this.approvalVoteResults,
			});
		});

		// 찬성이 더 많으면 플레이어 처형
		let maxVotes = 0;
		let defendantId = null;
		for (const [playerId, votes] of Object.entries(this.voteResults)) {
			if (votes > maxVotes) {
				maxVotes = votes;
				defendantId = playerId;
			}
		}

		// 처형 결과 처리
		if (this.approvalVoteResults.approve > this.approvalVoteResults.reject) {
			// 찬성이 더 많으면 플레이어 처형
			const defendant = this.room.players.find((p) => p.id === defendantId);
			if (defendant) {
				defendant.isAlive = false;
				this.sayToRoom(`${defendant.name}님이 처형되었습니다.`);
			}
		} else {
			// 반대가 더 많거나 같으면 처형 무효
			this.sayToRoom(`처형이 부결되었습니다.`);
		}

		// 승리 조건 체크
		if (this.checkWinCondition()) {
			return; // 게임이 종료되었으므로 여기서 종료
		}

		// 위젯 정리 및 다음 단계로 진행
		ScriptApp.runLater(() => {
			// 찬반 투표 위젯 제거
			this.room.actionToRoomPlayers((player) => {
				const gamePlayer: GamePlayer = getPlayerById(player.id);
				if (!gamePlayer || !gamePlayer.tag.widget.approvalVote) return;
				gamePlayer.tag.widget.approvalVote.destroy();
				gamePlayer.tag.widget.approvalVote = null;
			});

			// 다음 단계로
			if (this.state === GameState.IN_PROGRESS) {
				this.nextPhase();
			}
		}, 5); // 5초 후 다음 단계로
	}

	/**
	 * 연인 채팅 초기화
	 */
	private initLoverChat(player: GamePlayer) {
		// 이미 저장된 채팅 메시지 전송
		this.chatMessages
			.filter(msg => msg.target === 'lover')
			.forEach(msg => {
				if (player.tag.widget.nightAction) {
					player.tag.widget.nightAction.sendMessage({
						type: "chatMessage",
						chatTarget: "lover",
						sender: msg.senderName,
						message: msg.message
					});
				}
			});
	}
	
	/**
	 * 영매 채팅 초기화
	 */
	private initMediumChat(player: GamePlayer) {
		// 이미 저장된 채팅 메시지 전송
		this.chatMessages
			.filter(msg => msg.target === 'dead')
			.forEach(msg => {
				if (player.tag.widget.nightAction) {
					player.tag.widget.nightAction.sendMessage({
						type: "chatMessage",
						chatTarget: "dead",
						sender: msg.senderName,
						message: msg.message
					});
				}
			});
	}
	
	/**
	 * 연인 메시지 브로드캐스트
	 */
	private broadcastLoverMessage(sender: GamePlayer, message: string) {
		// 메시지 저장
		this.chatMessages.push({
			target: 'lover',
			sender: sender.id,
			senderName: sender.name,
			message: message
		});
		
		// 다른 연인들에게 메시지 전송
		this.loverPlayers.forEach(loverId => {
			if (loverId === sender.id) return; // 자신에게는 전송하지 않음
			
			const loverPlayer = getPlayerById(loverId) as GamePlayer;
			if (loverPlayer && loverPlayer.tag.widget.nightAction) {
				loverPlayer.tag.widget.nightAction.sendMessage({
					type: "chatMessage",
					chatTarget: "lover",
					sender: sender.name,
					message: message
				});
			}
		});
	}
}
