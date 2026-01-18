/**
 * 유저 상태 열거형
 */
export enum UserStatus {
    LOBBY = "lobby",       // 로비 대기 중
    IN_ROOM = "in_room",   // 방에서 대기 중
    IN_GAME = "in_game"    // 게임 중
}

/**
 * 유저 프로필 데이터 인터페이스
 */
export interface IUserProfileData {
    id: string;              // 플레이어 ID
    name: string;            // 닉네임
    profileImage: string;    // 프로필 이미지 URL
    status: UserStatus;      // 현재 상태
    roomId?: string;         // 방에 있을 경우 방 ID
    roomTitle?: string;      // 방 제목 (빠른 입장용)
}

/**
 * 친구 요청 상태
 */
export type FriendRequestStatus = "pending" | "accepted";

/**
 * 친구 레코드 인터페이스 (Supabase 테이블 구조)
 */
export interface FriendRecord {
    id: string;                    // UUID PK
    requester_id: string;          // 요청자 ZEP 플레이어 ID
    receiver_id: string;           // 수신자 ZEP 플레이어 ID
    status: FriendRequestStatus;   // 상태
    created_at: string;            // 생성 시간
}

/**
 * 친구 요청 정보 (위젯에서 사용)
 */
export interface FriendRequest {
    id: string;           // 요청 레코드 ID
    fromId: string;       // 요청자 ID
    fromName: string;     // 요청자 닉네임
    fromImage: string;    // 요청자 프로필 이미지
    createdAt: string;    // 요청 시간
}

/**
 * 유저 목록 초기화 데이터
 */
export interface UserListInitData {
    onlineTracker: Record<string, IUserProfileData>;  // 온라인 유저 목록
    friendList: string[];                              // 친구 ID 목록
    pendingRequests: FriendRequest[];                  // 대기 중인 친구 요청
    myId: string;                                      // 현재 플레이어 ID
}

/**
 * 오프라인 친구 프로필 (Supabase에서 조회)
 */
export interface OfflineFriendProfile {
    id: string;
    name: string;
    profileImage: string;
}
