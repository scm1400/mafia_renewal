import { GameRoom } from "./GameRoom";

export class GameRoomManager {
    private gameRooms: { [key: number]: GameRoom };

    constructor(roomCount: number) {
        this.gameRooms = {};
        for (let i = 1; i <= roomCount; i++) {
            this.gameRooms[i] = new GameRoom(i);
        }
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

    // Add a player to a specific room
    addPlayerToRoom(roomId: number, playerId: string) {
        const room = this.gameRooms[roomId];
        if (room) {
            room.addPlayer(playerId);
        }
    }

    // Remove a player from a specific room
    removePlayerFromRoom(roomId: number, playerId: string) {
        const room = this.gameRooms[roomId];
        if (room) {
            room.removePlayer(playerId);
        }
    }

    // Get the status of all rooms
    getAllRoomStatuses(): { [key: number]: object } {
        const statuses: { [key: number]: object } = {};
        for (const [roomId, room] of Object.entries(this.gameRooms)) {
            statuses[Number(roomId)] = {
                players: room.players,
                readyCount: room.readyCount,
            };
        }
        return statuses;
    }
}
