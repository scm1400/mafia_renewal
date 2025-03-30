/**
 * 게임에서 사용하는 위젯 타입 열거형
 */
export enum WidgetType {
    // 기본 위젯
    LOBBY = "LOBBY",
    ROOM = "ROOM",
    GAME_STATUS = "GAME_STATUS",
    
    // 게임 플레이 관련 위젯
    NIGHT_ACTION = "NIGHT_ACTION",
    VOTE = "VOTE",
    FINAL_DEFENSE = "FINAL_DEFENSE",
    APPROVAL_VOTE = "APPROVAL_VOTE",
    
    // 추가 기능 위젯
    DEAD_CHAT = "DEAD_CHAT",
    ROLE_CARD = "ROLE_CARD",
    DAY_CHAT = "DAY_CHAT",
} 