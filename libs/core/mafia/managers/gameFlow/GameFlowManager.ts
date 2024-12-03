import { GameRoom } from "../gameRoom/GameRoom";

// GameState Enum: 게임의 주요 상태를 정의
export enum GameState {
	WAITING = "WAITING", // 플레이어 대기 중
	IN_PROGRESS = "IN_PROGRESS", // 게임 진행 중
	VOTING = "VOTING", // 투표 단계
	ENDED = "ENDED", // 게임 종료
}

// GamePhase Enum: 게임 진행의 세부 단계를 정의
export enum GamePhase {
	DAY = "DAY", // 낮 단계
	NIGHT = "NIGHT", // 밤 단계
}

export class GameFlowManager {
    private state: GameState = GameState.WAITING;
    private phase: GamePhase = GamePhase.DAY;
    private dayCount: number = 1;

    constructor(private room: GameRoom) {}

    startGame() {
        if (this.room.readyCount < this.room.players.length) {
            throw new Error("Not all players are ready!");
        }

        this.state = GameState.IN_PROGRESS;
        this.phase = GamePhase.DAY;
        this.dayCount = 1;

        console.log(`Game started in room ${this.room.id}`);
        this.updatePhase();
    }

    updatePhase() {
        if (this.state !== GameState.IN_PROGRESS) {
            throw new Error("Game is not in progress.");
        }

        this.phase = this.phase === GamePhase.DAY ? GamePhase.NIGHT : GamePhase.DAY;
        if (this.phase === GamePhase.DAY) this.dayCount++;

        console.log(`Room ${this.room.id}: Phase updated to ${this.phase}, Day ${this.dayCount}`);
    }

    startVoting() {
        if (this.state !== GameState.IN_PROGRESS) {
            throw new Error("Game is not in progress.");
        }
        this.state = GameState.VOTING;
        console.log(`Room ${this.room.id}: Voting phase started.`);
    }

    endVoting(votes: { [player: string]: number }) {
        if (this.state !== GameState.VOTING) {
            throw new Error("Not in voting phase.");
        }

        const eliminatedPlayer = Object.keys(votes).reduce((a, b) =>
            votes[a] > votes[b] ? a : b
        );

        console.log(`Room ${this.room.id}: Player ${eliminatedPlayer} eliminated.`);
        this.room.removePlayer(eliminatedPlayer);

        this.checkWinCondition();
        this.state = GameState.IN_PROGRESS;
    }

    checkWinCondition() {
        const mafiaCount = this.room.players.filter(p => p.includes("mafia")).length;
        const nonMafiaCount = this.room.players.length - mafiaCount;

        if (mafiaCount === 0) {
            console.log(`Room ${this.room.id}: Non-mafia players win!`);
            this.state = GameState.ENDED;
        } else if (mafiaCount >= nonMafiaCount) {
            console.log(`Room ${this.room.id}: Mafia wins!`);
            this.state = GameState.ENDED;
        }
    }

    resetGame() {
        this.state = GameState.WAITING;
        this.phase = GamePhase.DAY;
        this.dayCount = 1;

        console.log(`Room ${this.room.id}: Game reset.`);
    }
}
