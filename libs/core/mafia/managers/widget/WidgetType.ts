/**
 * 게임에서 사용하는 위젯 타입 열거형
 */
export enum WidgetType {
    // 로비 위젯
    LOBBY_NAVBAR = "LOBBY_NAVBAR",  // 로비 네비게이션 바
    LOBBY = "LOBBY",                 // 방 목록 팝업
    LOBBY_CHAT = "LOBBY_CHAT",       // 로비 채팅

    // 기본 위젯
    GAME_STATUS = "GAME_STATUS",

    // 게임 플레이 관련 위젯
    NIGHT_ACTION = "NIGHT_ACTION",
    VOTE = "VOTE",
    FINAL_DEFENSE = "FINAL_DEFENSE",
    APPROVAL_VOTE = "APPROVAL_VOTE",

    // 추가 기능 위젯
    DEAD_CHAT = "DEAD_CHAT",      // deprecated - 추후 삭제
    ROLE_CARD = "ROLE_CARD",
    DAY_CHAT = "DAY_CHAT",        // deprecated - 추후 삭제
    UNIFIED_CHAT = "UNIFIED_CHAT", // 통합 채팅 위젯
    USER_LIST = "USER_LIST",       // 유저 목록 위젯
} 