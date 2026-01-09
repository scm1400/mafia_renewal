/**
 * 명령어 관리자 (Singleton)
 * 모든 명령어를 등록하고 실행을 관리
 */

import type { CommandContext, ICommandHandler } from "./CommandHandler";
import { sendAdminConsoleMessage, isAdmin } from "../../../../utils/Common";
import { showLabel } from "../../../../utils/CustomLabelFunctions";

export class CommandManager {
	private static _instance: CommandManager;
	private commands: { [name: string]: ICommandHandler } = {};

	static get instance(): CommandManager {
		if (!CommandManager._instance) {
			CommandManager._instance = new CommandManager();
		}
		return CommandManager._instance;
	}

	private constructor() {
		// 명령어는 CheatCommands.ts에서 등록됨
	}

	/**
	 * 명령어 등록
	 */
	registerCommand(handler: ICommandHandler): void {
		this.commands[handler.name.toLowerCase()] = handler;
	}

	/**
	 * 명령어 실행
	 * @param commandName 명령어 이름
	 * @param args 인자 배열
	 * @param context 실행 컨텍스트
	 * @returns true면 명령어가 처리됨, false면 명령어가 없음 (일반 채팅으로 처리)
	 */
	executeCommand(commandName: string, args: string[], context: CommandContext): boolean {
		const handler = this.commands[commandName.toLowerCase()];

		if (!handler) {
			return false; // 명령어가 없으면 일반 채팅으로 처리
		}

		// 관리자 권한 확인
		if (handler.adminOnly && !isAdmin(context.player)) {
			showLabel(context.player, "관리자만 사용할 수 있는 명령어입니다.");
			return true; // 명령어는 맞지만 권한 없음
		}

		// 게임 진행 중 확인
		if (handler.requiresGameInProgress) {
			if (!context.flowManager || !context.flowManager.isGameInProgress()) {
				showLabel(context.player, "게임이 진행 중일 때만 사용할 수 있는 명령어입니다.");
				return true;
			}
		}

		// 명령어 실행
		try {
			return handler.execute(context, args);
		} catch (error) {
			sendAdminConsoleMessage(`[ERROR] 명령어 실행 중 오류: ${error}`);
			showLabel(context.player, "명령어 실행 중 오류가 발생했습니다.");
			return true;
		}
	}

	/**
	 * 등록된 모든 명령어 가져오기
	 */
	getAllCommands(): ICommandHandler[] {
		const cmdList: ICommandHandler[] = [];
		for (const key in this.commands) {
			cmdList.push(this.commands[key]);
		}
		return cmdList;
	}
}
