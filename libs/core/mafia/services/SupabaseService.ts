import { FriendRecord, FriendRequest, OfflineFriendProfile } from "../types/SocialTypes";
import { parseJsonString } from "../../../utils/Common";

/**
 * Supabase 설정
 * TODO: 실제 Supabase 프로젝트 정보로 교체 필요
 */
const SUPABASE_CONFIG = {
    PROJECT_URL: "https://YOUR_PROJECT_ID.supabase.co",
    ANON_KEY: "YOUR_ANON_KEY"
};

/**
 * Supabase API 서비스
 * 친구 시스템 관련 데이터베이스 작업 처리
 */
export class SupabaseService {
    private static _instance: SupabaseService;

    private baseUrl: string;
    private apiKey: string;
    private headers: Record<string, string>;

    private constructor() {
        this.baseUrl = `${SUPABASE_CONFIG.PROJECT_URL}/rest/v1`;
        this.apiKey = SUPABASE_CONFIG.ANON_KEY;
        this.headers = {
            "apikey": this.apiKey,
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        };
    }

    /**
     * 싱글톤 인스턴스 접근자
     */
    public static get instance(): SupabaseService {
        if (!this._instance) {
            this._instance = new SupabaseService();
        }
        return this._instance;
    }

    /**
     * 친구 목록 조회 (수락된 친구만)
     * @param playerId 플레이어 ID
     * @param callback 콜백 함수 (친구 ID 배열)
     */
    public getFriendList(playerId: string, callback: (friends: string[]) => void): void {
        // requester_id 또는 receiver_id가 playerId이고 status가 accepted인 레코드 조회
        const url = `${this.baseUrl}/mafia_friends?or=(requester_id.eq.${playerId},receiver_id.eq.${playerId})&status=eq.accepted`;

        ScriptApp.httpGet(url, this.headers, (response: string) => {
            const records = this.parseResponse<FriendRecord[]>(response);
            if (!records) {
                callback([]);
                return;
            }

            // 상대방 ID 추출
            const friendIds = records.map(record => {
                return record.requester_id === playerId ? record.receiver_id : record.requester_id;
            });

            callback(friendIds);
        });
    }

    /**
     * 대기 중인 친구 요청 조회 (내가 받은 요청)
     * @param playerId 플레이어 ID
     * @param callback 콜백 함수 (친구 요청 배열)
     */
    public getPendingRequests(playerId: string, callback: (requests: FriendRequest[]) => void): void {
        const url = `${this.baseUrl}/mafia_friends?receiver_id=eq.${playerId}&status=eq.pending`;

        ScriptApp.httpGet(url, this.headers, (response: string) => {
            const records = this.parseResponse<FriendRecord[]>(response);
            if (!records) {
                callback([]);
                return;
            }

            // FriendRequest 형태로 변환 (요청자 정보는 온라인 트래커에서 조회해야 함)
            const requests: FriendRequest[] = records.map(record => ({
                id: record.id,
                fromId: record.requester_id,
                fromName: "",  // SocialManager에서 채워줌
                fromImage: "", // SocialManager에서 채워줌
                createdAt: record.created_at
            }));

            callback(requests);
        });
    }

    /**
     * 내가 보낸 대기 중인 친구 요청 조회
     * @param playerId 플레이어 ID
     * @param callback 콜백 함수 (받는 사람 ID 배열)
     */
    public getSentPendingRequests(playerId: string, callback: (receiverIds: string[]) => void): void {
        const url = `${this.baseUrl}/mafia_friends?requester_id=eq.${playerId}&status=eq.pending`;

        ScriptApp.httpGet(url, this.headers, (response: string) => {
            const records = this.parseResponse<FriendRecord[]>(response);
            if (!records) {
                callback([]);
                return;
            }

            const receiverIds = records.map(record => record.receiver_id);
            callback(receiverIds);
        });
    }

    /**
     * 친구 요청 전송
     * @param requesterId 요청자 ID
     * @param receiverId 수신자 ID
     * @param callback 콜백 함수 (성공 여부)
     */
    public sendFriendRequest(requesterId: string, receiverId: string, callback: (success: boolean) => void): void {
        const url = `${this.baseUrl}/mafia_friends`;
        const body = JSON.stringify({
            requester_id: requesterId,
            receiver_id: receiverId,
            status: "pending"
        });

        // @ts-ignore - ZEP ScriptApp httpPost 타입 문제
        ScriptApp.httpPost(url, this.headers, body, (response: string) => {
            // Supabase는 성공 시 생성된 레코드를 반환
            const result = this.parseResponse<FriendRecord[]>(response);
            callback(result !== null && result.length > 0);
        });
    }

    /**
     * 친구 요청 수락
     * @param requesterId 요청자 ID
     * @param receiverId 수신자 ID (현재 플레이어)
     * @param callback 콜백 함수 (성공 여부)
     */
    public acceptFriendRequest(requesterId: string, receiverId: string, callback: (success: boolean) => void): void {
        const url = `${this.baseUrl}/mafia_friends?requester_id=eq.${requesterId}&receiver_id=eq.${receiverId}&status=eq.pending`;
        const body = JSON.stringify({
            status: "accepted"
        });

        // PATCH 요청을 위해 httpPost 사용 (ZEP은 httpPatch를 지원하지 않을 수 있음)
        const patchHeaders = { ...this.headers };
        // @ts-ignore - ZEP ScriptApp API
        if (ScriptApp.httpPatch) {
            // @ts-ignore
            ScriptApp.httpPatch(url, patchHeaders, body, (response: string) => {
                const result = this.parseResponse<FriendRecord[]>(response);
                callback(result !== null && result.length > 0);
            });
        } else {
            // httpPatch가 없으면 삭제 후 재생성으로 대체
            this.removeFriendRecord(requesterId, receiverId, (removed) => {
                if (!removed) {
                    callback(false);
                    return;
                }
                const createUrl = `${this.baseUrl}/mafia_friends`;
                const createBody = JSON.stringify({
                    requester_id: requesterId,
                    receiver_id: receiverId,
                    status: "accepted"
                });
                // @ts-ignore - ZEP ScriptApp httpPost 타입 문제
                ScriptApp.httpPost(createUrl, this.headers, createBody, (createResponse: string) => {
                    const createResult = this.parseResponse<FriendRecord[]>(createResponse);
                    callback(createResult !== null && createResult.length > 0);
                });
            });
        }
    }

    /**
     * 친구 요청 거절 또는 친구 삭제
     * @param playerId 현재 플레이어 ID
     * @param targetId 상대방 ID
     * @param callback 콜백 함수 (성공 여부)
     */
    public removeFriendRecord(playerId: string, targetId: string, callback: (success: boolean) => void): void {
        // 양방향 관계 모두 삭제 시도
        const url = `${this.baseUrl}/mafia_friends?or=(and(requester_id.eq.${playerId},receiver_id.eq.${targetId}),and(requester_id.eq.${targetId},receiver_id.eq.${playerId}))`;

        // @ts-ignore - ZEP ScriptApp API
        if (ScriptApp.httpDelete) {
            // @ts-ignore
            ScriptApp.httpDelete(url, this.headers, (response: string) => {
                // DELETE 성공 시 빈 응답 또는 삭제된 레코드 반환
                callback(true);
            });
        } else {
            // httpDelete가 없으면 실패 처리
            callback(false);
        }
    }

    /**
     * 오프라인 친구 프로필 조회 (배치)
     * 주의: 이 기능은 별도의 유저 프로필 테이블이 필요함
     * 현재는 온라인 유저만 프로필 표시 가능
     * @param friendIds 친구 ID 배열
     * @param callback 콜백 함수 (프로필 배열)
     */
    public getOfflineFriendProfiles(friendIds: string[], callback: (profiles: OfflineFriendProfile[]) => void): void {
        if (friendIds.length === 0) {
            callback([]);
            return;
        }

        // TODO: 유저 프로필 테이블이 있다면 여기서 조회
        // 현재는 빈 배열 반환 (오프라인 친구 프로필 미지원)
        callback([]);
    }

    /**
     * 이미 친구인지 확인
     * @param playerId 현재 플레이어 ID
     * @param targetId 확인할 상대 ID
     * @param callback 콜백 함수 (친구 여부)
     */
    public checkIsFriend(playerId: string, targetId: string, callback: (isFriend: boolean) => void): void {
        const url = `${this.baseUrl}/mafia_friends?or=(and(requester_id.eq.${playerId},receiver_id.eq.${targetId}),and(requester_id.eq.${targetId},receiver_id.eq.${playerId}))&status=eq.accepted`;

        ScriptApp.httpGet(url, this.headers, (response: string) => {
            const records = this.parseResponse<FriendRecord[]>(response);
            callback(records !== null && records.length > 0);
        });
    }

    /**
     * 이미 친구 요청을 보냈는지 확인
     * @param requesterId 요청자 ID
     * @param receiverId 수신자 ID
     * @param callback 콜백 함수 (요청 존재 여부)
     */
    public checkPendingRequest(requesterId: string, receiverId: string, callback: (hasPending: boolean) => void): void {
        const url = `${this.baseUrl}/mafia_friends?requester_id=eq.${requesterId}&receiver_id=eq.${receiverId}&status=eq.pending`;

        ScriptApp.httpGet(url, this.headers, (response: string) => {
            const records = this.parseResponse<FriendRecord[]>(response);
            callback(records !== null && records.length > 0);
        });
    }

    /**
     * API 응답 파싱
     * @param response HTTP 응답 문자열
     * @returns 파싱된 데이터 또는 null
     */
    private parseResponse<T>(response: string): T | null {
        const parsed = parseJsonString(response);
        if (parsed === false) {
            return null;
        }
        return parsed as T;
    }
}
