import { GameRoom, GameRoomConfig, WaitingRoomEvent } from "./GameRoom";
import { GameMode } from "../../gameMode/GameMode";
import { GamePlayer } from "../../types/GamePlayer";
import { getJobsByGameMode } from "../../types/JobTypes";
import { getPlayerById } from "../../../../utils/Common";

/**
 * 게임방 관리자 클래스
 * 여러 게임방을 생성하고 관리합니다.
 */
export class GameRoomManager {
	private gameRooms: Record<string, GameRoom> = {};
	private gameModes: Record<string, GameMode> = {};
	private callbacks: { [key: string]: Array<(...args: any[]) => void> } = {};

	constructor() {
		// 기본 생성자
	}

	/**
	 * 모든 게임방 조회
	 */
	public getAllRooms(): GameRoom[] {
		return Object.values(this.gameRooms);
	}

	/**
	 * 특정 ID의 게임방 조회
	 */
	public getRoom(roomId: string): GameRoom | undefined {
		return this.gameRooms[roomId];
	}

	/**
	 * 게임방 생성
	 */
	public createRoom(config: Omit<GameRoomConfig, "id">): GameRoom {
		// 사용 가능한 방 번호 찾기 (1~8)
		let roomId = "1";
		for (let i = 1; i <= 8; i++) {
			const id = i.toString();
			if (!this.gameRooms[id]) {
				roomId = id;
				break;
			}
		}
		
		// 모든 방이 사용 중인 경우
		if (Object.keys(this.gameRooms).length >= 8) {
			throw new Error("모든 게임방이 사용 중입니다.");
		}
		
		// 게임방 생성
		const room = new GameRoom({
			id: roomId,
			...config
		});
		
		// 게임방 등록
		this.gameRooms[roomId] = room;
		
		// 이벤트 리스너 설정
		this.setupRoomEventListeners(room);
		
		// 방 생성 이벤트 발생
		this.emit("roomCreated", room);
		
		return room;
	}

	/**
	 * 게임방 삭제
	 */
	public removeRoom(roomId: string): boolean {
		const room = this.gameRooms[roomId];
		
		if (!room) {
			return false;
		}
		
		// 게임방 리셋
		room.reset();
		
		// 게임방 삭제
		delete this.gameRooms[roomId];
		
		// 방 삭제 이벤트 발생
		this.emit("roomRemoved", roomId);
		
		return true;
	}

	/**
	 * 게임방 초기화
	 */
	public resetRoom(roomId: string): boolean {
		const room = this.gameRooms[roomId];
		
		if (!room) {
			return false;
		}
		
		// 게임방 리셋
		room.reset();
		
		// 방 초기화 이벤트 발생
		this.emit("roomReset", room);
		
		return true;
	}

	/**
	 * 게임 모드 등록
	 */
	public registerGameMode(gameMode: GameMode): void {
		this.gameModes[gameMode.getId()] = gameMode;
	}

	/**
	 * 게임 모드 조회
	 */
	public getGameMode(modeId: string): GameMode | undefined {
		return this.gameModes[modeId];
	}

	/**
	 * 모든 게임 모드 조회
	 */
	public getAllGameModes(): GameMode[] {
		return Object.values(this.gameModes);
	}

	/**
	 * 플레이어를 게임방에 입장시킴
	 */
	public joinRoom(roomId: string, player: GamePlayer): boolean {
		const room = this.gameRooms[roomId];
		
		if (!room) {
			return false;
		}
		
		return room.joinPlayer(player);
	}

	/**
	 * 플레이어를 게임방에서 퇴장시킴
	 */
	public leaveRoom(roomId: string, playerId: string): boolean {
		const room = this.gameRooms[roomId];
		
		if (!room) {
			return false;
		}
		
		return room.leavePlayer(playerId);
	}

	/**
	 * 방 이벤트 리스너 설정
	 */
	private setupRoomEventListeners(room: GameRoom): void {
		// 플레이어 입장 이벤트
		room.on(WaitingRoomEvent.PLAYER_JOIN, (player: GamePlayer) => {
			this.emit("playerJoinedRoom", room, player);
		});
		
		// 플레이어 퇴장 이벤트
		room.on(WaitingRoomEvent.PLAYER_LEAVE, (player: GamePlayer) => {
			this.emit("playerLeftRoom", room, player);
			
			// 방에 플레이어가 없으면 방 삭제
			if (room.getPlayersCount() === 0) {
				this.removeRoom(room.getId());
			}
		});
		
		// 플레이어 강퇴 이벤트
		room.on(WaitingRoomEvent.PLAYER_KICK, (player: GamePlayer) => {
			this.emit("playerKicked", room, player);
		});
		
		// 호스트 변경 이벤트
		room.on(WaitingRoomEvent.HOST_CHANGE, (newHost: GamePlayer) => {
			this.emit("hostChanged", room, newHost);
		});
		
		// 준비 상태 변경 이벤트
		room.on(WaitingRoomEvent.READY_STATUS_CHANGE, (player: GamePlayer, isReady: boolean) => {
			this.emit("readyStatusChanged", room, player, isReady);
		});
		
		// 게임 시작 이벤트
		room.on(WaitingRoomEvent.GAME_START, () => {
			this.emit("gameStarted", room);
		});
		
		// 게임 종료 이벤트
		room.on(WaitingRoomEvent.GAME_END, () => {
			this.emit("gameEnded", room);
		});
		
		// 채팅 메시지 이벤트
		room.on(WaitingRoomEvent.CHAT_MESSAGE, (player: GamePlayer, message: string) => {
			this.emit("chatMessage", room, player, message);
		});
	}

	/**
	 * 이벤트 발생
	 */
	private emit(event: string, ...args: any[]): void {
		const callbacks = this.callbacks[event];
		if (!callbacks) return;
		
		callbacks.forEach(callback => {
			try {
				callback(...args);
			} catch (error) {
				console.error(`Error in event listener for ${event}:`, error);
			}
		});
	}

	/**
	 * 이벤트 리스너 등록
	 */
	public on(event: string, listener: (...args: any[]) => void): void {
		if (!this.callbacks[event]) {
			this.callbacks[event] = [];
		}
		this.callbacks[event].push(listener);
	}

	/**
	 * 이벤트 리스너 제거
	 */
	public off(event: string, listener: (...args: any[]) => void): void {
		const callbacks = this.callbacks[event];
		if (!callbacks) return;
		
		const index = callbacks.indexOf(listener);
		if (index !== -1) {
			callbacks.splice(index, 1);
		}
	}
}
