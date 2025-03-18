import { LocationInfo } from "zep-script";
import { GameFlowManager, MafiaPlayer } from "../gameFlow/GameFlowManager";
import { GamePlayer } from "../../types/GamePlayer";
import { getPlayerById } from "../../../../utils/Common";
import { Job, GameMode as GameModeInterface, JobId } from "../../types/JobTypes";
import { GameMode } from "../../gameMode/GameMode";

// GameRoomState 열거형
export enum GameRoomState {
	/** 대기 중 */
	WAITING = "waiting",
	
	/** 게임 진행 중 */
	PLAYING = "playing",
	
	/** 게임 종료 */
	ENDED = "ended"
}

// WaitingRoomEvent 열거형
export enum WaitingRoomEvent {
	/** 플레이어 입장 */
	PLAYER_JOIN = "playerJoin",
	
	/** 플레이어 퇴장 */
	PLAYER_LEAVE = "playerLeave",
	
	/** 플레이어 강퇴 */
	PLAYER_KICK = "playerKick",
	
	/** 호스트 변경 */
	HOST_CHANGE = "hostChange",
	
	/** 준비 상태 변경 */
	READY_STATUS_CHANGE = "readyStatusChange",
	
	/** 게임 시작 */
	GAME_START = "gameStart",
	
	/** 게임 종료 */
	GAME_END = "gameEnd",

	/** 채팅 메시지 */
	CHAT_MESSAGE = "chatMessage"
}

// Define constants based on your code (placeholder values assumed)
const STATE_INIT = "INIT";
const GAMEROOM_LOCATIONS: { [key: number]: LocationInfo } = {
	1: ScriptMap.getLocation("GameRoom_1") ? ScriptMap.getLocationList("GameRoom_1")[0] : null,
	2: ScriptMap.getLocation("GameRoom_2") ? ScriptMap.getLocationList("GameRoom_2")[0] : null,
	3: ScriptMap.getLocation("GameRoom_3") ? ScriptMap.getLocationList("GameRoom_3")[0] : null,
	4: ScriptMap.getLocation("GameRoom_4") ? ScriptMap.getLocationList("GameRoom_4")[0] : null,
	5: ScriptMap.getLocation("GameRoom_5") ? ScriptMap.getLocationList("GameRoom_5")[0] : null,
	6: ScriptMap.getLocation("GameRoom_6") ? ScriptMap.getLocationList("GameRoom_6")[0] : null,
	7: ScriptMap.getLocation("GameRoom_7") ? ScriptMap.getLocationList("GameRoom_7")[0] : null,
	8: ScriptMap.getLocation("GameRoom_8") ? ScriptMap.getLocationList("GameRoom_8")[0] : null,
};
const START_WAIT_TIME = 30;

export type GameRoomConfig = {
	id: string;
	title: string;
	gameMode: GameMode;
	maxPlayers: number;
	password?: string;
};

export class GameRoom {
	public id: string;
	public title: string;
	public gameMode: GameMode;
	public maxPlayers: number;
	private password?: string;
	public hostId: string | null = null;
	public players: MafiaPlayer[] = [];
	private readyPlayers: Set<string> = new Set();
	public state: GameRoomState = GameRoomState.WAITING;
	private createdAt: number;
	public flowManager: GameFlowManager;

	constructor(config: GameRoomConfig) {
		this.id = config.id;
		this.title = config.title;
		this.gameMode = config.gameMode;
		this.maxPlayers = config.maxPlayers;
		this.password = config.password;
		this.createdAt = Date.now();
		
		// 기존 코드와 호환되도록 수정
		this.flowManager = new GameFlowManager(parseInt(this.id));
		this.flowManager.setGameRoom(this);
	}

	/**
	 * 게임 플레이어 조회 (GameFlowManager 호환용)
	 */
	public getGamePlayer(playerId: string): GamePlayer | null {
		return getPlayerById(playerId);
	}
	
	/**
	 * 방 플레이어들에게 액션 전송 (GameFlowManager 호환용)
	 */
	public actionToRoomPlayers(action: string | ((player: MafiaPlayer) => void), data?: any): void {
		if (typeof action === 'function') {
			// 콜백 함수로 처리
			this.players.forEach(player => {
				action(player);
			});
		} else {
			// 문자열 액션으로 처리
			this.players.forEach(player => {
				const gamePlayer = getPlayerById(player.id);
				if (gamePlayer) {
					gamePlayer.tag[action] = data;
					gamePlayer.sendUpdated();
				}
			});
		}
	}

	/**
	 * 특정 플레이어 조회 (GameFlowManager 호환용)
	 */
	public getPlayer(playerId: string): MafiaPlayer | undefined {
		return this.players.find(p => p.id === playerId);
	}

	public getId(): string {
		return this.id;
	}
	
	public getTitle(): string {
		return this.title;
	}
	
	public getGameMode(): GameMode {
		return this.gameMode;
	}
	
	public getMaxPlayers(): number {
		return this.maxPlayers;
	}
	
	public getPlayers(): MafiaPlayer[] {
		return this.players;
	}
	
	public getPlayersCount(): number {
		return this.players.length;
	}
	
	public isFull(): boolean {
		return this.players.length >= this.maxPlayers;
	}
	
	public getState(): GameRoomState {
		return this.state;
	}
	
	public getHost(): string | null {
		return this.hostId;
	}
	
	public getCreatedAt(): number {
		return this.createdAt;
	}
	
	public hasPassword(): boolean {
		return !!this.password;
	}
	
	public isPasswordCorrect(password: string): boolean {
		return this.password === password;
	}
	
	public isPlayerReady(playerId: string): boolean {
		return this.readyPlayers.has(playerId);
	}
	
	public areAllPlayersReady(): boolean {
		// 호스트는 준비 상태가 필요 없음
		if (this.players.length < 4) return false;
		
		// 모든 플레이어가 준비 상태인지 확인
		for (const player of this.players) {
			if (this.hostId && player.id === this.hostId) continue;
			if (!this.readyPlayers.has(player.id)) return false;
		}
		
		return true;
	}
	
	/**
	 * 이벤트 처리를 위한 콜백 함수 등록
	 */
	private callbacks: { [key in WaitingRoomEvent]?: Array<(...args: any[]) => void> } = {};
	
	/**
	 * 이벤트 리스너 등록
	 */
	public on(event: WaitingRoomEvent, listener: (...args: any[]) => void): void {
		if (!this.callbacks[event]) {
			this.callbacks[event] = [];
		}
		this.callbacks[event]?.push(listener);
	}
	
	/**
	 * 이벤트 리스너 제거
	 */
	public off(event: WaitingRoomEvent, listener: (...args: any[]) => void): void {
		const callbacks = this.callbacks[event];
		if (!callbacks) return;
		
		const index = callbacks.indexOf(listener);
		if (index !== -1) {
			callbacks.splice(index, 1);
		}
	}
	
	/**
	 * 이벤트 발생
	 */
	private emit(event: WaitingRoomEvent, ...args: any[]): void {
		const callbacks = this.callbacks[event];
		if (!callbacks) return;
		
		callbacks.forEach(callback => {
			try {
				callback(...args);
			} catch (error) {
				ScriptApp.sayToStaffs(`Error in event listener for ${event}:`, error);
			}
		});
	}
	
	/**
	 * 유저 입장
	 */
	public joinPlayer(player: GamePlayer): boolean {
		// 이미 방에 있는 플레이어인지 확인
		if (this.players.some(p => p.id === player.id)) {
			return false;
		}
		
		// 방이 꽉 찼는지 확인
		if (this.isFull()) {
			return false;
		}
		
		// 게임 중인지 확인
		if (this.state !== GameRoomState.WAITING) {
			return false;
		}
		
		// 플레이어 추가 (기존 코드와 호환되도록 수정)
		const mafiaPlayer: MafiaPlayer = {
			id: player.id,
			name: player.name,
			jobId: JobId.CITIZEN, // 기본 직업은 시민
			isAlive: true,
			emoji: "👤" // 기본 이모지
		};
		
		this.players.push(mafiaPlayer);
		
		// 플레이어 태그에 마피아 플레이어 정보 저장
		player.tag.mafiaPlayer = mafiaPlayer;
		
		// 플레이어 위치 설정
		const locationInfo = GAMEROOM_LOCATIONS[parseInt(this.id)];
		if (locationInfo) {
			player.spawnAtLocation(`GameRoom_${this.id}`);
			player.setCameraTarget(Math.floor(locationInfo.x + locationInfo.width / 2), Math.floor(locationInfo.y + locationInfo.height / 2), 0);
			player.displayRatio = 1.5;
			player.sendUpdated();
		}
		
		// 방 정보 저장
		player.tag.roomInfo = {
			roomNum: parseInt(this.id),
		};
		
		// 첫 플레이어인 경우 호스트로 지정
		if (!this.hostId) {
			this.hostId = player.id;
		}
		
		// 입장 이벤트 발생
		this.emit(WaitingRoomEvent.PLAYER_JOIN, player);
		
		return true;
	}
	
	/**
	 * 유저 퇴장
	 */
	public leavePlayer(playerId: string): boolean {
		const playerIndex = this.players.findIndex(p => p.id === playerId);
		if (playerIndex === -1) {
			return false;
		}
		
		const player = getPlayerById(playerId);
		if (!player) {
			// 플레이어 객체를 찾을 수 없는 경우에도 플레이어 목록에서는 제거
			this.players.splice(playerIndex, 1);
			this.readyPlayers.delete(playerId);
			
			// 호스트가 나간 경우 새로운 호스트 지정
			if (this.hostId && this.hostId === playerId) {
				this.assignNewHost();
			}
			
			return true;
		}
		
		// 플레이어 목록에서 제거
		this.players.splice(playerIndex, 1);
		
		// 준비 상태도 삭제
		this.readyPlayers.delete(playerId);
		
		// 플레이어 태그 정보 초기화 (태그가 있는 경우에만)
		if (player.tag) {
			player.tag.roomInfo = null;
			player.tag.mafiaPlayer = null;
			
			// 플레이어 위치 이동
			player.spawnAtLocation("Lobby");
			
			// 위젯 제거
			if (player.tag.widget) {
				if (player.tag.widget.gameStatus) {
					player.tag.widget.gameStatus.destroy();
					player.tag.widget.gameStatus = null;
				}
				
				if (player.tag.widget.nightAction) {
					player.tag.widget.nightAction.destroy();
					player.tag.widget.nightAction = null;
				}
				
				if (player.tag.widget.voteWidget) {
					player.tag.widget.voteWidget.destroy();
					player.tag.widget.voteWidget = null;
				}
				
				if (player.tag.widget.deadChat) {
					player.tag.widget.deadChat.destroy();
					player.tag.widget.deadChat = null;
				}
			}
		}
		
		// 호스트가 나간 경우 새로운 호스트 지정
		if (this.hostId && this.hostId === playerId) {
			this.assignNewHost();
		}
		
		// 퇴장 이벤트 발생
		this.emit(WaitingRoomEvent.PLAYER_LEAVE, player);
		
		return true;
	}
	
	/**
	 * 유저 강퇴
	 */
	public kickPlayer(hostId: string, targetId: string): boolean {
		// 호스트인지 확인
		if (!this.hostId || this.hostId !== hostId) {
			return false;
		}
		
		// 자기 자신은 강퇴할 수 없음
		if (hostId === targetId) {
			return false;
		}
		
		const targetPlayer = getPlayerById(targetId);
		if (!targetPlayer) {
			return false;
		}
		
		// 플레이어 퇴장 처리
		const result = this.leavePlayer(targetId);
		if (!result) {
			return false;
		}
		
		// 강퇴 이벤트 발생
		this.emit(WaitingRoomEvent.PLAYER_KICK, targetPlayer);
		
		return true;
	}
	
	/**
	 * 새로운 호스트 지정
	 */
	private assignNewHost(): void {
		if (this.players.length === 0) {
			this.hostId = null;
			return;
		}
		
		// 첫 번째 플레이어를 호스트로 지정
		const firstPlayerId = this.players[0].id;
		this.hostId = firstPlayerId;
		
		// 새 호스트 이벤트 발생
		const newHost = getPlayerById(firstPlayerId);
		if (newHost) {
			this.emit(WaitingRoomEvent.HOST_CHANGE, newHost);
		}
	}
	
	/**
	 * 호스트 변경
	 */
	public changeHost(hostId: string, newHostId: string): boolean {
		// 현재 호스트인지 확인
		if (!this.hostId || this.hostId !== hostId) {
			return false;
		}
		
		const newHost = getPlayerById(newHostId);
		if (!newHost) {
			return false;
		}
		
		// 플레이어가 방에 있는지 확인
		if (!this.players.some(p => p.id === newHostId)) {
			return false;
		}
		
		this.hostId = newHostId;
		
		// 새 호스트 이벤트 발생
		this.emit(WaitingRoomEvent.HOST_CHANGE, newHost);
		
		return true;
	}
	
	/**
	 * 준비 상태 변경
	 */
	public toggleReady(playerId: string): boolean {
		// 호스트는 준비 상태가 필요 없음
		if (this.hostId && this.hostId === playerId) {
			return false;
		}
		
		// 존재하는 플레이어인지 확인
		if (!this.players.some(p => p.id === playerId)) {
			return false;
		}
		
		const player = getPlayerById(playerId);
		if (!player) {
			return false;
		}
		
		// 현재 준비 상태 확인 후 토글
		const isCurrentlyReady = this.readyPlayers.has(playerId);
		
		if (isCurrentlyReady) {
			this.readyPlayers.delete(playerId);
		} else {
			this.readyPlayers.add(playerId);
		}
		
		// 준비 상태 변경 이벤트 발생
		this.emit(
			WaitingRoomEvent.READY_STATUS_CHANGE, 
			player, 
			!isCurrentlyReady
		);
		
		return true;
	}
	
	/**
	 * 게임 시작
	 */
	public startGame(hostId: string): boolean {
		// 호스트인지 확인
		if (!this.hostId || this.hostId !== hostId) {
			return false;
		}
		
		// 최소 인원 확인 (마피아 게임은 일반적으로 최소 4명)
		if (this.players.length < 4) {
			return false;
		}
		
		// 모든 플레이어가 준비 상태인지 확인 
		if (!this.areAllPlayersReady()) {
			return false;
		}
		
		// 게임 상태 변경
		this.state = GameRoomState.PLAYING;
		
		// 게임 시작 처리
		try {
			this.flowManager.startGame();
		} catch (error) {
			ScriptApp.sayToStaffs("Error starting game:", error);
			this.state = GameRoomState.WAITING;
			return false;
		}
		
		// 게임 시작 이벤트 발생
		this.emit(WaitingRoomEvent.GAME_START);
		
		return true;
	}
	
	/**
	 * 게임 종료
	 */
	public endGame(): void {
		this.state = GameRoomState.WAITING;
		this.readyPlayers.clear();
		
		// 게임 종료 이벤트 발생
		this.emit(WaitingRoomEvent.GAME_END);
	}
	
	/**
	 * 방 초기화
	 */
	public reset(): void {
		// 모든 플레이어의 위젯 제거
		this.players.forEach((player) => {
			const gamePlayer = getPlayerById(player.id);
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
		
		// 플레이어 목록 초기화
		this.players = [];
		this.readyPlayers.clear();
		this.hostId = null;
		this.state = GameRoomState.WAITING;
		
		// 게임 플로우 매니저 초기화
		this.flowManager = new GameFlowManager(parseInt(this.id));
		this.flowManager.setGameRoom(this);
	}
	
	/**
	 * 방 정보 JSON 변환
	 */
	public toJSON() {
		const hostPlayer = this.hostId ? getPlayerById(this.hostId) : null;
		
		return {
			id: this.id,
			title: this.title,
			gameMode: this.gameMode.getName(),
			maxPlayers: this.maxPlayers,
			hasPassword: this.hasPassword(),
			playersCount: this.getPlayersCount(),
			host: this.hostId ? {
				id: this.hostId,
				name: hostPlayer ? hostPlayer.name : '알 수 없음'
			} : null,
			state: this.state,
			players: this.players.map(player => ({
				id: player.id,
				name: player.name,
				isReady: this.isPlayerReady(player.id),
				isHost: this.hostId ? player.id === this.hostId : false
			})),
			createdAt: new Date(this.createdAt).toISOString()
		};
	}
}
