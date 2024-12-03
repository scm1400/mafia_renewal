import { GameFlowManager } from "../gameFlow/GameFlowManager";

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
	public players: string[] = [];
	public readyCount: number = 0;
	public flowManager: GameFlowManager;

	constructor(id: number) {
		this.id = id;
		this.flowManager = new GameFlowManager(this); // 생성 시 GameFlowManager 초기화
	}

	addPlayer(playerId: string) {
		this.players.push(playerId);
		this.readyCount++;
	}

	removePlayer(playerId: string) {
		this.players = this.players.filter((player) => player !== playerId);
		this.readyCount = Math.max(0, this.readyCount - 1);
	}

	reset() {
		this.players = [];
		this.readyCount = 0;
		this.flowManager.resetGame(); // GameFlowManager 상태도 초기화
	}
}
