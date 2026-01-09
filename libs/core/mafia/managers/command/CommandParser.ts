/**
 * 명령어 파서
 * 슬래시(/)로 시작하는 명령어를 파싱하여 명령어와 인자로 분리
 */

export interface ParsedCommand {
	command: string; // 명령어 이름 (예: "skip", "speed")
	args: string[]; // 인자 배열
	rawMessage: string; // 원본 메시지
}

export class CommandParser {
	private static readonly COMMAND_PREFIX = "/";

	/**
	 * 메시지가 명령어인지 확인
	 */
	static isCommand(message: string): boolean {
		if (!message) return false;
		return message.trim().startsWith(this.COMMAND_PREFIX);
	}

	/**
	 * 명령어 파싱
	 * @returns ParsedCommand 객체 또는 null (파싱 실패 시)
	 */
	static parse(message: string): ParsedCommand | null {
		if (!this.isCommand(message)) {
			return null;
		}

		const trimmed = message.trim();

		// 슬래시 제거
		const withoutPrefix = trimmed.substring(this.COMMAND_PREFIX.length);

		if (!withoutPrefix) {
			return null; // 슬래시만 있는 경우
		}

		// 따옴표로 감싼 인자 처리를 위한 간단한 파싱
		const parts: string[] = [];
		let currentPart = "";
		let inQuotes = false;

		for (let i = 0; i < withoutPrefix.length; i++) {
			const char = withoutPrefix[i];

			if (char === '"') {
				inQuotes = !inQuotes;
			} else if (char === " " && !inQuotes) {
				if (currentPart) {
					parts.push(currentPart);
					currentPart = "";
				}
			} else {
				currentPart += char;
			}
		}

		// 마지막 part 추가
		if (currentPart) {
			parts.push(currentPart);
		}

		if (parts.length === 0) {
			return null;
		}

		// 첫 번째 부분이 명령어, 나머지는 인자
		const command = parts[0].toLowerCase();
		const args = parts.slice(1);

		return {
			command,
			args,
			rawMessage: message,
		};
	}
}
