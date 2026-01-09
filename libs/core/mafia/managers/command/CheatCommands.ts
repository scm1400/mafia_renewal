/**
 * 치트 명령어 구현
 * 각 명령어는 ICommandHandler 인터페이스를 구현
 */

import type { CommandContext, ICommandHandler } from "./CommandHandler";
import { CommandManager } from "./CommandManager";
import { sendAdminConsoleMessage } from "../../../../utils/Common";
import { showLabel } from "../../../../utils/CustomLabelFunctions";
import { MafiaPhase } from "../gameFlow/GameFlowManager";
import { JobId, getJobById } from "../../types/JobTypes";
import { getPlayerById } from "../../../../utils/Common";
import { BotManager } from "./BotManager";

/**
 * /skip - 현재 페이즈 즉시 스킵
 */
export class SkipPhaseCommand implements ICommandHandler {
	name = "skip";
	description = "현재 페이즈를 즉시 스킵합니다";
	adminOnly = true;
	requiresGameInProgress = true;

	execute(context: CommandContext, args: string[]): boolean {
		if (!context.flowManager) return false;

		// phaseTimer를 0으로 설정하여 즉시 페이즈 종료
		context.flowManager.phaseTimer = 0;
		sendAdminConsoleMessage(`[CHEAT] ${context.player.name}가 페이즈를 스킵했습니다.`);
		showLabel(context.player, "페이즈를 스킵했습니다.");
		return true;
	}

	getUsage(): string {
		return "/skip";
	}
}

/**
 * /speed [배수] - 타이머 속도 조절
 */
export class SpeedCommand implements ICommandHandler {
	name = "speed";
	description = "타이머 속도를 배수로 조절합니다";
	adminOnly = true;
	requiresGameInProgress = true;

	execute(context: CommandContext, args: string[]): boolean {
		if (!context.flowManager) return false;

		const multiplier = parseInt(args[0]) || 1;
		if (multiplier < 1 || multiplier > 100) {
			showLabel(context.player, "속도 배수는 1-100 사이의 정수여야 합니다.");
			return false;
		}

		context.flowManager.speedMultiplier = multiplier;
		sendAdminConsoleMessage(`[CHEAT] 타이머 속도가 ${multiplier}배로 설정되었습니다.`);
		showLabel(context.player, `타이머 속도: ${multiplier}배`);
		return true;
	}

	getUsage(): string {
		return "/speed [multiplier] - 예: /speed 10 (10배 빠르게)";
	}
}

/**
 * /endgame - 게임 즉시 종료
 */
export class EndGameCommand implements ICommandHandler {
	name = "endgame";
	description = "게임을 즉시 종료합니다";
	adminOnly = true;
	requiresGameInProgress = true;

	execute(context: CommandContext, args: string[]): boolean {
		if (!context.flowManager) return false;

		context.flowManager.resetGame();
		sendAdminConsoleMessage(`[CHEAT] ${context.player.name}가 게임을 강제 종료했습니다.`);
		showLabel(context.player, "게임을 종료했습니다.");
		return true;
	}

	getUsage(): string {
		return "/endgame";
	}
}

/**
 * /gamestate - 현재 게임 상태 출력
 */
export class GameStateCommand implements ICommandHandler {
	name = "gamestate";
	description = "현재 게임 상태를 출력합니다";
	adminOnly = true;
	requiresGameInProgress = false;

	execute(context: CommandContext, args: string[]): boolean {
		if (!context.flowManager || !context.room) {
			showLabel(context.player, "게임이 진행 중이 아닙니다.");
			return false;
		}

		const state = {
			phase: context.flowManager.currentPhase,
			day: context.flowManager.dayCount,
			timer: Math.floor(context.flowManager.phaseTimer),
			alivePlayers: context.room.players.filter((p) => p.isAlive).length,
			totalPlayers: context.room.players.length,
			speed: context.flowManager.speedMultiplier,
		};

		const message = `Phase: ${state.phase} | Day: ${state.day} | Timer: ${state.timer}s | Alive: ${state.alivePlayers}/${state.totalPlayers} | Speed: ${state.speed}x`;
		showLabel(context.player, message, { labelDisplayTime: 5000 });
		sendAdminConsoleMessage(`[GAMESTATE] ${message}`);
		return true;
	}

	getUsage(): string {
		return "/gamestate";
	}
}

/**
 * /setphase [페이즈] - 특정 페이즈로 이동
 */
export class SetPhaseCommand implements ICommandHandler {
	name = "setphase";
	description = "특정 페이즈로 즉시 이동합니다";
	adminOnly = true;
	requiresGameInProgress = true;

	execute(context: CommandContext, args: string[]): boolean {
		if (!context.flowManager) return false;

		const phaseMap: { [key: string]: MafiaPhase } = {
			night: MafiaPhase.NIGHT,
			day: MafiaPhase.DAY,
			voting: MafiaPhase.VOTING,
			defense: MafiaPhase.FINAL_DEFENSE,
			approval: MafiaPhase.APPROVAL_VOTING,
		};

		const phaseName = (args[0] || "").toLowerCase();
		const targetPhase = phaseMap[phaseName];

		if (!targetPhase) {
			showLabel(context.player, `유효하지 않은 페이즈: ${args[0]}`);
			return false;
		}

		context.flowManager.setPhase(targetPhase);
		sendAdminConsoleMessage(`[CHEAT] 페이즈가 ${targetPhase}로 변경되었습니다.`);
		showLabel(context.player, `페이즈 변경: ${targetPhase}`);
		return true;
	}

	getUsage(): string {
		return "/setphase [night|day|voting|defense|approval]";
	}
}

/**
 * /kill [플레이어] - 플레이어 강제 사망
 */
export class KillPlayerCommand implements ICommandHandler {
	name = "kill";
	description = "특정 플레이어를 강제로 사망시킵니다";
	adminOnly = true;
	requiresGameInProgress = true;

	execute(context: CommandContext, args: string[]): boolean {
		if (!context.flowManager || !context.room) return false;

		const playerName = args.join(" ");
		if (!playerName) {
			showLabel(context.player, "플레이어 이름을 입력하세요.");
			return false;
		}

		const targetPlayer = context.room.players.find(
			(p) => p.name.toLowerCase() === playerName.toLowerCase()
		);

		if (!targetPlayer) {
			showLabel(context.player, `플레이어를 찾을 수 없습니다: ${playerName}`);
			return false;
		}

		if (!targetPlayer.isAlive) {
			showLabel(context.player, `${targetPlayer.name}는 이미 사망했습니다.`);
			return false;
		}

		// 플레이어 사망 처리
		targetPlayer.isAlive = false;
		context.flowManager.deadPlayers.push(targetPlayer.id);

		// 모든 플레이어에게 알림
		context.flowManager.showRoomLabel(
			`⚠️ ${targetPlayer.name}이(가) 관리자에 의해 사망했습니다.`
		);

		// 위젯 업데이트 및 승리 조건 체크
		context.flowManager.updateAllGameStatusWidgets();
		context.flowManager.checkWinCondition();

		sendAdminConsoleMessage(`[CHEAT] ${targetPlayer.name}를 강제 사망시켰습니다.`);
		showLabel(context.player, `${targetPlayer.name}를 사망시켰습니다.`);
		return true;
	}

	getUsage(): string {
		return "/kill [PlayerName] - 예: /kill Alice";
	}
}

/**
 * /revive [플레이어] - 플레이어 부활
 */
export class RevivePlayerCommand implements ICommandHandler {
	name = "revive";
	description = "사망한 플레이어를 부활시킵니다";
	adminOnly = true;
	requiresGameInProgress = true;

	execute(context: CommandContext, args: string[]): boolean {
		if (!context.flowManager || !context.room) return false;

		const playerName = args.join(" ");
		if (!playerName) {
			showLabel(context.player, "플레이어 이름을 입력하세요.");
			return false;
		}

		const targetPlayer = context.room.players.find(
			(p) => p.name.toLowerCase() === playerName.toLowerCase()
		);

		if (!targetPlayer) {
			showLabel(context.player, `플레이어를 찾을 수 없습니다: ${playerName}`);
			return false;
		}

		if (targetPlayer.isAlive) {
			showLabel(context.player, `${targetPlayer.name}는 이미 살아있습니다.`);
			return false;
		}

		// 플레이어 부활
		targetPlayer.isAlive = true;
		const deadIndex = context.flowManager.deadPlayers.indexOf(targetPlayer.id);
		if (deadIndex !== -1) {
			context.flowManager.deadPlayers.splice(deadIndex, 1);
		}

		// 모든 플레이어에게 알림
		context.flowManager.showRoomLabel(`✨ ${targetPlayer.name}이(가) 부활했습니다!`);

		// 위젯 업데이트
		context.flowManager.updateAllGameStatusWidgets();

		sendAdminConsoleMessage(`[CHEAT] ${targetPlayer.name}를 부활시켰습니다.`);
		showLabel(context.player, `${targetPlayer.name}를 부활시켰습니다.`);
		return true;
	}

	getUsage(): string {
		return "/revive [PlayerName] - 예: /revive Alice";
	}
}

/**
 * /setrole [플레이어] [직업] - 직업 강제 할당
 */
export class SetRoleCommand implements ICommandHandler {
	name = "setrole";
	description = "플레이어의 직업을 강제로 변경합니다";
	adminOnly = true;
	requiresGameInProgress = true;

	execute(context: CommandContext, args: string[]): boolean {
		if (!context.flowManager || !context.room) return false;

		if (args.length < 2) {
			showLabel(context.player, "사용법: /setrole [PlayerName] [RoleName]");
			return false;
		}

		const roleName = args[args.length - 1].toLowerCase();
		const playerName = args.slice(0, -1).join(" ");

		// 플레이어 찾기
		const targetPlayer = context.room.players.find(
			(p) => p.name.toLowerCase() === playerName.toLowerCase()
		);

		if (!targetPlayer) {
			showLabel(context.player, `플레이어를 찾을 수 없습니다: ${playerName}`);
			return false;
		}

		// 직업 매핑
		const roleMap: { [key: string]: JobId } = {
			mafia: JobId.MAFIA,
			police: JobId.POLICE,
			doctor: JobId.DOCTOR,
			citizen: JobId.CITIZEN,
			spy: JobId.SPY,
			detective: JobId.DETECTIVE,
			journalist: JobId.JOURNALIST,
			lover: JobId.LOVER,
			medium: JobId.MEDIUM,
			werewolf: JobId.WEREWOLF,
			terrorist: JobId.TERRORIST,
			madam: JobId.MADAM,
			soldier: JobId.SOLDIER,
			gangster: JobId.GANGSTER,
			gravedigger: JobId.GRAVEDIGGER,
			politician: JobId.POLITICIAN,
		};

		const jobId = roleMap[roleName];
		if (!jobId) {
			showLabel(context.player, `유효하지 않은 직업: ${roleName}`);
			return false;
		}

		// 직업 변경
		const oldJobId = targetPlayer.jobId;
		targetPlayer.jobId = jobId;

		// 해당 플레이어에게 역할 카드 다시 표시
		const gamePlayer = getPlayerById(targetPlayer.id);
		if (gamePlayer) {
			context.flowManager.showRoleCard(gamePlayer, jobId);
		}

		const oldJobName = getJobById(oldJobId)?.name || oldJobId;
		const newJobName = getJobById(jobId)?.name || jobId;
		sendAdminConsoleMessage(
			`[CHEAT] ${targetPlayer.name}의 직업이 ${oldJobName} -> ${newJobName}로 변경되었습니다.`
		);
		showLabel(context.player, `${targetPlayer.name}: ${oldJobName} -> ${newJobName}`);
		return true;
	}

	getUsage(): string {
		return "/setrole [PlayerName] [RoleName] - 예: /setrole Alice mafia";
	}
}

/**
 * /help - 명령어 목록 표시
 */
export class HelpCommand implements ICommandHandler {
	name = "help";
	description = "사용 가능한 명령어 목록을 표시합니다";
	adminOnly = true;
	requiresGameInProgress = false;

	execute(context: CommandContext, args: string[]): boolean {
		// CommandManager에서 모든 명령어 가져오기
		const commands = CommandManager.instance.getAllCommands();

		let helpText = "=== 치트 명령어 목록 ===\n";
		commands.forEach((cmd) => {
			helpText += `\n/${cmd.name} - ${cmd.description}`;
			const usage = cmd.getUsage();
			if (usage && usage !== `/${cmd.name}`) {
				helpText += `\n  사용법: ${usage}`;
			}
		});

		// 관리자 콘솔에 출력
		sendAdminConsoleMessage(helpText);
		showLabel(context.player, "명령어 목록이 관리자 콘솔에 출력되었습니다.");
		return true;
	}

	getUsage(): string {
		return "/help";
	}
}

/**
 * /autobot [player] - 특정 플레이어를 봇으로 설정/해제
 */
export class AutoBotCommand implements ICommandHandler {
	name = "autobot";
	description = "플레이어를 봇으로 설정/해제합니다";
	adminOnly = true;
	requiresGameInProgress = false;

	execute(context: CommandContext, args: string[]): boolean {
		if (args.length === 0) {
			showLabel(context.player, "사용법: /autobot [플레이어 이름]");
			return true;
		}

		const targetName = args.join(" ");
		const botManager = BotManager.instance;

		// 방에 있으면 방 플레이어에서, 아니면 전체에서 찾기
		let targetPlayer = null;

		if (context.room) {
			// 게임 방에서 찾기
			const mafiaPlayer = context.room.players.find(
				(p) => p.name.toLowerCase() === targetName.toLowerCase()
			);
			if (mafiaPlayer) {
				targetPlayer = getPlayerById(mafiaPlayer.id);
			}
		}

		if (!targetPlayer) {
			showLabel(context.player, `플레이어 "${targetName}"를 찾을 수 없습니다.`);
			return true;
		}

		// 자기 자신은 봇으로 설정 불가
		if (targetPlayer.id === context.player.id) {
			showLabel(context.player, "자기 자신을 봇으로 설정할 수 없습니다.");
			return true;
		}

		// 봇 상태 토글
		const isCurrentlyBot = botManager.isBot(targetPlayer.id);
		botManager.setBot(targetPlayer.id, !isCurrentlyBot);

		const status = !isCurrentlyBot ? "봇으로 설정" : "봇 해제";
		showLabel(context.player, `${targetPlayer.name}이(가) ${status}되었습니다.`);

		// 봇으로 설정되고 방에 있으면 자동 레디
		if (!isCurrentlyBot && context.room) {
			context.room.setPlayerReady(targetPlayer.id, true);
		}

		return true;
	}

	getUsage(): string {
		return "/autobot [플레이어 이름] - 봇 설정/해제 토글";
	}
}

/**
 * /autobotall - 자신을 제외한 모든 플레이어를 봇으로 설정
 */
export class AutoBotAllCommand implements ICommandHandler {
	name = "autobotall";
	description = "자신을 제외한 모든 플레이어를 봇으로 설정합니다";
	adminOnly = true;
	requiresGameInProgress = false;

	execute(context: CommandContext, args: string[]): boolean {
		const botManager = BotManager.instance;

		if (!context.room) {
			showLabel(context.player, "게임 방에서만 사용할 수 있습니다.");
			return true;
		}

		let botCount = 0;

		for (const mafiaPlayer of context.room.players) {
			// 자기 자신 제외
			if (mafiaPlayer.id === context.player.id) continue;

			// 이미 봇이 아닌 경우에만 설정
			if (!botManager.isBot(mafiaPlayer.id)) {
				botManager.setBot(mafiaPlayer.id, true);
				context.room.setPlayerReady(mafiaPlayer.id, true);
				botCount++;
			}
		}

		showLabel(context.player, `${botCount}명의 플레이어가 봇으로 설정되었습니다.`);
		sendAdminConsoleMessage(`[BOT] ${context.player.name}가 ${botCount}명을 봇으로 설정했습니다.`);

		return true;
	}

	getUsage(): string {
		return "/autobotall - 자신 제외 모든 플레이어를 봇으로 설정";
	}
}

/**
 * /clearbots - 모든 봇 상태 해제
 */
export class ClearBotsCommand implements ICommandHandler {
	name = "clearbots";
	description = "모든 봇 상태를 해제합니다";
	adminOnly = true;
	requiresGameInProgress = false;

	execute(context: CommandContext, args: string[]): boolean {
		const botManager = BotManager.instance;
		const botCount = botManager.getBotCount();

		botManager.clearAllBots();

		showLabel(context.player, `${botCount}명의 봇 상태가 해제되었습니다.`);

		return true;
	}

	getUsage(): string {
		return "/clearbots - 모든 봇 상태 해제";
	}
}

/**
 * 모든 치트 명령어 등록
 */
export function registerCheatCommands(): void {
	const manager = CommandManager.instance;

	// Stage 1: 게임 제어 명령어
	manager.registerCommand(new SkipPhaseCommand());
	manager.registerCommand(new SpeedCommand());
	manager.registerCommand(new EndGameCommand());
	manager.registerCommand(new GameStateCommand());
	manager.registerCommand(new SetPhaseCommand());
	manager.registerCommand(new KillPlayerCommand());
	manager.registerCommand(new RevivePlayerCommand());
	manager.registerCommand(new SetRoleCommand());
	manager.registerCommand(new HelpCommand());

	// Stage 2: 봇 명령어
	manager.registerCommand(new AutoBotCommand());
	manager.registerCommand(new AutoBotAllCommand());
	manager.registerCommand(new ClearBotsCommand());
}
