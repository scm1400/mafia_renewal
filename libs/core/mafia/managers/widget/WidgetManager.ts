import { WidgetType } from "./WidgetType";
import { GamePlayer } from "../../types/GamePlayer";

/**
 * 위젯 인터페이스
 */
export interface IWidget {
    element: any; // ZepWidgetElement 타입 대신 any 사용
    widgetType: WidgetType;
    revealWidget: () => void;
    hideWidget: () => void;
    sendMessage: (message: any) => void;
    initialize: (data: any) => void;
    destroy: () => void;
    messageHandlers: Array<{
        id: number;  // 핸들러 고유 ID
        handler: (sender: GamePlayer, data: any) => void;  // 핸들러 함수
    }>;
    lastHandlerId: number;  // 핸들러 ID 생성용 카운터
}

/**
 * 위젯 관리자 클래스
 * 싱글톤 패턴을 적용하여 전역에서 접근 가능
 */
export class WidgetManager {
    /** 싱글톤 인스턴스 */
    private static _instance: WidgetManager;
    
    /** 플레이어별 위젯 풀 맵 */
    private playerWidgetMap: { [playerId: string]: { [widgetType: string]: IWidget } } = {};
    
    /**
     * 생성자 (private으로 외부에서 직접 인스턴스화 방지)
     */
    private constructor() {}
    
    /**
     * 싱글톤 인스턴스 접근자
     */
    public static get instance(): WidgetManager {
        if (!this._instance) {
            this._instance = new WidgetManager();
        }
        return this._instance;
    }
    
    /**
     * 플레이어의 위젯 풀 초기화
     * @param player 게임 플레이어
     */
    public initPlayerWidgets(player: GamePlayer): void {
        // 이미 초기화된 플레이어인지 확인
        if (this.playerWidgetMap[player.id]) {
            return;
        }
        
        // 플레이어용 위젯 맵 생성
        this.playerWidgetMap[player.id] = {};
        
        // 필요한 위젯들 생성 및 초기화
        this.createWidgets(player);
    }
    
    /**
     * 플레이어에 필요한 위젯 생성
     * @param player 게임 플레이어
     */
    private createWidgets(player: GamePlayer): void {
        // 위젯 맵 가져오기
        const widgetMap = this.playerWidgetMap[player.id];
        if (!widgetMap) return;

        // 각 위젯을 초기에 숨긴 상태로 생성
        // 공통 함수를 사용하여 중복 코드 제거
        this.createAndInitializeWidget(player, widgetMap, WidgetType.LOBBY, "widgets/lobby_widget.html", "middle");
        this.createAndInitializeWidget(player, widgetMap, WidgetType.ROOM, "widgets/room_widget.html", "middle");
        this.createAndInitializeWidget(player, widgetMap, WidgetType.GAME_STATUS, "widgets/game_status.html", "middleright");
        this.createAndInitializeWidget(player, widgetMap, WidgetType.NIGHT_ACTION, "widgets/night_action.html", "middle");
        this.createAndInitializeWidget(player, widgetMap, WidgetType.VOTE, "widgets/vote_widget.html", "middle");
        this.createAndInitializeWidget(player, widgetMap, WidgetType.FINAL_DEFENSE, "widgets/final_defense_widget.html", "middle");
        this.createAndInitializeWidget(player, widgetMap, WidgetType.APPROVAL_VOTE, "widgets/approval_vote_widget.html", "middle");
        this.createAndInitializeWidget(player, widgetMap, WidgetType.DEAD_CHAT, "widgets/dead_chat_widget.html", "middleright");
        this.createAndInitializeWidget(player, widgetMap, WidgetType.ROLE_CARD, "widgets/role_card.html", "middle");
        this.createAndInitializeWidget(player, widgetMap, WidgetType.GAME_MODE_SELECT, "widgets/game_mode_select.html", "middle");
    }

    /**
     * 위젯 생성 및 초기화를 위한 헬퍼 함수
     * @param player 게임 플레이어
     * @param widgetMap 위젯 맵
     * @param widgetType 위젯 타입
     * @param widgetPath 위젯 HTML 경로
     * @param anchor 위젯 앵커 위치
     */
    private createAndInitializeWidget(
        player: GamePlayer, 
        widgetMap: { [widgetType: string]: IWidget },
        widgetType: WidgetType,
        widgetPath: string,
        anchor: "popup" | "sidebar" | "top" | "topleft" | "topright" | "middle" | "middleleft" | "middleright" | "bottom" | "bottomleft" | "bottomright"
    ): void {
        // 위젯 생성
        const widget = player.showWidget(widgetPath, anchor, 0, 0);
        
        // 위젯을 즉시 숨김
        widget.sendMessage({ type: "setWidget", isMobile: player.isMobile, isTablet: player.isTablet });
        
        // 위젯 맵에 추가
        widgetMap[widgetType] = {
            element: widget,
            widgetType: widgetType,
            revealWidget: () => this.showWidget(player, widgetType),
            hideWidget: () => this.hideWidget(player, widgetType),
            sendMessage: (message) => widget.sendMessage(message),
            initialize: (data) => {},
            destroy: () => widget.destroy(),
            messageHandlers: [], // 메시지 핸들러 배열 초기화
            lastHandlerId: 0 // 핸들러 ID 카운터 초기화
        };
    }
    
    /**
     * 위젯 표시
     * @param player 게임 플레이어
     * @param widgetType 위젯 타입
     */
    public showWidget(player: GamePlayer, widgetType: WidgetType): void {
        const widgetMap = this.playerWidgetMap[player.id];
        if (!widgetMap) return;
        
        const widget = widgetMap[widgetType];
        if (!widget) return;
        
        // 기존 player.tag.widget에 위젯 참조 저장 (기존 코드와의 호환성 유지)
        if (!player.tag.widget) {
            player.tag.widget = {};
        }
        
        switch (widgetType) {
            case WidgetType.LOBBY:
                player.tag.widget.lobby = widget.element;
                break;
            case WidgetType.ROOM:
                player.tag.widget.room = widget.element;
                break;
            case WidgetType.GAME_STATUS:
                player.tag.widget.gameStatus = widget.element;
                break;
            case WidgetType.NIGHT_ACTION:
                player.tag.widget.nightAction = widget.element;
                break;
            case WidgetType.VOTE:
                player.tag.widget.voteWidget = widget.element;
                break;
            case WidgetType.FINAL_DEFENSE:
                player.tag.widget.finalDefense = widget.element;
                break;
            case WidgetType.APPROVAL_VOTE:
                player.tag.widget.approvalVote = widget.element;
                break;
            case WidgetType.DEAD_CHAT:
                player.tag.widget.deadChat = widget.element;
                break;
            case WidgetType.ROLE_CARD:
                player.tag.widget.roleCard = widget.element;
                break;
            case WidgetType.GAME_MODE_SELECT:
                player.tag.widget.gameModeSelect = widget.element;
                break;
            default:
                break;
        }
        
        widget.element.sendMessage({ type: "showWidget" });
        ScriptApp.sayToStaffs(`위젯 표시: ${widgetType} (플레이어: ${player.name})`);
    }
    
    /**
     * 위젯 숨김
     * @param player 게임 플레이어
     * @param widgetType 위젯 타입
     */
    public hideWidget(player: GamePlayer, widgetType: WidgetType): void {
        const widgetMap = this.playerWidgetMap[player.id];
        if (!widgetMap) return;
        
        const widget = widgetMap[widgetType];
        if (!widget) return;
        
        // player.tag.widget에서 참조 제거 (기존 코드와의 호환성 유지)
        if (player.tag.widget) {
            switch (widgetType) {
                case WidgetType.LOBBY:
                    player.tag.widget.lobby = null;
                    break;
                case WidgetType.ROOM:
                    player.tag.widget.room = null;
                    break;
                case WidgetType.GAME_STATUS:
                    player.tag.widget.gameStatus = null;
                    break;
                case WidgetType.NIGHT_ACTION:
                    player.tag.widget.nightAction = null;
                    break;
                case WidgetType.VOTE:
                    player.tag.widget.voteWidget = null;
                    break;
                case WidgetType.FINAL_DEFENSE:
                    player.tag.widget.finalDefense = null;
                    break;
                case WidgetType.APPROVAL_VOTE:
                    player.tag.widget.approvalVote = null;
                    break;
                case WidgetType.DEAD_CHAT:
                    player.tag.widget.deadChat = null;
                    break;
                case WidgetType.ROLE_CARD:
                    player.tag.widget.roleCard = null;
                    break;
                case WidgetType.GAME_MODE_SELECT:
                    player.tag.widget.gameModeSelect = null;
                    break;
                default:
                    break;
            }
        }
        
        widget.element.sendMessage({ type: "hideWidget" });
        ScriptApp.sayToStaffs(`위젯 숨김: ${widgetType} (플레이어: ${player.name})`);
    }
    
    /**
     * 모든 위젯 숨김
     * @param player 게임 플레이어
     */
    public hideAllWidgets(player: GamePlayer): void {
        const widgetMap = this.playerWidgetMap[player.id];
        if (!widgetMap) return;
        
        // 모든 위젯 순회하며 숨기기
        Object.values(widgetMap).forEach(widget => {
            widget.element.sendMessage({ type: "hideWidget" });
        });
        ScriptApp.sayToStaffs(`모든 위젯 숨김 (플레이어: ${player.name})`);
    }
    
    /**
     * 위젯에 메시지 전송
     * @param player 게임 플레이어
     * @param widgetType 위젯 타입
     * @param message 전송할 메시지
     */
    public sendMessageToWidget(player: GamePlayer, widgetType: WidgetType, message: any): void {
        const widgetMap = this.playerWidgetMap[player.id];
        if (!widgetMap) return;
        
        const widget = widgetMap[widgetType];
        if (!widget) return;
        
        widget.element.sendMessage(message);
    }
    
    /**
     * 위젯 초기화
     * @param player 게임 플레이어
     * @param widgetType 위젯 타입
     * @param data 초기화 데이터
     */
    public initializeWidget(player: GamePlayer, widgetType: WidgetType, data: any): void {
        const widgetMap = this.playerWidgetMap[player.id];
        if (!widgetMap) return;
        
        const widget = widgetMap[widgetType];
        if (!widget) return;
        
        widget.initialize(data);
    }
    
    /**
     * 위젯에 메시지 핸들러 등록
     * @param player 게임 플레이어
     * @param widgetType 위젯 타입
     * @param callback 메시지 핸들러 콜백 함수
     * @returns 핸들러 ID 또는 -1 (등록 실패 시)
     */
    public registerMessageHandler(
        player: GamePlayer, 
        widgetType: WidgetType, 
        callback: (sender: GamePlayer, data: any) => void
    ): number {
        const widgetMap = this.playerWidgetMap[player.id];
        if (!widgetMap) return -1;
        
        const widget = widgetMap[widgetType];
        if (!widget) return -1;
        
        // 핸들러 ID 생성
        const handlerId = ++widget.lastHandlerId;
        
        // 핸들러 래퍼 함수 생성
        const handlerWrapper = (sender: GamePlayer, data: any) => {
            callback(sender, data);
        };
        
        // 핸들러 배열에 추가
        widget.messageHandlers.push({
            id: handlerId,
            handler: handlerWrapper
        });
        
        // 실제 위젯에 핸들러 등록
        widget.element.onMessage.Add(handlerWrapper);
        
        return handlerId;
    }
    
    /**
     * 위젯의 모든 메시지 핸들러 제거
     * @param player 게임 플레이어
     * @param widgetType 위젯 타입
     */
    public clearMessageHandlers(player: GamePlayer, widgetType: WidgetType): void {
        const widgetMap = this.playerWidgetMap[player.id];
        if (!widgetMap) return;
        
        const widget = widgetMap[widgetType];
        if (!widget) return;
        
        // 모든 핸들러 제거
        widget.messageHandlers.forEach(handlerInfo => {
            // ZEP API에서 핸들러 제거
            widget.element.onMessage.Remove(handlerInfo.handler);
        });
        
        // 핸들러 배열 초기화
        widget.messageHandlers = [];
        
        ScriptApp.sayToStaffs(`위젯 핸들러 모두 제거: ${widgetType} (플레이어: ${player.name})`);
    }
    
    /**
     * 위젯의 특정 메시지 핸들러 제거
     * @param player 게임 플레이어
     * @param widgetType 위젯 타입
     * @param handlerId 제거할 핸들러 ID
     * @returns 제거 성공 여부
     */
    public removeMessageHandler(player: GamePlayer, widgetType: WidgetType, handlerId: number): boolean {
        const widgetMap = this.playerWidgetMap[player.id];
        if (!widgetMap) return false;
        
        const widget = widgetMap[widgetType];
        if (!widget) return false;
        
        // 핸들러 ID로 찾기
        const handlerIndex = widget.messageHandlers.findIndex(info => info.id === handlerId);
        if (handlerIndex === -1) return false;
        
        // 핸들러 정보 가져오기
        const handlerInfo = widget.messageHandlers[handlerIndex];
        
        // ZEP API에서 핸들러 제거
        widget.element.onMessage.Remove(handlerInfo.handler);
        
        // 배열에서 핸들러 제거
        widget.messageHandlers.splice(handlerIndex, 1);
        
        ScriptApp.sayToStaffs(`위젯 핸들러 제거: ${widgetType}, ID: ${handlerId} (플레이어: ${player.name})`);
        return true;
    }
    
    /**
     * 플레이어의 모든 위젯 정리 (제거 대신 숨김 - 오브젝트 풀 패턴)
     * @param player 게임 플레이어
     */
    public cleanupPlayerWidgets(player: GamePlayer): void {
        const widgetMap = this.playerWidgetMap[player.id];
        if (!widgetMap) return;
        
        // 모든 위젯 순회하며 숨김
        Array.from(Object.entries(widgetMap)).forEach(([type, widget]) => {
            // 위젯에 hideWidget 메시지 전송
            widget.element.sendMessage({
                type: "hideWidget"
            });
            
            // 모든 메시지 핸들러 제거
            this.clearMessageHandlers(player, widget.widgetType);
        });
        
        // player.tag.widget에서 모든 위젯 참조 제거 (기존 코드와의 호환성 유지)
        if (player.tag && player.tag.widget) {
            // 모든 위젯 필드 초기화
            player.tag.widget.lobby = null;
            player.tag.widget.room = null;
            player.tag.widget.gameStatus = null;
            player.tag.widget.nightAction = null;
            player.tag.widget.voteWidget = null;
            player.tag.widget.finalDefense = null;
            player.tag.widget.approvalVote = null;
            player.tag.widget.deadChat = null; 
            player.tag.widget.roleCard = null;
            player.tag.widget.gameModeSelect = null;
        }
        
        ScriptApp.sayToStaffs(`위젯 정리 완료 (플레이어: ${player.name})`);
    }
    
    /**
     * 특정 위젯 가져오기
     * @param player 게임 플레이어
     * @param widgetType 위젯 타입
     * @returns 위젯 인스턴스 또는 undefined
     */
    public getWidget(player: GamePlayer, widgetType: WidgetType): IWidget | undefined {
        const widgetMap = this.playerWidgetMap[player.id];
        if (!widgetMap) return undefined;
        
        return widgetMap[widgetType];
    }
} 