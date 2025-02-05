import { LocationInfo } from "zep-script";
import { GameFlowManager, MafiaPlayer, MafiaGameRole } from "../gameFlow/GameFlowManager";
import { GamePlayer } from "../../types/GamePlayer";

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
		const player: GamePlayer = ScriptApp.getPlayerByID(playerId);
		if (!player) return;
		this.players.push({ id: playerId, name: player.name, role: MafiaGameRole.CITIZEN, isAlive: true });

		const locationInfo = GAMEROOM_LOCATIONS[this.id];
		player.spawnAtLocation(`GameRoom_${this.id}`);
		player.setCameraTarget(Math.floor(locationInfo.x + locationInfo.width / 2), Math.floor(locationInfo.y + locationInfo.height / 2), 0);
		player.displayRatio = 1.5;
		player.sendUpdated();

		player.tag.roomInfo = {
			roomNum: this.id,
		};
	}

	// 플레이어 제거
	removePlayer(playerId: string) {
		const player: GamePlayer = ScriptApp.getPlayerByID(playerId);
		if (!player) return;
		this.players = this.players.filter((player) => player.id !== playerId);

		player.tag.roomInfo = null;

		player.spawnAtLocation("Lobby");
	}

	reset() {
		this.players = [];
		this.flowManager.resetGame(); // GameFlowManager 상태도 초기화
	}

	actionToRoomPlayers(action: (player: MafiaPlayer, ...args) => void, ...args) {
		this.players.forEach((player) => {
			try {
				action(player, ...args);
			} catch (error) {}
		});
	}
}
