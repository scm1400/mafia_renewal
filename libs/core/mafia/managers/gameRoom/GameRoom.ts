import { GameFlowManager, MafiaPlayer, MafiaGameRole } from "../gameFlow/GameFlowManager";

// Define constants based on your code (placeholder values assumed)
const STATE_INIT = "INIT";
const GAMEROOM_START_POINT: { [key: number]: string } = {
	1: "Point1",
	2: "Point2",
	3: "Point3",
	4: "Point4",
	5: "Point5",
	6: "Point6",
	7: "Point7",
	8: "Point8",
};
const START_WAIT_TIME = 30;

export class GameRoom {
	public id: number;
	public players: MafiaPlayer[] = [];
	public flowManager: GameFlowManager;

	constructor(id: number) {
		this.id = id;
		this.flowManager = new GameFlowManager(this); // 생성 시 GameFlowManager 초기화
	}

	// 플레이어 추가 (게임 시작 전에는 기본 역할은 CITIZEN)
	addPlayer(playerId: string) {
		this.players.push({ id: playerId, role: MafiaGameRole.CITIZEN, isAlive: true });
	}

	// 플레이어 제거
	removePlayer(playerId: string) {
		this.players = this.players.filter((player) => player.id !== playerId);
	}

	reset() {
		this.players = [];
		this.flowManager.resetGame(); // GameFlowManager 상태도 초기화
	}
}
