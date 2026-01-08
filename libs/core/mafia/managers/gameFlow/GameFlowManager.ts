import { GamePlayer } from "../../types/GamePlayer";
import { GameRoom } from "../gameRoom/GameRoom";
import { getPlayerById } from "../../../../utils/Common";
import { Job, JobTeam, JobAbilityType, getJobById, getJobsByGameMode, JobId, JOBS } from "../../types/JobTypes";
import { showLabel } from "../../../../utils/CustomLabelFunctions";
import { WidgetManager } from "../widget/WidgetManager";
import { WidgetType } from "../widget/WidgetType";

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
	seducedBy?: string; // 유혹 당한 상태 (마담 능력)
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
	private room: GameRoom | null = null;
	private phaseEndCallback: (() => void) | null = null; // 페이즈 종료 시 실행할 콜백

	// 밤에 수행되는 액션들을 저장하는 변수들
	private nightActions: AbilityAction[] = [];
	private blockedVoters: string[] = []; // 건달에 의해 투표가 차단된 플레이어들
	private journalistReport: { targetName: string; targetJob: string } | null = null; // 기자의 특종 정보
	private werewolfTamed: boolean = false; // 짐승인간이 마피아에게 길들여졌는지 여부
	private werewolfTargetSelection: string | null = null; // 짐승인간이 선택한 대상
	private soldierArmor: { [playerId: string]: boolean } = {}; // 군인의 방탄복 상태
	private terroristTarget: string | null = null; // 테러리스트가 함께 처형할 대상
	private gravediggerJob: JobId | null = null; // 도굴꾼이 복사한 직업

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
	private mafiaChatPlayers: string[] = []; // 마피아 채팅 가능한 플레이어 ID 목록 (마피아, 스파이)
	private chatMessages: { target: string; sender: string; senderName: string; message: string }[] = [];
	private deadChatWidgetShown: { [playerId: string]: boolean } = {}; // 죽은 플레이어별 채팅 위젯 표시 여부
	private mafiaChatWidgetShown: { [playerId: string]: boolean } = {}; // 마피아 채팅 위젯 표시 여부

	// 낮 단계 채팅 관련 변수 추가
	private dayChatMessages: { sender: string; senderName: string; message: string; timestamp: number }[] = [];
	private dayChatCooldowns: { [playerId: string]: number } = {}; // 플레이어별 채팅 쿨다운(타임스탬프)
	private readonly CHAT_COOLDOWN: number = 0.3; // 채팅 쿨다운 시간(초)

	constructor() {
		this.currentPhase = MafiaPhase.DAY;
		// 기본 단계 순서 설정: 밤 → 낮 → 투표 → 최후 변론 → 찬반 투표 → 밤 ... 의 순환
		this.phaseCycle = [MafiaPhase.NIGHT, MafiaPhase.DAY, MafiaPhase.VOTING, MafiaPhase.FINAL_DEFENSE, MafiaPhase.APPROVAL_VOTING];
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
				fixedPosition: false, // 위치 자동 조정 활성화
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
				fixedPosition: false, // 위치 자동 조정 활성화
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
	 * 게임 시작
	 * - 최소 4명의 플레이어가 있어야 합니다.
	 * - 플레이어 역할을 무작위로 배정합니다.
	 * - 플레이어 수에 따라 초기 단계가 결정됩니다.
	 *   → 4명: 낮부터 시작
	 *   → 4명보다 많은 경우: 밤부터 시작
	 */
	startGame() {
		const widgetManager = WidgetManager.instance;

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
		this.loverPlayers = playersShuffled.filter((p) => p.jobId === JobId.LOVER).map((p) => p.id);

		// 마피아 플레이어 목록 초기화
		this.mafiaChatPlayers = playersShuffled.filter((p) => p.jobId === JobId.MAFIA).map((p) => p.id);

		// 채팅 메시지 초기화
		this.chatMessages = [];
		this.mafiaChatWidgetShown = {};

		// 게임 상태 초기화
		this.state = GameState.IN_PROGRESS;
		this.dayCount = 1;
		
		// 모든 플레이어의 준비 상태 초기화
		if (this.room) {
			this.room.resetAllPlayersReady();
		}

		// 게임 관련 변수 초기화
		this.blockedVoters = [];
		this.journalistReport = null;
		this.werewolfTamed = false;
		this.werewolfTargetSelection = null;
		this.soldierArmor = {};
		this.terroristTarget = null;
		this.gravediggerJob = null;

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
				widgetManager.hideAllWidgets(gamePlayer);
				this.showRoleCard(gamePlayer, player.jobId);
			}
		});

		// 게임 상태 위젯 초기화 (한 번만 호출)
		this.initGameStatusWidgets();

		// 영매에게 죽은 플레이어 채팅 위젯 표시
		this.room.players.forEach((player) => {
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

	/**
	 * 게임 상태를 업데이트합니다.
	 * dt: 델타 타임 (초 단위)
	 */
	updateGameState(dt: number): void {
		if (this.state !== GameState.IN_PROGRESS) return;

		// 타이머 감소
		if (this.phaseTimer > 0) {
			this.phaseTimer -= dt;

			// 모든 플레이어의 게임 상태 위젯 업데이트 (매 초마다)
			if (Math.floor(this.phaseTimer) !== Math.floor(this.phaseTimer + dt)) {
				this.updateAllGameStatusWidgets();
			}
		}

		// 낮 단계일 때 채팅 쿨다운 업데이트
		if (this.currentPhase === MafiaPhase.DAY) {
			this.updateChatCooldowns();
		}

		// 타이머가 0 이하로 떨어지면 페이즈 종료 처리
		if (this.phaseTimer <= 0) {
			if (this.phaseEndCallback) {
				// 설정된 콜백이 있으면 실행
				const callback = this.phaseEndCallback;
				this.phaseEndCallback = null; // 콜백 초기화
				callback();
			} else {
				// 설정된 콜백이 없으면 기본적으로 다음 페이즈로 진행
				this.nextPhase();
			}
		}
	}

	// 게임 모드에 따라 사용 가능한 직업 목록 가져오기
	private getAvailableJobs(): Job[] {
		// JobTypes.ts에서 getJobsByGameMode 함수 사용
		const jobs = getJobsByGameMode(this.room.gameMode.id);

		// 직업 섞기
		return [...jobs].sort(() => Math.random() - 0.5);
	}

	// 역할 카드 표시
	private showRoleCard(player: GamePlayer, jobId: JobId) {
		const job = getJobById(jobId);
		if (!job) return;

		// 위젯 관리자 사용
		const widgetManager = WidgetManager.instance;

		// 역할 카드 위젯 표시
		widgetManager.showWidget(player, WidgetType.ROLE_CARD);

		// 역할 정보 전송
		widgetManager.sendMessageToWidget(player, WidgetType.ROLE_CARD, {
			type: "role_info",
			roleId: job.id,
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

			// 위젯 관리자 사용
			const widgetManager = WidgetManager.instance;

			// 게임 상태 위젯 표시
			widgetManager.showWidget(gamePlayer, WidgetType.GAME_STATUS);

			// 게임 상태 정보 전송
			this.updateGameStatusWidget(gamePlayer, player);
		});
	}

	/**
	 * 특정 플레이어의 게임 상태 위젯을 업데이트합니다.
	 */
	private updateGameStatusWidget(gamePlayer: GamePlayer, player: MafiaPlayer) {
		const widgetManager = WidgetManager.instance;

		widgetManager.sendMessageToWidget(gamePlayer, WidgetType.GAME_STATUS, {
			type: "updateGameStatus",
			phase: this.currentPhase,
			day: this.dayCount,
			players: this.room?.players || [],
			myRole: getJobById(player.jobId),
			myPlayerId: player.id,
			timeRemaining: this.phaseTimer,
			serverTime: Date.now(), // 서버 시간 전송
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

		// 투표 단계가 끝나면 투표 차단 목록 초기화
		if (this.currentPhase === MafiaPhase.APPROVAL_VOTING) {
			this.blockedVoters = [];
		}

		const currentIndex = this.phaseCycle.indexOf(this.currentPhase);
		const nextIndex = (currentIndex + 1) % this.phaseCycle.length;

		// 다음 단계가 FINAL_DEFENSE인 경우 최후 변론 내용 초기화
		if (this.phaseCycle[nextIndex] === MafiaPhase.FINAL_DEFENSE) {
			this.defenseText = "";
		}

		// 다음 단계가 APPROVAL_VOTING인 경우 찬반 투표 결과 초기화
		if (this.phaseCycle[nextIndex] === MafiaPhase.APPROVAL_VOTING) {
			this.approvalVoteResults = { approve: 0, reject: 0 };
			this.approvalPlayerVotes = {};
		}

		// 다음 단계가 VOTING인 경우 투표 결과 초기화
		if (this.phaseCycle[nextIndex] === MafiaPhase.VOTING) {
			this.voteResults = {};
			this.playerVotes = {};
		}

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

		const widgetManager = WidgetManager.instance;

		this.room.actionToRoomPlayers((player) => {
			const gamePlayer: GamePlayer = getPlayerById(player.id);
			if (!gamePlayer) return;

			// 단계별 위젯 숨기기
			switch (this.currentPhase) {
				case MafiaPhase.NIGHT:
					widgetManager.hideWidget(gamePlayer, WidgetType.NIGHT_ACTION);
					break;
				case MafiaPhase.DAY:
					widgetManager.hideWidget(gamePlayer, WidgetType.DAY_CHAT);
					break;
				case MafiaPhase.VOTING:
					widgetManager.hideWidget(gamePlayer, WidgetType.VOTE);
					break;
				case MafiaPhase.FINAL_DEFENSE:
					widgetManager.hideWidget(gamePlayer, WidgetType.FINAL_DEFENSE);
					break;
				case MafiaPhase.APPROVAL_VOTING:
					// 찬반 투표 위젯을 완전히 제거하고 모든 관련 데이터 초기화
					widgetManager.hideWidget(gamePlayer, WidgetType.APPROVAL_VOTE);
					this.approvalVoteResults = { approve: 0, reject: 0 };
					this.approvalPlayerVotes = {};
					break;
			}
		});
	}

	/**
	 * 각 단계에 따른 행동을 추상화하여 처리합니다.
	 */
	private executePhaseActions() {
		if (!this.room) return;

		const widgetManager = WidgetManager.instance;

		switch (this.currentPhase) {
			case MafiaPhase.NIGHT:
				{
					this.sayToRoom(`밤 단계 - 마피아가 희생자를 선택합니다.`);

					// 밤 액션 초기화
					this.nightActions = [];
					this.werewolfTargetSelection = null;

					// 스파이의 능력 사용 횟수 초기화 (기본 1회)
					this.room.players.forEach((player) => {
						if (player.jobId === JobId.SPY && player.isAlive) {
							player.abilityUses = 1;
						}
					});

					// NIGHT 단계 시작 시 마피아 채팅 활성화 여부 확인 (2명 이상일 경우)
					if (this.mafiaChatPlayers.length >= 2) {
						ScriptApp.runLater(() => {
							this.activateMafiaChat();
						}, 0);
					}

					this.room.actionToRoomPlayers((player) => {
						const gamePlayer = getPlayerById(player.id) as GamePlayer;
						if (!gamePlayer) {
							player.isAlive = false;
							return;
						}

						// 이전 단계 위젯 숨기기
						widgetManager.hideWidget(gamePlayer, WidgetType.APPROVAL_VOTE);

						// 밤 액션 위젯 표시 (살아있는 플레이어만)
						if (player.isAlive) {

							// 밤 액션 위젯 표시
							widgetManager.showWidget(gamePlayer, WidgetType.NIGHT_ACTION);

							// 밤 액션 위젯에 데이터 전송
							// 짐승인간의 경우 길들여진 상태에 따라 다른 roleId 전송
							let roleId = player.jobId.toLowerCase();
							if (player.jobId === JobId.WEREWOLF && this.werewolfTamed) {
								roleId = "werewolf_tamed";
							}
							
							widgetManager.sendMessageToWidget(gamePlayer, WidgetType.NIGHT_ACTION, {
								type: "init",
								players: this.room?.players || [],
								myPlayerId: player.id,
								role: roleId,
								timeLimit: phaseDurations[MafiaPhase.NIGHT],
								serverTime: Date.now(), // 서버 시간 전송
							});

							// 마피아팀 채팅 참여자가 2명 이상이고 현재 플레이어가 마피아팀인 경우 채팅 위젯 활성화
							// 길들여진 짐승인간도 마피아 채팅에 참여 가능
							const canUseMafiaChat = this.mafiaChatPlayers.includes(player.id) || 
													(player.jobId === JobId.WEREWOLF && this.werewolfTamed);
							if (this.mafiaChatPlayers.length >= 2 && canUseMafiaChat) {
								ScriptApp.runLater(() => {
									if (gamePlayer && gamePlayer.tag.widget.nightAction) {
										this.initMafiaChat(gamePlayer);
										this.mafiaChatWidgetShown[player.id] = true;
									}
								}, 1);
							}

							widgetManager.clearMessageHandlers(gamePlayer, WidgetType.NIGHT_ACTION);

							// 밤 액션 위젯 메시지 처리 - 최초 한 번만 등록
							widgetManager.registerMessageHandler(gamePlayer, WidgetType.NIGHT_ACTION, (player: GamePlayer, data) => {
								const mafiaPlayer = this.room?.players.find((p) => p.id === player.id);
								if (!mafiaPlayer) return;

								// 액션 타입에 따른 처리
								switch (data.type) {
									case "kill":
										if (mafiaPlayer.jobId === JobId.MAFIA) {
											this.mafiaAction(mafiaPlayer.id, data.targetId);
										}
										break;
									case "investigate":
										if (mafiaPlayer.jobId === JobId.POLICE) {
											this.policeAction(data.targetId, player);
										}
										break;
									case "heal":
										if (mafiaPlayer.jobId === JobId.DOCTOR) {
											this.doctorAction(mafiaPlayer.id, data.targetId);
										}
										break;
									case "contact":
										if (mafiaPlayer.jobId === JobId.SPY) {
											this.spyAction(data.targetId, player);
										} else if (mafiaPlayer.jobId === JobId.MADAM) {
											this.processAbility(mafiaPlayer.id, data.targetId);
										}
										break;
									case "listen":
										if (mafiaPlayer.jobId === JobId.MEDIUM) {
											this.processAbility(mafiaPlayer.id, data.targetId);
										}
										break;
									case "block":
										if (mafiaPlayer.jobId === JobId.GANGSTER) {
											this.gangsterAction(data.targetId, player);
										}
										break;
									case "track":
										if (mafiaPlayer.jobId === JobId.DETECTIVE) {
											this.detectiveAction(data.targetId, player);
										}
										break;
									case "announce":
										if (mafiaPlayer.jobId === JobId.JOURNALIST) {
											this.journalistAction(data.targetId, player);
										}
										break;
									case "convert":
										if (mafiaPlayer.jobId === JobId.WEREWOLF) {
											this.werewolfAction(data.targetId, player);
										}
										break;
									case "suicide":
										if (mafiaPlayer.jobId === JobId.TERRORIST) {
											this.terroristAction(data.targetId, player);
										}
										break;
									case "seduce":
										if (mafiaPlayer.jobId === JobId.MADAM) {
											this.madamAction(mafiaPlayer.id, data.targetId, player);
										}
										break;
									case "chatMessage":
										// 채팅 메시지 처리
										if (data.chatTarget === "lover" && mafiaPlayer.jobId === JobId.LOVER) {
											this.broadcastLoverMessage(player, data.message);
										} else if (data.chatTarget === "dead") {
											this.broadcastPermanentDeadMessage(player, data.message);
										} else if (data.chatTarget === "mafia" && (mafiaPlayer.jobId === JobId.MAFIA || mafiaPlayer.jobId === JobId.SPY || (mafiaPlayer.jobId === JobId.WEREWOLF && this.werewolfTamed))) {
											this.broadcastMafiaMessage(player, data.message);
										}
										break;
									case "initChat":
										// 채팅 초기화 처리
										if (data.chatTarget === "lover" && mafiaPlayer.jobId === JobId.LOVER) {
											this.initLoverChat(player);
										} else if (data.chatTarget === "dead") {
											this.initMediumChat(player);
										} else if (data.chatTarget === "mafia" && (mafiaPlayer.jobId === JobId.MAFIA || mafiaPlayer.jobId === JobId.SPY || (mafiaPlayer.jobId === JobId.WEREWOLF && this.werewolfTamed))) {
											this.initMafiaChat(player);
										}
										break;
								}
							});
						}

						// 연인인 경우 연인 채팅 초기화
						if (player.jobId === JobId.LOVER) {
							ScriptApp.runLater(() => {
								const gamePlayer = getPlayerById(player.id) as GamePlayer;
								if (gamePlayer && gamePlayer.tag.widget.nightAction) {
									// 연인 채팅 초기화
									this.initLoverChat(gamePlayer);
								}
							}, 1); // 위젯이 로드된 후 약간의 지연시간을 줌
						}

						// 마피아 플레이어인 경우 마피아 채팅 초기화
						if (player.jobId === JobId.MAFIA && this.mafiaChatPlayers.includes(player.id)) {
							ScriptApp.runLater(() => {
								const gamePlayer = getPlayerById(player.id) as GamePlayer;
								if (gamePlayer && gamePlayer.tag.widget.nightAction) {
									// 마피아 채팅 초기화
									this.initMafiaChat(gamePlayer);
								}
							}, 1); // 위젯이 로드된 후 약간의 지연시간을 줌
						}

						// 스파이가 마피아와 접선에 성공한 경우 마피아 채팅 초기화
						if (player.jobId === JobId.SPY && this.mafiaChatPlayers.includes(player.id)) {
							ScriptApp.runLater(() => {
								const gamePlayer = getPlayerById(player.id) as GamePlayer;
								if (gamePlayer && gamePlayer.tag.widget.nightAction) {
									// 마피아 채팅 초기화
									this.initMafiaChat(gamePlayer);
								}
							}, 1); // 위젯이 로드된 후 약간의 지연시간을 줌
						}
					});

					// 타이머 설정 - 페이즈 종료 시 콜백 설정
					this.phaseTimer = phaseDurations[MafiaPhase.NIGHT];
					this.phaseEndCallback = () => {
						// 밤 액션 결과 평가
						this.evaluateNightActions();
						// 다음 페이즈로 진행
						this.nextPhase();
					};
				}
				break;
			case MafiaPhase.DAY:
				{
					this.sayToRoom(`낮 단계 - 플레이어들이 토론을 진행합니다.`);

					// 기자의 특종 공개
					if (this.journalistReport) {
						this.showRoomLabel(`📰 특종! ${this.journalistReport.targetName}님의 직업은 ${this.journalistReport.targetJob}입니다!`, 5000);
						this.journalistReport = null;
					}

					// 낮 채팅 메시지 초기화
					this.dayChatMessages = [];
					this.dayChatCooldowns = {};

					this.room.actionToRoomPlayers((player) => {
						const gamePlayer: GamePlayer = getPlayerById(player.id);
						if (!gamePlayer) {
							player.isAlive = false;
							return;
						}

						// 밤 액션 위젯 제거
						widgetManager.hideWidget(gamePlayer, WidgetType.NIGHT_ACTION);

						// 낮 채팅 위젯 표시 (살아있는 플레이어만)
						if (player.isAlive) {
							// 이전 메시지 핸들러 제거를 위해 위젯 초기화
							widgetManager.clearMessageHandlers(gamePlayer, WidgetType.DAY_CHAT);

							// 낮 채팅 위젯 표시
							widgetManager.showWidget(gamePlayer, WidgetType.DAY_CHAT);

							// 낮 채팅 위젯에 데이터 전송
							widgetManager.sendMessageToWidget(gamePlayer, WidgetType.DAY_CHAT, {
								type: "init",
								players: this.room?.players.filter((p) => p.isAlive) || [],
								myPlayerId: player.id,
								myPlayerName: player.name,
								timeLimit: phaseDurations[MafiaPhase.DAY],
								serverTime: Date.now(),
								isMobile: gamePlayer.isMobile,
								isTablet: gamePlayer.isTablet,
							});

							// 낮 채팅 위젯 메시지 처리 - 등록
							widgetManager.registerMessageHandler(gamePlayer, WidgetType.DAY_CHAT, (player: GamePlayer, data) => {
								const mafiaPlayer = this.room?.players.find((p) => p.id === player.id);
								if (!mafiaPlayer || !mafiaPlayer.isAlive) return;

								if (data.type === "chatMessage" && data.message) {
									this.processDayChatMessage(player, data.message);
								}
							});
						}
					});

					// 타이머 설정 - 페이즈 종료 시 콜백 설정
					this.phaseTimer = phaseDurations[MafiaPhase.DAY];
					this.phaseEndCallback = () => this.nextPhase();

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
							// 투표 위젯 표시
							this.showVoteWidget(player);
						}
					});

					// 타이머 설정 - 페이즈 종료 시 콜백 설정
					this.phaseTimer = phaseDurations[MafiaPhase.VOTING];
					this.phaseEndCallback = () => this.finalizeVoting();
				}
				break;
			case MafiaPhase.FINAL_DEFENSE:
				{
					this.sayToRoom(`최후 변론 단계 - 투표 결과로 선정된 플레이어의 최후 변론 시간입니다.`);

					// 투표 결과 확인
					let maxVotes = 0;
					let defendantId: string | null = null;
					let defendantName = "";

					for (const [playerId, votes] of Object.entries(this.voteResults)) {
						if (votes > maxVotes) {
							maxVotes = votes;
							defendantId = playerId;
						}
					}

					// 피고인 정보 가져오기
					const defendant = this.room.players.find((p) => p.id === defendantId);
					if (!defendant) {
						// 피고인이 없는 경우 (투표가 없었거나 동점인 경우)
						this.sayToRoom(`투표 결과가 없거나 동률이어서 변론 없이 진행됩니다.`);

						// 페이즈 종료 시 콜백 설정 (5초 후 실행)
						this.phaseTimer = 5;
						this.phaseEndCallback = () => this.nextPhase();
						return;
					}
					defendantName = defendant.name;

					// 최후 변론 위젯 표시 - 모든 플레이어에게 표시
					this.room.actionToRoomPlayers((player) => {
						const gamePlayer = getPlayerById(player.id);
						if (gamePlayer) {
							this.showFinalDefenseWidget(player, defendant);
						}
					});

					// 타이머 설정 - 페이즈 종료 시 콜백 설정
					this.phaseTimer = phaseDurations[MafiaPhase.FINAL_DEFENSE];
					this.phaseEndCallback = () => this.nextPhase();
				}
				break;
			case MafiaPhase.APPROVAL_VOTING:
				{
					this.sayToRoom(`찬반 투표 단계 - 최후 변론을 들은 후 처형에 대한 찬반 투표를 진행합니다.`);

					// 찬반 투표 결과 초기화
					this.approvalVoteResults = { approve: 0, reject: 0 };
					this.approvalPlayerVotes = {};

					// 모든 플레이어의 찬반 투표 위젯 숨기기 (초기화를 위해)
					this.room.actionToRoomPlayers((player) => {
						const gamePlayer = getPlayerById(player.id);
						if (gamePlayer) {
							const widgetManager = WidgetManager.instance;
							widgetManager.hideWidget(gamePlayer, WidgetType.APPROVAL_VOTE);
						}
					});

					// 투표 결과 확인
					let maxVotes = 0;
					let defendantId: string | null = null;
					const defendantName = "";

					for (const [playerId, votes] of Object.entries(this.voteResults)) {
						if (votes > maxVotes) {
							maxVotes = votes;
							defendantId = playerId;
						}
					}

					// 피고인 정보 가져오기
					const defendant = this.room.players.find((p) => p.id === defendantId);
					if (!defendant) {
						// 피고인이 없으면 다음 단계로 넘어감 (투표가 없었거나 동점인 경우)
						// 투표 과정을 건너뛰고 바로 다음 단계로 진행
						this.sayToRoom(`투표 결과 동률로 처형이 진행되지 않습니다.`);
						this.nextPhase();
						return;
					}
					// defendantName = defendant.name;

					// 찬반 투표 위젯 표시 - 피고인을 제외한 모든 살아있는 플레이어에게
					this.room.actionToRoomPlayers((player) => {
						if (player.isAlive && player.id !== defendant.id) {
							const gamePlayer = getPlayerById(player.id);
							if (gamePlayer) {
								this.showApprovalVoteWidget(player, defendant);
							}
						}
					});

					this.phaseTimer = phaseDurations[MafiaPhase.APPROVAL_VOTING];
					this.phaseEndCallback = () => this.finalizeApprovalVoting();
				}
				break;
			default:
				this.sayToRoom(`알 수 없는 단계입니다.`);
		}
		if (this.dayCount == 0) this.dayCount = 1;
	}

	/**
	 * 투표 위젯 표시
	 * @param player 게임 플레이어
	 */
	public showVoteWidget(player: MafiaPlayer) {
		if (!player.isAlive) return;

		const gamePlayer = getPlayerById(player.id);
		if (!gamePlayer) return;

		const widgetManager = WidgetManager.instance;


		// 이전 메시지 핸들러 제거
		widgetManager.clearMessageHandlers(gamePlayer, WidgetType.VOTE);
		// 투표 위젯 표시
		widgetManager.showWidget(gamePlayer, WidgetType.VOTE);

		// 투표 위젯 초기화 데이터 전송
		widgetManager.sendMessageToWidget(gamePlayer, WidgetType.VOTE, {
			type: "init",
			players: this.room?.players.filter((p) => p.isAlive) || [],
			myPlayerId: player.id,
			timeLimit: phaseDurations[MafiaPhase.VOTING],
			serverTime: Date.now(), // 서버 시간 전송
			blockedVoters: this.blockedVoters, // 투표 차단된 플레이어 목록 추가
		});


		// 투표 위젯 메시지 처리 - 최초 한 번만 등록
		widgetManager.registerMessageHandler(gamePlayer, WidgetType.VOTE, (sender: GamePlayer, data) => {
			// console.log("Vote message received:", data);
			// console.log("Sender ID:", sender.id);
			
			if (data.type === "vote" && data.targetId) {
				// GamePlayer의 ID로 MafiaPlayer 찾기
				const mafiaPlayer = this.room?.players.find((p) => p.id === sender.id);
				// console.log("MafiaPlayer found:", mafiaPlayer);
				
				if (mafiaPlayer && mafiaPlayer.isAlive) {
					if(mafiaPlayer.jobId === JobId.MADAM){
						this.processVote(mafiaPlayer.id, data.targetId);
						this.madamAction(mafiaPlayer.id, data.targetId, sender);
					}else {
						this.processVote(mafiaPlayer.id, data.targetId);
					}
				} else {
					// console.log("MafiaPlayer not found or not alive - player:", mafiaPlayer);
				}
			}
		});
	}

	/**
	 * 현재 최대 투표를 받은 피고인의 ID를 반환합니다.
	 * @returns 최대 투표를 받은 피고인의 ID 또는 null
	 */
	private findFinalDefenseDefendant(): string | null {
		let maxVotes = 0;
		let defendantId: string | null = null;

		for (const [playerId, votes] of Object.entries(this.voteResults)) {
			if (votes > maxVotes) {
				maxVotes = votes;
				defendantId = playerId;
			}
		}

		return defendantId;
	}

	/**
	 * 최후 변론 위젯 표시
	 * @param player 게임 플레이어
	 * @param targetPlayer 투표 대상 플레이어
	 */
	public showFinalDefenseWidget(player: MafiaPlayer, targetPlayer: MafiaPlayer) {
		const gamePlayer = getPlayerById(player.id);
		if (!gamePlayer) return;

		const widgetManager = WidgetManager.instance;


		// 이전 메시지 핸들러 제거
		widgetManager.clearMessageHandlers(gamePlayer, WidgetType.FINAL_DEFENSE);
		// 최후 변론 위젯 표시
		widgetManager.showWidget(gamePlayer, WidgetType.FINAL_DEFENSE);

		// 최후 변론 위젯 초기화 데이터 전송
		widgetManager.sendMessageToWidget(gamePlayer, WidgetType.FINAL_DEFENSE, {
			type: "init",
			timeLimit: phaseDurations[MafiaPhase.FINAL_DEFENSE],
			serverTime: Date.now(),
			isDefendant: player.id === targetPlayer.id,
			defendantName: targetPlayer.name,
			defendantId: targetPlayer.id,
			myPlayerId: player.id,
		});


		// 최후 변론 위젯 메시지 처리
		widgetManager.registerMessageHandler(gamePlayer, WidgetType.FINAL_DEFENSE, (sender: GamePlayer, data) => {
			if (data.type === "submitDefense") {
				// 현재 최대 투표를 받은 피고인 확인
				const currentDefendantId = this.findFinalDefenseDefendant();

				// 피고인이 변론을 제출한 경우에만 처리
				if (sender.id === currentDefendantId) {
					this.defenseText = data.defense || "";
					this.broadcastDefense(this.defenseText);
				}
			}
		});
	}

	/**
	 * 찬반 투표 위젯 표시
	 * @param player 게임 플레이어
	 * @param targetPlayer 투표 대상 플레이어
	 */
	public showApprovalVoteWidget(player: MafiaPlayer, targetPlayer: MafiaPlayer) {
		if (!player.isAlive || player.id === targetPlayer.id) return;

		const gamePlayer = getPlayerById(player.id);
		if (!gamePlayer) return;

		const widgetManager = WidgetManager.instance;


		// 위젯 표시 전에 짧은 지연을 주어 완전히 제거되도록 함
		ScriptApp.runLater(() => {
			// 이전 메시지 핸들러 제거
			widgetManager.clearMessageHandlers(gamePlayer, WidgetType.APPROVAL_VOTE);

			// 찬반 투표 위젯 표시
			widgetManager.showWidget(gamePlayer, WidgetType.APPROVAL_VOTE);

			// 찬반 투표 위젯 초기화 데이터 전송
			widgetManager.sendMessageToWidget(gamePlayer, WidgetType.APPROVAL_VOTE, {
				type: "init",
				timeLimit: phaseDurations[MafiaPhase.APPROVAL_VOTING],
				serverTime: Date.now(),
				defendantName: targetPlayer.name,
				defendantId: targetPlayer.id,
				myPlayerId: player.id,
				isAlive: player.isAlive,
				defenseText: this.defenseText,
			});

			// 찬반 투표 위젯 메시지 처리
			widgetManager.registerMessageHandler(gamePlayer, WidgetType.APPROVAL_VOTE, (sender: GamePlayer, data) => {
				if (data.type === "submitApprovalVote" && (data.vote === "approve" || data.vote === "reject")) {
					// GamePlayer의 ID로 MafiaPlayer 찾기
					const mafiaPlayer = this.room?.players.find((p) => p.id === sender.id);
					const currentDefendantId = this.findFinalDefenseDefendant();

					// console.log("Approval vote received:", data.vote, "from:", sender.id);

					if (mafiaPlayer && mafiaPlayer.isAlive && mafiaPlayer.id !== currentDefendantId) {
						this.processApprovalVote(mafiaPlayer.id, data.vote);
					} else {
						// console.log("Approval vote rejected - player:", mafiaPlayer, "isAlive:", mafiaPlayer?.isAlive, "isDefendant:", mafiaPlayer?.id === currentDefendantId);
					}
				}
			});
		}, 0.1); // 0.1초 후 실행하여 hideWidget이 먼저 완료되도록 함
	}

	/**
	 * 사망자 채팅 위젯을 표시합니다.
	 */
	public showPermanentDeadChatWidget(player: GamePlayer) {
		if (this.deadChatWidgetShown[player.id]) {
			return; // 이미 표시된 경우 중복 실행 방지
		}

		const widgetManager = WidgetManager.instance;

		// 사망자 채팅 위젯 표시
		widgetManager.showWidget(player, WidgetType.DEAD_CHAT);

		// 사망자 채팅 위젯 초기화 데이터 전송
		widgetManager.sendMessageToWidget(player, WidgetType.DEAD_CHAT, {
			type: "initDeadChat",
			messages: this.chatMessages.filter((msg) => msg.target === "dead"),
		});

		widgetManager.clearMessageHandlers(player, WidgetType.DEAD_CHAT);

		// 사망자 채팅 위젯 메시지 처리 - 최초 한 번만 등록
		widgetManager.registerMessageHandler(player, WidgetType.DEAD_CHAT, (sender: GamePlayer, data) => {
			if (data.type === "deadChatMessage" && data.message) {
				this.broadcastPermanentDeadMessage(sender, data.message);
			}
		});

		this.deadChatWidgetShown[player.id] = true;
	}

	/**
	 * 영매를 위한 채팅 위젯을 표시합니다.
	 */
	showMediumChatWidget(player: GamePlayer) {
		if (this.deadChatWidgetShown[player.id]) {
			return; // 이미 표시된 경우 중복 실행 방지
		}

		const widgetManager = WidgetManager.instance;

		// 사망자 채팅 위젯 표시
		widgetManager.showWidget(player, WidgetType.DEAD_CHAT);

		// 영매 채팅 위젯 초기화 데이터 전송
		widgetManager.sendMessageToWidget(player, WidgetType.DEAD_CHAT, {
			type: "init",
			myPlayerId: player.id,
			myName: player.name,
			myRole: "medium",
			isNight: this.currentPhase === MafiaPhase.NIGHT, // 현재 밤 여부 전송
			messages: this.chatMessages.filter((msg) => msg.target === "dead"),
		});

		widgetManager.clearMessageHandlers(player, WidgetType.DEAD_CHAT);

		// 영매 채팅 위젯 메시지 처리 - 최초 한 번만 등록
		widgetManager.registerMessageHandler(player, WidgetType.DEAD_CHAT, (sender: GamePlayer, data) => {
			if (data.type === "deadChatMessage" && data.message && this.currentPhase === MafiaPhase.NIGHT) {
				this.broadcastPermanentDeadMessage(sender, data.message);
			}
		});

		this.deadChatWidgetShown[player.id] = true;
	}

	/**
	 * 죽은 플레이어 목록 반환
	 */
	public getDeadPlayers(): string[] {
		return [...this.deadPlayers];
	}

	/**
	 * 투표 처리
	 * @param voterId 투표한 플레이어 ID
	 * @param targetId 투표 대상 플레이어 ID
	 */
	processVote(voterId: string, targetId: string) {
		// 상태 확인 (투표 단계가 아니면 처리하지 않음)
		if (this.currentPhase !== MafiaPhase.VOTING) {
			this.sayToRoom(`현재 단계는 투표 단계가 아닙니다.`);
			return;
		}

		// 건달에 의해 투표가 차단되었는지 확인
		if (this.blockedVoters.includes(voterId)) {
			const voter = getPlayerById(voterId);
			if (voter && voter.tag.widget.voteWidget) {
				voter.tag.widget.voteWidget.sendMessage({
					type: "voteRejected",
					message: "건달에 의해 투표가 차단되었습니다.",
				});
			}
			return;
		}

		// 중복 투표 확인
		if (this.playerVotes[voterId] === targetId) {
			const voter = getPlayerById(voterId);
			if (voter && voter.tag.widget.voteWidget) {
				voter.tag.widget.voteWidget.sendMessage({
					type: "voteRejected",
					message: "이미 해당 플레이어에게 투표했습니다.",
				});
			}
			return;
		}

		// 타겟이 유효한지 확인
		const targetPlayer = this.room.players.find((p) => p.id === targetId);
		if (!targetPlayer || !targetPlayer.isAlive) {
			const voter = getPlayerById(voterId);
			if (voter && voter.tag.widget.voteWidget) {
				voter.tag.widget.voteWidget.sendMessage({
					type: "voteRejected",
					message: "대상 플레이어가 유효하지 않습니다.",
				});
			}
			return;
		}

		// 기존 투표 취소 (있는 경우)
		if (this.playerVotes[voterId]) {
			const previousTargetId = this.playerVotes[voterId];
			if (this.voteResults[previousTargetId] > 0) {
				this.voteResults[previousTargetId]--;
			}
		}

		// 새 투표 저장
		this.playerVotes[voterId] = targetId;

		// 투표 결과 업데이트
		if (!this.voteResults[targetId]) {
			this.voteResults[targetId] = 1;
		} else {
			this.voteResults[targetId]++;
		}

		// 디버깅: 현재 투표 상태 로그
		const voterInfo = this.room.players.find(p => p.id === voterId);
		const targetInfo = this.room.players.find(p => p.id === targetId);
		this.sayToRoom(`[투표] ${voterInfo?.name}님이 ${targetInfo?.name}님에게 투표했습니다. (현재 ${this.voteResults[targetId]}표)`);
		// console.log("Current vote results:", this.voteResults);

		// 투표한 플레이어에게 확인 메시지 전송
		const voter = getPlayerById(voterId);
		if (voter && voter.tag.widget.voteWidget) {
			voter.tag.widget.voteWidget.sendMessage({
				type: "voteConfirmed",
				targetId: targetId,
			});
		}

		// 모든 플레이어에게 투표 결과 업데이트
		this.updateVoteResults();

		// 모든 살아있는 플레이어가 투표했는지 확인
		const alivePlayers = this.room.players.filter((p) => p.isAlive);

		// 살아있는 플레이어 중에서 투표한 플레이어 수 계산
		const aliveVoters = Object.keys(this.playerVotes).filter((playerId) => {
			const player = this.room.players.find((p) => p.id === playerId);
			return player && player.isAlive;
		});

		if (aliveVoters.length >= alivePlayers.length) {
			// 모든 살아있는 플레이어가 투표 완료
			// 페이즈 종료 콜백을 즉시 실행하여 타이머와 상관없이 바로 다음 단계로 진행
			if (this.phaseEndCallback) {
				const callback = this.phaseEndCallback;
				this.phaseEndCallback = null;
				callback();
			}
		}
	}

	/**
	 * 모든 플레이어에게 투표 결과 업데이트
	 */
	updateVoteResults() {
		if (!this.room) return;
		const widgetManager = WidgetManager.instance;

		this.room.actionToRoomPlayers((player) => {
			const gamePlayer: GamePlayer = getPlayerById(player.id);
			if (!gamePlayer) return;

			widgetManager.sendMessageToWidget(gamePlayer, WidgetType.VOTE, {
				type: "updateVotes",
				votes: this.voteResults,
			});
		});
	}

	/**
	 * 찬반 투표 결과를 최종 처리합니다.
	 */
	finalizeApprovalVoting() {
		if (!this.room) return;

		// 디버깅: 찬반 투표 결과 로그
		// console.log("Approval vote results:", this.approvalVoteResults);
		// console.log("Approval player votes:", this.approvalPlayerVotes);

		// 모든 플레이어에게 찬반 투표 결과 표시 (최종 결과임을 명시)
		this.room.actionToRoomPlayers((player) => {
			const gamePlayer: GamePlayer = getPlayerById(player.id);
			if (!gamePlayer || !gamePlayer.tag.widget || !gamePlayer.tag.widget.approvalVote) return;

			// 모든 플레이어에게 최종 결과를 표시하고 투표 UI를 숨김
			gamePlayer.tag.widget.approvalVote.sendMessage({
				type: "showResults",
				results: this.approvalVoteResults,
				isFinalResult: true, // 최종 결과임을 표시하는 플래그 추가
			});
		});

		// 피고인 찾기 - 첫 번째 투표(VOTING)에서 가장 많은 표를 받은 사람
		const defendant = this.findFinalDefenseDefendant();
		const defendantPlayer = defendant ? this.room.players.find((p) => p.id === defendant) : null;

		// 처형 결과 처리
		const approveVotes = this.approvalVoteResults.approve || 0;
		const rejectVotes = this.approvalVoteResults.reject || 0;
		const totalVotes = approveVotes + rejectVotes;
		
		// 살아있는 플레이어 수 (피고인 제외)
		const alivePlayers = this.room.players.filter((p) => p.isAlive);
		const votablePlayerCount = alivePlayers.length - 1; // 피고인 제외
		
		// 과반수 계산 (투표 가능한 사람의 절반 초과)
		const majorityThreshold = Math.floor(votablePlayerCount / 2) + 1;
		
		this.sayToRoom(`찬반 투표 결과: 찬성 ${approveVotes}표, 반대 ${rejectVotes}표 (과반수: ${majorityThreshold}표)`);
		
		// 찬성이 과반수 이상이면 처형
		if (defendantPlayer && approveVotes >= majorityThreshold) {
			// 정치인은 처형되지 않음
			if (defendantPlayer.jobId === JobId.POLITICIAN) {
				this.sayToRoom(`${defendantPlayer.name}님은 정치인이라 처형되지 않습니다!`);
			} else {
				// 과반수 이상 찬성이면 플레이어 처형
				defendantPlayer.isAlive = false;
				this.sayToRoom(`${defendantPlayer.name}님이 처형되었습니다.`);

				// 테러리스트의 자폭 능력 확인
				if (defendantPlayer.jobId === JobId.TERRORIST && this.terroristTarget) {
					const targetPlayer = this.room.players.find(p => p.id === this.terroristTarget);
					if (targetPlayer && targetPlayer.isAlive) {
						targetPlayer.isAlive = false;
						this.sayToRoom(`💣 ${defendantPlayer.name}님의 자폭으로 ${targetPlayer.name}님도 함께 처형되었습니다!`);
						
						// 함께 죽은 플레이어도 사망자 채팅 위젯 표시
						const targetGamePlayer = getPlayerById(targetPlayer.id);
						if (targetGamePlayer) {
							this.showPermanentDeadChatWidget(targetGamePlayer);
						}
					}
					// 자폭 대상 초기화
					this.terroristTarget = null;
				}

				// 사망자 채팅 위젯 표시
				const gamePlayer = getPlayerById(defendantPlayer.id);
				if (gamePlayer) {
					this.showPermanentDeadChatWidget(gamePlayer);
				}
			}
		} else if (defendantPlayer) {
			// 과반수 미달이면 처형 무효
			this.sayToRoom(`처형이 부결되었습니다. (찬성 ${approveVotes}표, 과반수 ${majorityThreshold}표 필요)`);
		}
		// 피고인이 없는 경우 (defendantId가 null인 경우)는 메시지를 표시하지 않음

		// 모든 플레이어의 게임 상태 위젯 업데이트
		this.updateAllGameStatusWidgets();

		// 위젯 정리 및 다음 단계로 진행 - 페이즈 종료 시 콜백 설정 (5초 후 실행)
		this.phaseTimer = 5;
		this.phaseEndCallback = () => {
			// 모든 플레이어의 찬반 투표 위젯 숨기기
			this.room.actionToRoomPlayers((player) => {
				const gamePlayer: GamePlayer = getPlayerById(player.id);
				if (!gamePlayer) return;

				// WidgetManager를 통해 찬반 투표 위젯 숨기기
				const widgetManager = WidgetManager.instance;
				widgetManager.hideWidget(gamePlayer, WidgetType.APPROVAL_VOTE);
			});

			// 승리 조건 체크
			if (this.checkWinCondition()) {
				return; // 게임이 종료되었으므로 여기서 종료
			}

			// 다음 단계로
			if (this.state === GameState.IN_PROGRESS) {
				this.nextPhase();
			}
		};
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
		const winMessage = winnerTeam === JobTeam.MAFIA ? "마피아 승리!" : "시민 승리!";
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

		// 5초 후에 게임 종료 처리 및 대기실로 돌아가기
		ScriptApp.runLater(() => {
			// 게임룸 상태 변경
			if (this.room) {
				// 모든 플레이어의 위젯 업데이트
				this.room.actionToRoomPlayers((player) => {
					const gamePlayer: GamePlayer = getPlayerById(player.id);
					if (!gamePlayer) return;

					// 게임 관련 위젯 정리
					const widgetManager = WidgetManager.instance;
					widgetManager.hideWidget(gamePlayer, WidgetType.GAME_STATUS);
					widgetManager.hideWidget(gamePlayer, WidgetType.NIGHT_ACTION);
					widgetManager.hideWidget(gamePlayer, WidgetType.VOTE);
					widgetManager.hideWidget(gamePlayer, WidgetType.FINAL_DEFENSE);
					widgetManager.hideWidget(gamePlayer, WidgetType.APPROVAL_VOTE);
					widgetManager.hideWidget(gamePlayer, WidgetType.DEAD_CHAT);
					widgetManager.hideWidget(gamePlayer, WidgetType.ROLE_CARD);
					widgetManager.hideWidget(gamePlayer, WidgetType.DAY_CHAT);

					// 방 위젯이 있으면 게임 종료 메시지 전송
					if (gamePlayer.tag.widget.room) {
						gamePlayer.tag.widget.room.sendMessage({
							type: "gameEnded",
						});
					}
				});

				// 게임 종료 이벤트 발생
				this.room.endGame();
			}
		}, 5);
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

		// 모든 위젯 제거 (오브젝트 풀 패턴 사용)
		this.room.actionToRoomPlayers((player) => {
			const gamePlayer: GamePlayer = getPlayerById(player.id);
			if (!gamePlayer) return;

			// WidgetManager를 통해 플레이어 위젯 정리
			const widgetManager = WidgetManager.instance;
			widgetManager.cleanupPlayerWidgets(gamePlayer);
		});

		// 변수 초기화
		this.nightActions = [];
		this.voteResults = {};
		this.playerVotes = {};
		this.defenseText = "";
		this.approvalVoteResults = { approve: 0, reject: 0 };
		this.approvalPlayerVotes = {};
		this.loverPlayers = [];
		this.deadPlayers = [];
		this.mafiaChatPlayers = [];
		this.chatMessages = [];
		this.deadChatWidgetShown = {};
		this.mafiaChatWidgetShown = {};
	}

	setPhase(phase: MafiaPhase) {
		this.currentPhase = phase;

		// 영매에게 페이즈 변경 알림
		if (this.room) {
			this.room.actionToRoomPlayers((player) => {
				if (player.jobId === JobId.MEDIUM && player.isAlive) {
					const mediumPlayer = getPlayerById(player.id);
					if (mediumPlayer && mediumPlayer.tag.widget.deadChat) {
						mediumPlayer.tag.widget.deadChat.sendMessage({
							type: "phaseChange",
							isNight: phase === MafiaPhase.NIGHT,
						});
					}
				}
			});
		}
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
		return job?.team === JobTeam.MAFIA || (player.jobId === JobId.WEREWOLF && this.werewolfTamed);
	}

	// 현재 살아있는 마피아 수 계산
	getMafiaCount(): number {
		if (!this.room) return 0;
		return this.room.players.filter(p => p.isAlive && this.isMafia(p)).length;
	}

	// 능력 사용 처리
	processAbility(playerId: string, targetId: string): void {
		if (!this.room) return;

		const player = this.room.getPlayer(playerId);
		if (!player || !player.isAlive) return;

		const job = getJobById(player.jobId);
		if (!job) return;

		// 마담에게 유혹당한 경우 능력 사용 불가
		if (player.seducedBy) {
			// 마담에게 유혹당한 플레이어에게 메시지 전송
			const gamePlayer = getPlayerById(player.id);
			if (gamePlayer && gamePlayer.tag.widget.nightAction) {
				gamePlayer.tag.widget.nightAction.sendMessage({
					type: "abilityBlocked",
					message: "당신은 마담에게 유혹당해 능력을 사용할 수 없습니다.",
				});
			}
			return;
		}

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

		// 플레이어에게 확인 메시지 전송
		const gamePlayer = getPlayerById(playerId);
		if (gamePlayer && gamePlayer.tag.widget.nightAction) {
			gamePlayer.tag.widget.nightAction.sendMessage({
				type: "abilityResult",
				message: "능력을 사용했습니다.",
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
			if (!gamePlayer || !gamePlayer.tag.widget || !gamePlayer.tag.widget.finalDefense) return;

			gamePlayer.tag.widget.finalDefense.sendMessage({
				type: "updateDefense",
				defense: defense,
			});
		});

		// 변론 내용을 로그로 출력
		this.sayToRoom(`최후 변론 내용: ${defense.substring(0, 100)}${defense.length > 100 ? "..." : ""}`);
	}

	/**
	 * 찬반 투표 처리
	 * @param voterId 투표한 플레이어 ID
	 * @param vote 투표 (approve 또는 reject)
	 */
	processApprovalVote(voterId: string, vote: string) {
		// 상태 확인 (승인 투표 단계가 아니면 처리하지 않음)
		if (this.currentPhase !== MafiaPhase.APPROVAL_VOTING) {
			this.sayToRoom(`현재 단계는 찬반 투표 단계가 아닙니다.`);
			return;
		}

		// 중복 투표 확인
		if (this.approvalPlayerVotes[voterId] === vote) {
			this.sayToRoom(`이미 ${vote === "approve" ? "찬성" : "반대"}에 투표했습니다.`);
			return;
		}

		// 기존 투표 취소 (있는 경우)
		if (this.approvalPlayerVotes[voterId]) {
			const previousVote = this.approvalPlayerVotes[voterId];
			if (this.approvalVoteResults[previousVote] > 0) {
				this.approvalVoteResults[previousVote]--;
			}
		}

		// 새 투표 저장
		this.approvalPlayerVotes[voterId] = vote;

		// 투표 결과 업데이트
		if (!this.approvalVoteResults[vote]) {
			this.approvalVoteResults[vote] = 1;
		} else {
			this.approvalVoteResults[vote]++;
		}

		// 모든 플레이어에게 투표 결과 업데이트
		this.updateApprovalVoteResults();

		// 모든 플레이어가 투표했는지 확인
		const alivePlayers = this.room.players.filter((p) => p.isAlive);
		const votablePlayerCount = alivePlayers.length - 1; // 피고인 제외

		if (Object.keys(this.approvalPlayerVotes).length >= votablePlayerCount) {
			// 모든 사람이 투표 완료
			// 페이즈 종료 콜백을 즉시 실행하여 타이머와 상관없이 바로 다음 단계로 진행
			if (this.phaseEndCallback) {
				const callback = this.phaseEndCallback;
				this.phaseEndCallback = null;
				callback();
			}
		}
	}

	/**
	 * 모든 플레이어에게 찬반 투표 결과 업데이트
	 */
	updateApprovalVoteResults() {
		if (!this.room) return;

		this.room.actionToRoomPlayers((player) => {
			const gamePlayer: GamePlayer = getPlayerById(player.id);
			// 이미 투표한 플레이어에게만 결과를 볼 수 있게 함
			if (!gamePlayer || !gamePlayer.tag.widget.approvalVote) return;

			// 투표한 플레이어만 결과를 볼 수 있게 함
			if (this.approvalPlayerVotes[player.id]) {
				gamePlayer.tag.widget.approvalVote.sendMessage({
					type: "showResults",
					results: this.approvalVoteResults,
				});
			}
		});
	}

	/**
	 * 연인 채팅 초기화
	 */
	private initLoverChat(player: GamePlayer) {
		if (!player.tag.widget || !player.tag.widget.nightAction) return;

		// 채팅 UI 초기화 메시지 전송
		player.tag.widget.nightAction.sendMessage({
			type: "initChat",
			chatTarget: "lover",
		});

		// 이미 저장된 채팅 메시지 전송
		this.chatMessages
			.filter((msg) => msg.target === "lover")
			.forEach((msg) => {
				player.tag.widget.nightAction.sendMessage({
					type: "chatMessage",
					chatTarget: "lover",
					sender: msg.senderName,
					message: msg.message,
				});
			});
	}

	/**
	 * 영매 채팅 초기화
	 */
	private initMediumChat(player: GamePlayer) {
		// 이미 저장된 채팅 메시지 전송
		this.chatMessages
			.filter((msg) => msg.target === "dead")
			.forEach((msg) => {
				if (player.tag.widget.nightAction) {
					player.tag.widget.nightAction.sendMessage({
						type: "chatMessage",
						chatTarget: "dead",
						sender: msg.senderName,
						message: msg.message,
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
			target: "lover",
			sender: sender.id,
			senderName: sender.name,
			message: message,
		});

		// 다른 연인들에게 메시지 전송
		this.loverPlayers.forEach((loverId) => {
			if (loverId === sender.id) return; // 자신에게는 전송하지 않음

			// 플레이어 정보 얻기
			const player = this.room?.players.find((p) => p.id === loverId);
			// 살아있는 플레이어만 메시지 수신
			if (!player || !player.isAlive) return;

			const loverPlayer = getPlayerById(loverId) as GamePlayer;
			if (loverPlayer && loverPlayer.tag.widget.nightAction) {
				loverPlayer.tag.widget.nightAction.sendMessage({
					type: "chatMessage",
					chatTarget: "lover",
					sender: sender.name,
					message: message,
				});
			}
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

			// 각 플레이어의 게임 상태 위젯 업데이트
			this.updateGameStatusWidget(gamePlayer, player);
		});
	}

	/**
	 * 밤 단계에서 마피아가 희생 대상을 선택합니다.
	 * @param targetPlayerId 선택한 대상 플레이어의 ID
	 */
	mafiaAction(mafiaId: string, targetPlayerId: string): void {
		if (this.currentPhase !== MafiaPhase.NIGHT) {
			return;
		}
		this.nightActions.push({
			playerId: mafiaId,
			targetId: targetPlayerId,
			jobId: JobId.MAFIA,
		});

		// 마피아 플레이어에게 확인 메시지 전송
		const gamePlayer = getPlayerById(mafiaId);
		if (gamePlayer && gamePlayer.tag.widget.nightAction) {
			gamePlayer.tag.widget.nightAction.sendMessage({
				type: "abilityResult",
				message: "살해 대상이 선택되었습니다.",
			});
		}
	}

	/**
	 * 밤 단계에서 의사가 보호할 대상을 선택합니다.
	 * @param targetPlayerId 선택한 보호 대상 플레이어의 ID
	 */
	doctorAction(doctorId: string, targetPlayerId: string): void {
		if (this.currentPhase !== MafiaPhase.NIGHT) {
			return;
		}
		this.nightActions.push({
			playerId: doctorId,
			targetId: targetPlayerId,
			jobId: JobId.DOCTOR,
		});

		// 의사 플레이어에게 확인 메시지 전송
		const gamePlayer = getPlayerById(doctorId);
		if (gamePlayer && gamePlayer.tag.widget.nightAction) {
			gamePlayer.tag.widget.nightAction.sendMessage({
				type: "abilityResult",
				message: "치료 대상이 선택되었습니다.",
			});
		}
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
			playerId: policePlayer.id,
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
		if (!this.room) return;
		
		// 밤 액션 처리 로직
		const killedPlayers: string[] = [];
		const protectedPlayers: string[] = [];
		const blockedPlayers: string[] = [];
		const werewolfTargets: { werewolfId: string; targetId: string }[] = [];

		// 1. 보호 액션 먼저 처리
		this.nightActions.forEach((action) => {
			const job = getJobById(action.jobId);
			if (!job) return;

			// 의사 등의 보호 능력
			if (job.abilityType === JobAbilityType.PROTECT) {
				protectedPlayers.push(action.targetId);
			}
		});

		// 2. 방해 액션 처리
		this.nightActions.forEach((action) => {
			const job = getJobById(action.jobId);
			if (!job) return;

			// 건달의 투표 방해 능력
			if (job.abilityType === JobAbilityType.BLOCK) {
				blockedPlayers.push(action.targetId);
				this.blockedVoters.push(action.targetId); // 다음날 투표시 사용
			}
		});

		// 3. 살해 액션 처리
		this.nightActions.forEach((action) => {
			const job = getJobById(action.jobId);
			if (!job) return;

			// 마피아 등의 살해 능력
			if (job.abilityType === JobAbilityType.KILL || 
				(action.jobId === JobId.WEREWOLF && this.werewolfTamed)) {
				const target = this.room.players.find((p) => p.id === action.targetId);
				if (!target || !target.isAlive) return;

				// 짐승인간은 마피아의 공격으로부터 죽지 않음
				if (target.jobId === JobId.WEREWOLF && action.jobId === JobId.MAFIA) {
					// 짐승인간이 마피아의 처형 대상으로 지목되었을 때 길들여짐
					if (!this.werewolfTamed) {
						this.werewolfTamed = true;
						if (!this.mafiaChatPlayers.includes(target.id)) {
							this.mafiaChatPlayers.push(target.id);
						}
						this.showRoomLabel(`짐승인간이 마피아에게 길들여졌습니다!`);
						
						// 짐승인간에게 길들여짐 알림 전송
						const werewolfGamePlayer = getPlayerById(target.id);
						if (werewolfGamePlayer && werewolfGamePlayer.tag.widget.nightAction) {
							werewolfGamePlayer.tag.widget.nightAction.sendMessage({
								type: "werewolfTamed",
								message: "마피아에게 길들여졌습니다! 이제 밤에 플레이어를 제거할 수 있습니다.",
							});
						}
					}
					return; // 짐승인간은 죽지 않음
				}

				// 군인의 방탄복 확인
				if (target.jobId === JobId.SOLDIER && !this.soldierArmor[target.id]) {
					this.soldierArmor[target.id] = true; // 방탄복 사용됨
					this.showRoomLabel(`${target.name}님이 방탄복으로 공격을 막았습니다!`);
					
					// 군인에게 방탄복 사용 알림 전송
					const soldierGamePlayer = getPlayerById(target.id);
					if (soldierGamePlayer && soldierGamePlayer.tag.widget.gameStatus) {
						soldierGamePlayer.tag.widget.gameStatus.sendMessage({
							type: "armorUsed"
						});
					}
					
					return;
				}

				// 보호되지 않았고, 면역이 없으면 사망
				if (!protectedPlayers.includes(action.targetId) && !target.isImmune) {
					killedPlayers.push(action.targetId);
				} else if (target.isImmune) {
					// 면역이 있으면 면역 소모
					target.isImmune = false;
				}
			}

			// 짐승인간의 갈망 처리 (아직 길들여지지 않은 경우에만)
			if (action.jobId === JobId.WEREWOLF && !this.werewolfTamed) {
				werewolfTargets.push({ werewolfId: action.playerId, targetId: action.targetId });
				this.werewolfTargetSelection = action.targetId;
			}
		});

		// 4. 짐승인간 갈망 처리 (마피아에게 죽은 대상을 선택했는지 확인)
		werewolfTargets.forEach(({ werewolfId, targetId }) => {
			if (killedPlayers.includes(targetId)) {
				// 선택한 플레이어가 마피아에게 죽었으므로 마피아팀으로 전환
				const werewolf = this.room.players.find(p => p.id === werewolfId);
				if (werewolf) {
					this.werewolfTamed = true;
					if (!this.mafiaChatPlayers.includes(werewolfId)) {
						this.mafiaChatPlayers.push(werewolfId);
					}
					this.showRoomLabel(`짐승인간이 마피아에게 길들여졌습니다!`);
					
					// 짐승인간에게 길들여짐 알림 전송
					const werewolfGamePlayer = getPlayerById(werewolfId);
					if (werewolfGamePlayer && werewolfGamePlayer.tag.widget.nightAction) {
						werewolfGamePlayer.tag.widget.nightAction.sendMessage({
							type: "werewolfTamed",
							message: "선택한 플레이어가 마피아에게 살해당했습니다! 마피아에게 길들여졌습니다.",
						});
					}
				}
			}
		});

		// 5. 도굴꾼 능력 처리 (첫날 밤에만)
		if (this.dayCount === 1 && killedPlayers.length > 0) {
			const gravediggers = this.room.players.filter(p => p.jobId === JobId.GRAVEDIGGER && p.isAlive);
			if (gravediggers.length > 0 && killedPlayers.length > 0) {
				const deadPlayer = this.room.players.find(p => p.id === killedPlayers[0]);
				if (deadPlayer) {
					this.gravediggerJob = deadPlayer.jobId;
					gravediggers.forEach(gravedigger => {
						gravedigger.jobId = deadPlayer.jobId; // 직업 복사
						const gamePlayer = getPlayerById(gravedigger.id);
						if (gamePlayer && gamePlayer.tag.widget.main) {
							gamePlayer.tag.widget.main.sendMessage({
								type: "job_changed",
								newJob: getJobById(deadPlayer.jobId)?.name || "알 수 없음",
							});
						}
					});
				}
			}
		}

		// 6. 투표 방해 상태 적용
		blockedPlayers.forEach((playerId) => {
			const player = this.room.players.find((p) => p.id === playerId);
			if (player) {
				player.isBlocked = true;
			}
		});

		// 7. 각 플레이어의 유혹 상태 초기화 (다음 날을 위해)
		this.room.players.forEach((player) => {
			if (player.seducedBy) {
				player.seducedBy = undefined;
			}
		});

		// 8. 사망 처리
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
	 * 투표 종료 및 결과 처리
	 */
	finalizeVoting() {
		if (!this.room) return;

		// 디버깅: 최종 투표 결과 로그
		// console.log("Final vote results:", this.voteResults);
		// console.log("Player votes:", this.playerVotes);
		
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

		// 투표 결과가 아예 없거나 동률인 경우 처형하지 않음
		if (tiedPlayers.length > 1 || maxVotes === 0 || Object.keys(this.voteResults).length === 0) {
			const reason = tiedPlayers.length > 1 ? "동률로" : 
						  Object.keys(this.voteResults).length === 0 ? "투표가 없어" : 
						  "유효표가 없어";
			this.sayToRoom(`투표 결과 ${reason} 처형이 진행되지 않습니다. (투표수: ${Object.keys(this.voteResults).length}, 최대표: ${maxVotes})`);

			// 투표 위젯 숨기기
			this.room.actionToRoomPlayers((player) => {
				const gamePlayer = getPlayerById(player.id);
				if (gamePlayer) {
					const widgetManager = WidgetManager.instance;
					widgetManager.hideWidget(gamePlayer, WidgetType.VOTE);
				}
			});

			// 다음 단계(밤)로 이동 - 페이즈 종료 시 콜백 설정 (3초 후 실행)
			this.phaseTimer = 3;
			this.phaseEndCallback = () => {
				// 이전 단계의 위젯 정리
				this.cleanupPhaseWidgets();

				// NIGHT 단계로 직접 설정
				this.setPhase(MafiaPhase.NIGHT);
				this.sayToRoom(`단계 전환 -> ${this.currentPhase} (Day ${this.dayCount})`);

				// 모든 플레이어의 게임 상태 위젯 업데이트
				this.updateAllGameStatusWidgets();

				// 단계별 액션 실행
				this.executePhaseActions();
			};

			return null;
		}

		// 투표 위젯 숨기기
		this.room.actionToRoomPlayers((player) => {
			const gamePlayer = getPlayerById(player.id);
			if (gamePlayer) {
				const widgetManager = WidgetManager.instance;
				widgetManager.hideWidget(gamePlayer, WidgetType.VOTE);
			}
		});

		// 최후 변론으로 넘어감 - 페이즈 종료 시 콜백 설정 (3초 후 실행)
		this.phaseTimer = 3;
		this.phaseEndCallback = () => this.nextPhase();

		return executedPlayerId;
	}

	/**
	 * 죽은 플레이어 메시지 브로드캐스트 (상시)
	 */
	private broadcastPermanentDeadMessage(sender: GamePlayer, message: string) {
		// 메시지 저장
		this.chatMessages.push({
			target: "dead",
			sender: sender.id,
			senderName: sender.name,
			message: message,
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
						message: message,
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
						message: message,
					});
				}
			}
		});
	}

	/**
	 * 낮 채팅 메시지 처리
	 * @param player 메시지를 보낸 플레이어
	 * @param message 메시지 내용
	 */
	private processDayChatMessage(player: GamePlayer, message: string): void {
		if (!this.room) return;
		if (this.currentPhase !== MafiaPhase.DAY) return;

		const mafiaPlayer = this.room?.players.find((p) => p.id === player.id);
		if (!mafiaPlayer || !mafiaPlayer.isAlive) return;

		const currentTime = Date.now(); // 현재 시간(초 단위)
		const lastMessageTime = this.dayChatCooldowns[player.id] || 0;

		// 쿨다운 체크
		const cooldownTime = this.CHAT_COOLDOWN * 1000;
		if (lastMessageTime !== 0 && currentTime - lastMessageTime < cooldownTime) {
			// 쿨다운 중이면 플레이어에게 알림
			if (player.tag.widget && player.tag.widget.dayChat) {
				player.tag.widget.dayChat.sendMessage({
					type: "cooldown",
					remainingTime: Math.ceil((cooldownTime - (currentTime - lastMessageTime)) / 1000),
				});
			}
			return;
		}

		// 메시지 필터링 (선택적)
		const filteredMessage = this.filterChatMessage(message);

		// 쿨다운 설정
		this.dayChatCooldowns[player.id] = currentTime;

		// 메시지 저장
		const chatMessage = {
			sender: player.id,
			senderName: player.name,
			message: filteredMessage,
			timestamp: Date.now(),
		};

		this.dayChatMessages.push(chatMessage);

		// 모든 살아있는 플레이어에게 메시지 전송
		this.broadcastDayChatMessage(chatMessage);
	}

	/**
	 * 채팅 메시지 필터링 (필요시 확장)
	 */
	private filterChatMessage(message: string): string {
		// 기본적으로 메시지 길이 제한만 적용
		return message.substring(0, 200);
	}

	/**
	 * 모든 살아있는 플레이어에게 낮 채팅 메시지 브로드캐스트
	 */
	private broadcastDayChatMessage(chatMessage: { sender: string; senderName: string; message: string; timestamp: number }): void {
		if (!this.room) return;

		this.room.actionToRoomPlayers((player) => {
			if (!player.isAlive) return;

			const gamePlayer = getPlayerById(player.id);
			if (!gamePlayer) return;

			// 위젯 존재 여부 확인
			if (!gamePlayer.tag.widget || !gamePlayer.tag.widget.dayChat) return;

			gamePlayer.tag.widget.dayChat.sendMessage({
				type: "newMessage",
				senderId: chatMessage.sender,
				senderName: chatMessage.senderName,
				message: chatMessage.message,
				timestamp: chatMessage.timestamp,
				isMine: player.id === chatMessage.sender,
			});
		});
	}

	/**
	 * 특정 플레이어에게 이전 채팅 메시지 기록을 전송
	 */
	public sendDayChatHistory(player: GamePlayer): void {
		if (!player.tag.widget || !player.tag.widget.dayChat) return;

		player.tag.widget.dayChat.sendMessage({
			type: "chatHistory",
			messages: this.dayChatMessages,
		});
	}

	/**
	 * 모든 플레이어의 채팅 쿨다운 상태 업데이트
	 * (게임 루프에서 호출)
	 */
	public updateChatCooldowns(): void {
		const currentTime = Date.now() / 1000;

		// 모든 플레이어의 쿨다운 상태 업데이트
		for (const playerId in this.dayChatCooldowns) {
			const cooldownTime = this.dayChatCooldowns[playerId];

			// 쿨다운이 끝났으면 제거
			if (currentTime - cooldownTime >= this.CHAT_COOLDOWN) {
				delete this.dayChatCooldowns[playerId];

				// 플레이어에게 쿨다운 종료 알림
				const gamePlayer = this.room.getGamePlayer(playerId);
				if (gamePlayer && gamePlayer.tag.widget && gamePlayer.tag.widget.dayChat) {
					gamePlayer.tag.widget.dayChat.sendMessage({
						type: "cooldownEnd",
					});
				}
			}
		}
	}

	/**
	 * 밤 단계에서 스파이가 조사할 대상을 선택합니다.
	 * @param targetPlayerId 조사할 플레이어의 ID
	 * @param spyPlayer 스파이 플레이어
	 */
	spyAction(targetPlayerId: string, spyPlayer: GamePlayer): void {
		if (this.currentPhase !== MafiaPhase.NIGHT) {
			return;
		}

		// 스파이 플레이어 찾기
		const spy = this.room.players.find((p) => p.id === spyPlayer.id);
		if (!spy) return;

		// 능력 사용 횟수 체크 (기본 1회, 마피아를 찾으면 추가 1회)
		if (spy.abilityUses !== undefined && spy.abilityUses <= 0) {
			// console.log("스파이 능력 사용 횟수 초과");
			return;
		}

		// 능력 사용 기록
		this.nightActions.push({
			playerId: spyPlayer.id,
			targetId: targetPlayerId,
			jobId: JobId.SPY,
		});

		// 대상 플레이어 찾기
		const targetPlayer = this.room.players.find((p) => p.id === targetPlayerId);
		if (!targetPlayer) return;

		// 직업 조사 결과
		const targetJob = getJobById(targetPlayer.jobId);
		if (!targetJob) return;

		// 능력 사용 횟수 차감
		if (spy.abilityUses === undefined || spy.abilityUses > 0) {
			spy.abilityUses = (spy.abilityUses || 1) - 1;
		}

		// 마피아와 접선한 경우, 능력 회복 및 마피아 채팅 활성화
		if (targetPlayer.jobId === JobId.MAFIA) {
			// 능력 사용 횟수 1회 추가 (다시 사용 가능)
			spy.abilityUses = (spy.abilityUses || 0) + 1;

			// 마피아 채팅 플레이어 목록에 추가 (중복 방지)
			if (!this.mafiaChatPlayers.includes(spy.id)) {
				this.mafiaChatPlayers.push(spy.id);
			}

			// 마피아 플레이어도 목록에 추가 (중복 방지)
			if (!this.mafiaChatPlayers.includes(targetPlayer.id)) {
				this.mafiaChatPlayers.push(targetPlayer.id);
			}

			// 마피아 채팅 즉시 활성화 (마피아 채팅 플레이어가 2명 이상일 때만)
			if (this.mafiaChatPlayers.length >= 2) {
				// 스파이에게 즉시 마피아 채팅 초기화
				if (!this.mafiaChatWidgetShown[spy.id]) {
					this.initMafiaChat(spyPlayer);
					this.mafiaChatWidgetShown[spy.id] = true;
				}
				
				// 다른 마피아 팀원들에게도 활성화
				ScriptApp.runLater(() => {
					this.activateMafiaChat();
				}, 100);
			}
		}

		// 스파이 플레이어에게 결과 전송
		if (spyPlayer.tag.widget.nightAction) {
			spyPlayer.tag.widget.nightAction.sendMessage({
				type: "spyResult",
				targetName: targetPlayer.name,
				targetJob: targetJob.name,
				isMafia: targetJob.team === JobTeam.MAFIA,
				canUseAgain: targetPlayer.jobId === JobId.MAFIA,
				enableMafiaChat: targetPlayer.jobId === JobId.MAFIA,
			});
		}
	}

	/**
	 * 마피아 채팅 활성화 - 마피아 플레이어와 스파이 간 채팅을 활성화
	 */
	private activateMafiaChat(): void {
		if (!this.room) return;

		// 마피아 채팅 참여 인원이 2명 이상인지 확인
		if (this.mafiaChatPlayers.length < 2) return;

		// 마피아 채팅에 참여할 수 있는 모든 플레이어에게 채팅 위젯 표시
		this.mafiaChatPlayers.forEach((playerId) => {
			const player = this.room.getPlayer(playerId);
			if (player && player.isAlive) {
				const gamePlayer = getPlayerById(playerId);
				if (gamePlayer && !this.mafiaChatWidgetShown[playerId]) {
					// 마피아 채팅 초기화
					this.initMafiaChat(gamePlayer);
					this.mafiaChatWidgetShown[playerId] = true;

					// 시스템 메시지 전송 (스파이인 경우와 마피아인 경우 메시지 다르게)
					const isSpy = player.jobId === JobId.SPY;
					const isMadam = player.jobId === JobId.MADAM;
					let systemMessage = "";

					if (isSpy) {
						systemMessage = "마피아와 접선에 성공했습니다! 마피아와 대화할 수 있습니다.";
					} else if (isMadam) {
						systemMessage = "마피아를 유혹했습니다! 마피아와 대화할 수 있습니다.";
					} else {
						systemMessage = "마피아팀 채팅이 활성화되었습니다.";
					}

					// 채팅 메시지 추가 (시스템 메시지)
					this.chatMessages.push({
						target: "mafia",
						sender: "system",
						senderName: "시스템",
						message: systemMessage,
					});

					// 마피아 채팅 메시지 전송
					if (gamePlayer.tag.widget.nightAction) {
						gamePlayer.tag.widget.nightAction.sendMessage({
							type: "chatMessage",
							chatTarget: "mafia",
							sender: "시스템",
							message: systemMessage,
						});
					}
				}
			}
		});
	}

	/**
	 * 마피아 채팅 초기화
	 */
	private initMafiaChat(player: GamePlayer) {
		if (!player.tag.widget || !player.tag.widget.nightAction) {
			// console.log("마피아 채팅 초기화 실패 - 위젯이 없음:", player.name);
			return;
		}

		// console.log("마피아 채팅 초기화:", player.name);

		// 채팅 UI 초기화 메시지 전송
		player.tag.widget.nightAction.sendMessage({
			type: "initChat",
			chatTarget: "mafia",
		});

		// 이미 저장된 채팅 메시지 전송
		this.chatMessages
			.filter((msg) => msg.target === "mafia")
			.forEach((msg) => {
				player.tag.widget.nightAction.sendMessage({
					type: "chatMessage",
					chatTarget: "mafia",
					sender: msg.senderName,
					message: msg.message,
				});
			});
	}

	/**
	 * 마피아 메시지 브로드캐스트
	 */
	private broadcastMafiaMessage(sender: GamePlayer, message: string) {
		// 메시지 저장
		this.chatMessages.push({
			target: "mafia",
			sender: sender.id,
			senderName: sender.name,
			message: message,
		});

		// 마피아 채팅 가능한 플레이어들에게 메시지 전송
		this.mafiaChatPlayers.forEach((mafiaId) => {
			if (mafiaId === sender.id) return; // 자신에게는 전송하지 않음

			// 플레이어 정보 얻기
			const player = this.room?.players.find((p) => p.id === mafiaId);
			// 살아있는 플레이어만 메시지 수신
			if (!player || !player.isAlive) return;

			const mafiaPlayer = getPlayerById(mafiaId) as GamePlayer;
			if (mafiaPlayer && mafiaPlayer.tag.widget.nightAction) {
				mafiaPlayer.tag.widget.nightAction.sendMessage({
					type: "chatMessage",
					chatTarget: "mafia",
					sender: sender.name,
					message: message,
				});
			}
		});
	}

	/**
	 * 밤 단계에서 건달이 플레이어의 투표를 방해합니다.
	 * @param targetPlayerId 대상 플레이어의 ID
	 * @param gangsterPlayer 건달 플레이어
	 */
	gangsterAction(targetPlayerId: string, gangsterPlayer: GamePlayer): void {
		if (this.currentPhase !== MafiaPhase.NIGHT) {
			return;
		}

		// 능력 사용 기록
		this.nightActions.push({
			playerId: gangsterPlayer.id,
			targetId: targetPlayerId,
			jobId: JobId.GANGSTER,
		});

		// 결과는 다음날 투표시 적용됨
		if (gangsterPlayer.tag.widget.nightAction) {
			gangsterPlayer.tag.widget.nightAction.sendMessage({
				type: "abilityResult",
				message: "다음날 투표시 대상 플레이어가 투표할 수 없게 됩니다.",
			});
		}
	}

	/**
	 * 밤 단계에서 사립탐정이 플레이어의 능력 사용을 추적합니다.
	 * @param targetPlayerId 추적할 플레이어의 ID
	 * @param detectivePlayer 사립탐정 플레이어
	 */
	detectiveAction(targetPlayerId: string, detectivePlayer: GamePlayer): void {
		if (this.currentPhase !== MafiaPhase.NIGHT) {
			return;
		}

		// 능력 사용 기록
		this.nightActions.push({
			playerId: detectivePlayer.id,
			targetId: targetPlayerId,
			jobId: JobId.DETECTIVE,
		});

		// 대상이 이번 밤에 사용한 능력 확인
		const targetActions = this.nightActions.filter(action => action.playerId === targetPlayerId);
		
		if (detectivePlayer.tag.widget.nightAction) {
			if (targetActions.length > 0) {
				const targetAction = targetActions[0];
				const targetPlayer = this.room?.players.find(p => p.id === targetAction.targetId);
				detectivePlayer.tag.widget.nightAction.sendMessage({
					type: "trackResult",
					message: `대상이 ${targetPlayer?.name || '누군가'}에게 능력을 사용했습니다.`,
				});
			} else {
				detectivePlayer.tag.widget.nightAction.sendMessage({
					type: "trackResult",
					message: "대상이 아무런 능력도 사용하지 않았습니다.",
				});
			}
		}
	}

	/**
	 * 밤 단계에서 기자가 플레이어의 직업을 조사합니다.
	 * @param targetPlayerId 조사할 플레이어의 ID
	 * @param journalistPlayer 기자 플레이어
	 */
	journalistAction(targetPlayerId: string, journalistPlayer: GamePlayer): void {
		if (this.currentPhase !== MafiaPhase.NIGHT) {
			return;
		}

		// 능력 사용 기록
		this.nightActions.push({
			playerId: journalistPlayer.id,
			targetId: targetPlayerId,
			jobId: JobId.JOURNALIST,
		});

		// 대상 플레이어 찾기
		const targetPlayer = this.room?.players.find(p => p.id === targetPlayerId);
		if (!targetPlayer) return;

		// 다음날 아침 공개할 정보 저장
		this.journalistReport = {
			targetName: targetPlayer.name,
			targetJob: getJobById(targetPlayer.jobId)?.name || "알 수 없음",
		};

		// 기자에게 결과 전송
		if (journalistPlayer.tag.widget.nightAction) {
			journalistPlayer.tag.widget.nightAction.sendMessage({
				type: "investigateResult",
				targetName: targetPlayer.name,
				targetJob: this.journalistReport.targetJob,
				message: "다음날 아침에 모든 플레이어에게 공개됩니다.",
			});
		}
	}

	/**
	 * 밤 단계에서 짐승인간이 플레이어를 선택합니다.
	 * @param targetPlayerId 선택한 플레이어의 ID
	 * @param werewolfPlayer 짐승인간 플레이어
	 */
	werewolfAction(targetPlayerId: string, werewolfPlayer: GamePlayer): void {
		if (this.currentPhase !== MafiaPhase.NIGHT) {
			return;
		}

		// 능력 사용 기록
		this.nightActions.push({
			playerId: werewolfPlayer.id,
			targetId: targetPlayerId,
			jobId: JobId.WEREWOLF,
		});

		if (this.werewolfTamed) {
			// 길들여진 후: 선택한 플레이어 제거
			if (werewolfPlayer.tag.widget.nightAction) {
				werewolfPlayer.tag.widget.nightAction.sendMessage({
					type: "abilityResult",
					message: "선택한 플레이어를 제거합니다.",
				});
			}
		} else {
			// 길들여지지 않은 상태: 갈망 상태
			if (werewolfPlayer.tag.widget.nightAction) {
				werewolfPlayer.tag.widget.nightAction.sendMessage({
					type: "abilityResult",
					message: "선택한 플레이어가 마피아에게 살해당하면 마피아에게 길들여집니다.",
				});
			}
		}
	}

	/**
	 * 밤 단계에서 테러리스트가 자폭 대상을 선택합니다.
	 * @param targetPlayerId 함께 죽을 플레이어의 ID
	 * @param terroristPlayer 테러리스트 플레이어
	 */
	terroristAction(targetPlayerId: string, terroristPlayer: GamePlayer): void {
		if (this.currentPhase !== MafiaPhase.NIGHT) {
			return;
		}

		// 자폭 대상 저장
		this.terroristTarget = targetPlayerId;

		// 대상 플레이어 정보 가져오기
		const targetPlayer = this.room?.players.find(p => p.id === targetPlayerId);
		
		// 테러리스트에게 확인 메시지 전송
		if (terroristPlayer.tag.widget.nightAction) {
			terroristPlayer.tag.widget.nightAction.sendMessage({
				type: "abilityResult",
				message: `${targetPlayer?.name || '선택한 플레이어'}를 자폭 대상으로 지정했습니다. 처형될 때 함께 죽게 됩니다.`,
			});
		}
	}

	/**
	 * 밤 단계에서 마담이 플레이어를 유혹합니다.
	 * @param madamId 마담 플레이어의 ID
	 * @param targetPlayerId 대상 플레이어의 ID
	 * @param madamPlayer 마담 플레이어
	 */
	madamAction(madamId: string, targetPlayerId: string, madamPlayer: GamePlayer): void {
		if (this.currentPhase !== MafiaPhase.NIGHT) {
			return;
		}

		// 대상 플레이어 찾기
		const targetPlayer = this.room.players.find((p) => p.id === targetPlayerId);
		if (!targetPlayer) return;

		// 유혹 능력 사용 기록
		this.nightActions.push({
			playerId: madamId,
			targetId: targetPlayerId,
			jobId: JobId.MADAM,
		});

		// 마피아 유혹 시 마피아 채팅 활성화
		if (targetPlayer.jobId === JobId.MAFIA) {
			// 마담 플레이어 찾기
			const madam = this.room.players.find((p) => p.id === madamId);
			if (madam) {
				// 마피아 채팅 플레이어 목록에 추가 (중복 방지)
				if (!this.mafiaChatPlayers.includes(madam.id)) {
					this.mafiaChatPlayers.push(madam.id);
				}

				// 마피아 플레이어도 목록에 추가 (중복 방지)
				if (!this.mafiaChatPlayers.includes(targetPlayer.id)) {
					this.mafiaChatPlayers.push(targetPlayer.id);
				}

				// 마피아 채팅 활성화 (마피아 채팅 플레이어가 2명 이상일 때만)
				if (this.mafiaChatPlayers.length >= 2) {
					this.activateMafiaChat();
				}
			}
		}

		// 마담 플레이어에게 결과 전송 (nightAction 위젯으로)
		if (madamPlayer.tag.widget.nightAction) {
			madamPlayer.tag.widget.nightAction.sendMessage({
				type: "seduceResult",
				targetName: targetPlayer.name,
				targetJob: getJobById(targetPlayer.jobId)?.name || "알 수 없음",
				isMafia: targetPlayer.jobId === JobId.MAFIA,
				enableMafiaChat: targetPlayer.jobId === JobId.MAFIA,
			});
		}
	}

	/**
	 * 플레이어가 게임 중 퇴장했을 때 처리
	 * @param playerId 퇴장한 플레이어 ID
	 */
	public handlePlayerLeave(playerId: string): void {
		if (this.state !== GameState.IN_PROGRESS || !this.room) {
			return;
		}

		// 퇴장한 플레이어 찾기
		const leavingPlayer = this.room.players.find(p => p.id === playerId);
		if (!leavingPlayer) {
			return;
		}

		// 살아있는 플레이어인 경우에만 처리
		if (leavingPlayer.isAlive) {
			// 플레이어를 죽은 것으로 처리
			leavingPlayer.isAlive = false;
			
			// 게임에 공지
			this.sayToRoom(`${leavingPlayer.name}님이 게임을 떠나 사망 처리되었습니다.`);
			this.showRoomLabel(`⚠️ ${leavingPlayer.name}님이 게임을 떠났습니다!`, 3000);

			// 게임 플레이어 객체 찾기
			const gamePlayer = getPlayerById(playerId);
			if (gamePlayer) {
				// 모든 위젯 숨기기
				const widgetManager = WidgetManager.instance;
				widgetManager.hideAllWidgets(gamePlayer);
			}

			// 현재 단계별 특수 처리
			switch (this.currentPhase) {
				case MafiaPhase.VOTING:
					// 투표 중인 경우, 해당 플레이어의 투표 제거
					if (this.playerVotes[playerId]) {
						const targetId = this.playerVotes[playerId];
						if (this.voteResults[targetId] > 0) {
							this.voteResults[targetId]--;
						}
						delete this.playerVotes[playerId];
						this.updateVoteResults();
					}
					break;
				
				case MafiaPhase.APPROVAL_VOTING:
					// 찬반 투표 중인 경우, 해당 플레이어의 투표 제거
					if (this.approvalPlayerVotes[playerId]) {
						const vote = this.approvalPlayerVotes[playerId];
						if (this.approvalVoteResults[vote] > 0) {
							this.approvalVoteResults[vote]--;
						}
						delete this.approvalPlayerVotes[playerId];
						this.updateApprovalVoteResults();
					}
					break;
					
				case MafiaPhase.NIGHT:
					// 밤 액션 제거
					this.nightActions = this.nightActions.filter(action => action.playerId !== playerId);
					break;
			}

			// 마피아 채팅 참여자 목록에서 제거
			const mafiaIndex = this.mafiaChatPlayers.indexOf(playerId);
			if (mafiaIndex !== -1) {
				this.mafiaChatPlayers.splice(mafiaIndex, 1);
			}

			// 연인 목록에서 제거
			const loverIndex = this.loverPlayers.indexOf(playerId);
			if (loverIndex !== -1) {
				this.loverPlayers.splice(loverIndex, 1);
			}

			// 투표 차단 목록에서 제거
			const blockedIndex = this.blockedVoters.indexOf(playerId);
			if (blockedIndex !== -1) {
				this.blockedVoters.splice(blockedIndex, 1);
			}

			// 즉시 승리 조건 체크
			this.checkWinCondition();

			// 모든 플레이어의 게임 상태 위젯 업데이트
			this.updateAllGameStatusWidgets();
		}
	}
}
