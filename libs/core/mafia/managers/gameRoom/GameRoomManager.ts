import { GameRoom } from "./GameRoom";

export class GameRoomManager {
	private gameRooms: { [key: number]: GameRoom };

	constructor(roomCount: number) {
		this.gameRooms = {};
		for (let i = 1; i <= roomCount; i++) {
			this.gameRooms[i] = new GameRoom(i);
		}
	}

	getAllRooms() {
		return this.gameRooms;
	}

	// Get a specific game room by ID
	getRoom(roomId: number): GameRoom | undefined {
		return this.gameRooms[roomId];
	}

	// Reset a specific game room
	resetRoom(roomId: number) {
		const room = this.gameRooms[roomId];
		if (room) {
			room.reset();
		}
	}
}
