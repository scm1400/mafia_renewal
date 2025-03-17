import { LocationInfo } from "zep-script";
import { GameFlowManager, MafiaPlayer, MafiaGameRole } from "../gameFlow/GameFlowManager";
import { GamePlayer } from "../../types/GamePlayer";
import { getPlayerById } from "../../../../utils/Common";

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
		const player = getPlayerById(playerId);
		if (!player) return;

		// 플레이어 정보 생성
		const mafiaPlayer: MafiaPlayer = {
			id: playerId,
			name: player.name,
			role: MafiaGameRole.CITIZEN,
			isAlive: true,
			emoji: "👤" // 기본 이모지
		};

		// 플레이어 목록에 추가
		this.players.push(mafiaPlayer);

		// 플레이어 태그에 마피아 플레이어 정보 저장
		player.tag.mafiaPlayer = mafiaPlayer;

		// 플레이어 위치 설정
		const locationInfo = GAMEROOM_LOCATIONS[this.id];
		player.spawnAtLocation(`GameRoom_${this.id}`);
		player.setCameraTarget(Math.floor(locationInfo.x + locationInfo.width / 2), Math.floor(locationInfo.y + locationInfo.height / 2), 0);
		player.displayRatio = 1.5;
		player.sendUpdated();

		// 방 정보 저장
		player.tag.roomInfo = {
			roomNum: this.id,
		};

		// 게임이 진행 중이면 게임 상태 위젯 업데이트
		if (this.flowManager.isGameInProgress()) {
			try {
				this.flowManager.updateAllGameStatusWidgets();
			} catch (error) {
				console.error("Error updating game status widgets:", error);
			}
		}
	}

	// 플레이어 제거
	removePlayer(playerId: string) {
		const player = getPlayerById(playerId);
		if (!player) return;

		// 플레이어 목록에서 제거
		this.players = this.players.filter((p) => p.id !== playerId);

		// 플레이어 태그 정보 초기화
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

			if (player.tag.widget.roleCard) {
				player.tag.widget.roleCard.destroy();
				player.tag.widget.roleCard = null;
			}
		}
	}

	// 게임룸 초기화
	reset() {
		// 모든 플레이어의 위젯 제거
		this.actionToRoomPlayers((player) => {
			const gamePlayer = getPlayerById(player.id);
			if (!gamePlayer) return;

			// 위젯 제거
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

				if (gamePlayer.tag.widget.roleCard) {
					gamePlayer.tag.widget.roleCard.destroy();
					gamePlayer.tag.widget.roleCard = null;
				}
			}
		});

		// 플레이어 목록 초기화
		this.players = [];

		// GameFlowManager 상태 초기화
		this.flowManager.resetGame();
	}

	// 방 내 모든 플레이어에게 액션 실행
	actionToRoomPlayers(action: (player: MafiaPlayer, ...args: any[]) => void, ...args: any[]) {
		this.players.forEach((player) => {
			try {
				action(player, ...args);
			} catch (error) {
				console.error(`Error in actionToRoomPlayers for player ${player.id}:`, error);
			}
		});
	}
}
