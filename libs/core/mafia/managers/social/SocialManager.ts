import { ManagerBase } from "../../../@common/ManagerBase";
import { GamePlayer } from "../../types/GamePlayer";
import { IUserProfileData, UserStatus, FriendRequest, UserListInitData } from "../../types/SocialTypes";
import { SupabaseService } from "../../services/SupabaseService";
import { WidgetManager } from "../widget/WidgetManager";
import { WidgetType } from "../widget/WidgetType";
import { sendAdminConsoleMessage } from "../../../../utils/Common";

/**
 * 소셜 매니저
 * 유저 목록 및 친구 시스템 관리
 */
export class SocialManager extends ManagerBase {
    /** 온라인 유저 트래커 */
    private onlineTracker: Record<string, IUserProfileData> = {};

    /** 위젯 갱신 딜레이 카운터 (프레임 단위) */
    private updateDelay: number = 0;

    /** 갱신 딜레이 시간 (2초 = 120프레임 @60fps) */
    private readonly UPDATE_DELAY_FRAMES = 120;

    /** Supabase 서비스 */
    private supabaseService: SupabaseService;

    /** 플레이어별 친구 목록 캐시 */
    private playerFriendLists: Record<string, string[]> = {};

    /** 플레이어별 대기 중인 친구 요청 캐시 */
    private playerPendingRequests: Record<string, FriendRequest[]> = {};

    constructor() {
        super();
        this.supabaseService = SupabaseService.instance;
    }

    /**
     * 플레이어 추가 (입장 시)
     * @param player 게임 플레이어
     */
    public addPlayer(player: GamePlayer): void {
        this.onlineTracker[player.id] = {
            id: player.id,
            name: player.name,
            profileImage: player.tag?.profile?.avatar || "",
            status: UserStatus.LOBBY
        };

        // 플레이어의 친구 목록 로드
        this.loadPlayerFriendData(player);

        this.requestUpdate();
        sendAdminConsoleMessage(`[SocialManager] 플레이어 추가: ${player.name}`);
    }

    /**
     * 플레이어 제거 (퇴장 시)
     * @param playerId 플레이어 ID
     */
    public removePlayer(playerId: string): void {
        if (this.onlineTracker[playerId]) {
            const playerName = this.onlineTracker[playerId].name;
            delete this.onlineTracker[playerId];
            delete this.playerFriendLists[playerId];
            delete this.playerPendingRequests[playerId];
            this.requestUpdate();
            sendAdminConsoleMessage(`[SocialManager] 플레이어 제거: ${playerName}`);
        }
    }

    /**
     * 플레이어 상태 업데이트
     * @param playerId 플레이어 ID
     * @param status 새 상태
     * @param roomId 방 ID (선택)
     * @param roomTitle 방 제목 (선택)
     */
    public updatePlayerStatus(playerId: string, status: UserStatus, roomId?: string, roomTitle?: string): void {
        const userData = this.onlineTracker[playerId];
        if (!userData) return;

        userData.status = status;
        userData.roomId = roomId;
        userData.roomTitle = roomTitle;

        this.requestUpdate();
        sendAdminConsoleMessage(`[SocialManager] 상태 업데이트: ${userData.name} -> ${status}`);
    }

    /**
     * 갱신 요청 (2초 딜레이 적용)
     */
    private requestUpdate(): void {
        this.updateDelay = this.UPDATE_DELAY_FRAMES;
    }

    /**
     * 매 프레임 업데이트 (Game.ts의 onUpdate에서 호출)
     * @param dt 델타 타임
     */
    public onUpdate(dt: number): void {
        if (this.updateDelay > 0) {
            this.updateDelay--;
            if (this.updateDelay === 0) {
                this.broadcastUserListUpdate();
            }
        }
    }

    /**
     * 모든 온라인 플레이어에게 유저 목록 갱신 전송
     */
    private broadcastUserListUpdate(): void {
        const players = this.getOnlinePlayers();

        for (const playerId of Object.keys(this.onlineTracker)) {
            const player = players.find(p => p.id === playerId);
            if (player) {
                this.sendRefreshList(player);
            }
        }
    }

    /**
     * 특정 플레이어에게 유저 목록 갱신 전송
     * @param player 게임 플레이어
     */
    private sendRefreshList(player: GamePlayer): void {
        WidgetManager.instance.sendMessageToWidget(player, WidgetType.USER_LIST, {
            type: "refreshList",
            onlineTracker: this.onlineTracker
        });
    }

    /**
     * 플레이어의 친구 데이터 로드
     * @param player 게임 플레이어
     */
    private loadPlayerFriendData(player: GamePlayer): void {
        // 친구 목록 로드
        this.supabaseService.getFriendList(player.id, (friendIds) => {
            this.playerFriendLists[player.id] = friendIds;

            // 대기 중인 친구 요청 로드
            this.supabaseService.getPendingRequests(player.id, (requests) => {
                // 요청자 정보 채우기
                const enrichedRequests = requests.map(req => {
                    const requesterData = this.onlineTracker[req.fromId];
                    return {
                        ...req,
                        fromName: requesterData?.name || "알 수 없음",
                        fromImage: requesterData?.profileImage || ""
                    };
                });

                this.playerPendingRequests[player.id] = enrichedRequests;
            });
        });
    }

    /**
     * 유저 목록 위젯 표시
     * @param player 게임 플레이어
     */
    public showUserListWidget(player: GamePlayer): void {
        const friendList = this.playerFriendLists[player.id] || [];
        const pendingRequests = this.playerPendingRequests[player.id] || [];

        const initData: UserListInitData = {
            onlineTracker: this.onlineTracker,
            friendList: friendList,
            pendingRequests: pendingRequests,
            myId: player.id
        };

        // 위젯에 초기화 데이터 전송
        WidgetManager.instance.sendMessageToWidget(player, WidgetType.USER_LIST, {
            type: "init",
            ...initData
        });

        // 위젯 표시
        WidgetManager.instance.showWidget(player, WidgetType.USER_LIST);
    }

    /**
     * 유저 목록 위젯 숨기기
     * @param player 게임 플레이어
     */
    public hideUserListWidget(player: GamePlayer): void {
        WidgetManager.instance.hideWidget(player, WidgetType.USER_LIST);
    }

    /**
     * 유저 목록 위젯 메시지 핸들러
     * @param player 메시지 발신 플레이어
     * @param msg 메시지 데이터
     */
    public handleUserListMessage(player: GamePlayer, msg: any): void {
        switch (msg.type) {
            case "lookupUser":
                this.handleLookupUser(player, msg.targetId);
                break;
            case "whisper":
                this.handleWhisper(player, msg.targetId, msg.message);
                break;
            case "joinRoom":
                this.handleJoinRoom(player, msg.roomId);
                break;
            case "sendFriendRequest":
                this.handleSendFriendRequest(player, msg.targetId);
                break;
            case "acceptFriendRequest":
                this.handleAcceptFriendRequest(player, msg.requesterId);
                break;
            case "rejectFriendRequest":
                this.handleRejectFriendRequest(player, msg.requesterId);
                break;
            case "removeFriend":
                this.handleRemoveFriend(player, msg.friendId);
                break;
            case "closeWidget":
                this.hideUserListWidget(player);
                break;
        }
    }

    /**
     * 프로필 조회 처리
     */
    private handleLookupUser(player: GamePlayer, targetId: string): void {
        const targetData = this.onlineTracker[targetId];
        if (!targetData) {
            player.sendMessage("해당 유저를 찾을 수 없습니다.", 0xFFAAAA);
            return;
        }

        // TODO: 프로필 팝업 위젯 표시
        player.sendMessage(`${targetData.name}님의 프로필 (상태: ${this.getStatusText(targetData.status)})`, 0x00f0ff);
    }

    /**
     * 귓속말 처리
     */
    private handleWhisper(player: GamePlayer, targetId: string, message: string): void {
        const targetData = this.onlineTracker[targetId];
        if (!targetData) {
            player.sendMessage("해당 유저를 찾을 수 없습니다.", 0xFFAAAA);
            return;
        }

        const targetPlayers = this.getOnlinePlayers();
        const targetPlayer = targetPlayers.find(p => p.id === targetId);

        if (targetPlayer) {
            // 수신자에게 메시지 전송
            targetPlayer.sendMessage(`[귓속말] ${player.name}: ${message}`, 0xff2d95);
            // 발신자에게 확인 메시지
            player.sendMessage(`[귓속말 -> ${targetData.name}] ${message}`, 0xff2d95);
        }
    }

    /**
     * 같은 방 입장 처리
     */
    private handleJoinRoom(player: GamePlayer, roomId: string): void {
        // 이벤트 발생으로 GameRoomManager에서 처리
        // @ts-ignore - 동적 이벤트 이름 사용
        this.eventEmitter.emit("JOIN_ROOM_REQUEST", { player, roomId });
    }

    /**
     * 친구 요청 전송 처리
     */
    private handleSendFriendRequest(player: GamePlayer, targetId: string): void {
        // 자기 자신에게 요청 불가
        if (player.id === targetId) {
            player.sendMessage("자기 자신에게 친구 요청을 보낼 수 없습니다.", 0xFFAAAA);
            return;
        }

        const targetData = this.onlineTracker[targetId];
        if (!targetData) {
            player.sendMessage("해당 유저를 찾을 수 없습니다.", 0xFFAAAA);
            return;
        }

        // 이미 친구인지 확인
        const friendList = this.playerFriendLists[player.id] || [];
        if (friendList.includes(targetId)) {
            player.sendMessage("이미 친구입니다.", 0xFFAAAA);
            return;
        }

        // 친구 요청 전송
        this.supabaseService.sendFriendRequest(player.id, targetId, (success) => {
            if (success) {
                player.sendMessage(`${targetData.name}님에게 친구 요청을 보냈습니다.`, 0x00ff88);

                // 상대방에게 알림
                const targetPlayers = this.getOnlinePlayers();
                const targetPlayer = targetPlayers.find(p => p.id === targetId);
                if (targetPlayer) {
                    // 상대방의 대기 요청 목록 갱신
                    this.loadPlayerFriendData(targetPlayer);

                    // 위젯에 알림 전송
                    WidgetManager.instance.sendMessageToWidget(targetPlayer, WidgetType.USER_LIST, {
                        type: "friendRequestReceived",
                        fromId: player.id,
                        fromName: player.name,
                        fromImage: player.tag?.profile?.avatar || ""
                    });

                    targetPlayer.sendMessage(`${player.name}님이 친구 요청을 보냈습니다.`, 0x00f0ff);
                }
            } else {
                player.sendMessage("친구 요청 전송에 실패했습니다.", 0xFFAAAA);
            }
        });
    }

    /**
     * 친구 요청 수락 처리
     */
    private handleAcceptFriendRequest(player: GamePlayer, requesterId: string): void {
        this.supabaseService.acceptFriendRequest(requesterId, player.id, (success) => {
            if (success) {
                const requesterData = this.onlineTracker[requesterId];
                const requesterName = requesterData?.name || "알 수 없음";

                player.sendMessage(`${requesterName}님의 친구 요청을 수락했습니다.`, 0x00ff88);

                // 친구 목록 갱신
                this.loadPlayerFriendData(player);

                // 상대방에게 알림 및 갱신
                const targetPlayers = this.getOnlinePlayers();
                const requesterPlayer = targetPlayers.find(p => p.id === requesterId);
                if (requesterPlayer) {
                    this.loadPlayerFriendData(requesterPlayer);

                    WidgetManager.instance.sendMessageToWidget(requesterPlayer, WidgetType.USER_LIST, {
                        type: "friendRequestAccepted",
                        byId: player.id,
                        byName: player.name
                    });

                    requesterPlayer.sendMessage(`${player.name}님이 친구 요청을 수락했습니다.`, 0x00ff88);
                }

                // 위젯 갱신
                this.sendFriendListUpdate(player);
            } else {
                player.sendMessage("친구 요청 수락에 실패했습니다.", 0xFFAAAA);
            }
        });
    }

    /**
     * 친구 요청 거절 처리
     */
    private handleRejectFriendRequest(player: GamePlayer, requesterId: string): void {
        this.supabaseService.removeFriendRecord(requesterId, player.id, (success) => {
            if (success) {
                const requesterData = this.onlineTracker[requesterId];
                const requesterName = requesterData?.name || "알 수 없음";

                player.sendMessage(`${requesterName}님의 친구 요청을 거절했습니다.`, 0xFFAAAA);

                // 대기 요청 목록에서 제거
                const pendingRequests = this.playerPendingRequests[player.id] || [];
                this.playerPendingRequests[player.id] = pendingRequests.filter(r => r.fromId !== requesterId);

                // 위젯 갱신
                this.sendFriendListUpdate(player);
            } else {
                player.sendMessage("친구 요청 거절에 실패했습니다.", 0xFFAAAA);
            }
        });
    }

    /**
     * 친구 삭제 처리
     */
    private handleRemoveFriend(player: GamePlayer, friendId: string): void {
        this.supabaseService.removeFriendRecord(player.id, friendId, (success) => {
            if (success) {
                const friendData = this.onlineTracker[friendId];
                const friendName = friendData?.name || "알 수 없음";

                player.sendMessage(`${friendName}님을 친구에서 삭제했습니다.`, 0xFFAAAA);

                // 친구 목록에서 제거
                const friendList = this.playerFriendLists[player.id] || [];
                this.playerFriendLists[player.id] = friendList.filter(id => id !== friendId);

                // 위젯 갱신
                this.sendFriendListUpdate(player);

                // 상대방 친구 목록도 갱신
                const targetPlayers = this.getOnlinePlayers();
                const friendPlayer = targetPlayers.find(p => p.id === friendId);
                if (friendPlayer) {
                    const friendsFriendList = this.playerFriendLists[friendId] || [];
                    this.playerFriendLists[friendId] = friendsFriendList.filter(id => id !== player.id);
                    this.sendFriendListUpdate(friendPlayer);
                }
            } else {
                player.sendMessage("친구 삭제에 실패했습니다.", 0xFFAAAA);
            }
        });
    }

    /**
     * 친구 목록 업데이트 전송
     */
    private sendFriendListUpdate(player: GamePlayer): void {
        const friendList = this.playerFriendLists[player.id] || [];
        const pendingRequests = this.playerPendingRequests[player.id] || [];

        WidgetManager.instance.sendMessageToWidget(player, WidgetType.USER_LIST, {
            type: "friendListUpdate",
            friendList: friendList,
            pendingRequests: pendingRequests
        });
    }

    /**
     * 상태 텍스트 반환
     */
    private getStatusText(status: UserStatus): string {
        switch (status) {
            case UserStatus.LOBBY:
                return "로비 대기";
            case UserStatus.IN_ROOM:
                return "방 대기";
            case UserStatus.IN_GAME:
                return "게임 중";
            default:
                return "알 수 없음";
        }
    }

    /**
     * 온라인 플레이어 목록 조회 (ScriptApp에서)
     */
    private getOnlinePlayers(): GamePlayer[] {
        const players: GamePlayer[] = [];
        // @ts-ignore - ZEP ScriptApp API
        ScriptApp.players.forEach((player: GamePlayer) => {
            players.push(player);
        });
        return players;
    }

    /**
     * 온라인 트래커 조회 (외부에서 사용)
     */
    public getOnlineTracker(): Record<string, IUserProfileData> {
        return this.onlineTracker;
    }

    /**
     * 특정 플레이어의 친구 목록 조회
     */
    public getPlayerFriendList(playerId: string): string[] {
        return this.playerFriendLists[playerId] || [];
    }
}
