import { ScriptWidget } from "zep-script";
import { WidgetType } from "./WidgetType";

/**
 * 위젯 인터페이스
 * 모든 위젯은 이 인터페이스를 구현해야 함
 */
export interface IWidget {
    /** 위젯의 HTML 요소 */
    element: ScriptWidget;
    
    /** 위젯 타입 */
    widgetType: WidgetType;
    
    /**
     * 위젯을 표시
     */
    revealWidget(): void;
    
    /**
     * 위젯을 숨김
     */
    hideWidget(): void;
    
    /**
     * 위젯에 메시지 전송
     * @param message 전송할 메시지
     */
    sendMessage(message: any): void;
    
    /**
     * 위젯 초기화
     * @param data 초기화 데이터
     */
    initialize(data: any): void;
    
    /**
     * 위젯 파괴
     */
    destroy(): void;
} 