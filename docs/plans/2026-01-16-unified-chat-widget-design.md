# 통합 채팅 위젯 디자인

## 개요

기존에 분산된 채팅 UI들(낮 채팅, 죽은 자 채팅, 마피아 채팅, 연인 채팅)을 **하나의 통합 위젯**으로 합칩니다.

### 핵심 특징

- **탭 기반 채널 전환**: 상단에 탭 바로 채널 표시, 게임 상황에 따라 자동 전환 + 수동 전환 가능
- **동적 탭 표시**: 플레이어가 접근 가능한 채널만 탭으로 표시
- **채널별 색상 테마**: 각 채널마다 다른 네온 색상 적용
- **읽지 않은 메시지 알림**: 비활성 탭에 숫자 뱃지로 표시

### 채널별 색상

| 채널 | 색상 | 아이콘 | 용도 |
|------|------|--------|------|
| 낮 | 노랑 `#ffdd00` | ☀️ | 생존자 토론 |
| 마피아 | 핑크 `#ff2d95` | 🔪 | 마피아팀 비밀 대화 |
| 죽은자 | 보라 `#b026ff` | 💀 | 사망자 대화, 영매 접근 |
| 연인 | 로즈 `#ec4899` | 💕 | 연인끼리 대화 |

---

## 레이아웃 구조

### 위젯 위치
- **위치**: 화면 하단 고정
- **크기**: 데스크톱 40% 너비 / 모바일 100% 너비, 높이 35%
- **앵커**: `bottom`

### HTML 구조

```
┌─────────────────────────────────────────────┐
│  [☀️ 낮 (2)] [💀 죽은자] [🔪 마피아]        │  ← 탭 바
├─────────────────────────────────────────────┤
│                                             │
│  시스템: 채팅이 시작되었습니다               │
│                                             │
│                        ┌─────────────────┐  │
│                        │ 내 메시지       │  │  ← 메시지 영역
│                        └─────────────────┘  │
│  ┌─────────────────┐                        │
│  │ 홍길동: 안녕    │                        │
│  └─────────────────┘                        │
│                                             │
├─────────────────────────────────────────────┤
│  [메시지 입력...]                    [전송] │  ← 입력 영역
└─────────────────────────────────────────────┘
```

### 컴포넌트 구성
1. **탭 바** - 채널 전환, 뱃지 표시
2. **헤더** - 현재 채널명, 남은 시간 (낮 채팅일 때만)
3. **메시지 영역** - 스크롤 가능한 채팅 로그
4. **입력 영역** - 텍스트 입력 + 전송 버튼

---

## 채널 접근 규칙

### 플레이어별 채널 접근 권한

| 플레이어 상태 | 접근 가능 채널 | 쓰기 가능 | 기본 탭 |
|--------------|---------------|----------|--------|
| 살아있는 시민 | 낮 | 낮 | 낮 |
| 살아있는 마피아 | 낮, 마피아 | 낮, 마피아 | 낮→밤에 마피아 |
| 살아있는 스파이 (접선 전) | 낮 | 낮 | 낮 |
| 살아있는 스파이 (접선 후) | 낮, 마피아 | 낮, 마피아 | 낮→밤에 마피아 |
| 살아있는 마담 (마피아 유혹 후) | 낮, 마피아 | 낮, 마피아 | 낮→밤에 마피아 |
| 살아있는 연인 | 낮, 연인 | 낮, 연인 | 낮→밤에 연인 |
| 살아있는 영매 | 낮, 죽은자 | 낮, 죽은자(밤만) | 낮 |
| 길들여진 짐승인간 | 낮, 마피아 | 낮, 마피아 | 낮→밤에 마피아 |
| 죽은 플레이어 | 낮(읽기전용), 죽은자 | 죽은자만 | 죽은자 |
| 죽은 마피아 | 낮(읽기전용), 마피아(읽기전용), 죽은자 | 죽은자만 | 죽은자 |
| 죽은 연인 | 낮(읽기전용), 연인(읽기전용), 죽은자 | 죽은자만 | 죽은자 |

### 자동 전환 규칙

**낮 → 밤 전환 시**
- 마피아팀: 마피아 탭으로 자동 전환
- 연인: 연인 탭으로 자동 전환
- 영매: 죽은자 탭으로 자동 전환 (쓰기 가능해짐)
- 그 외: 채팅 위젯 숨김 (night_action 위젯 사용)

**밤 → 낮 전환 시**
- 모든 생존자: 낮 탭으로 자동 전환

**플레이어 사망 시**
- 기존 채널은 읽기 전용으로 유지
- 죽은자 탭 추가, 자동 전환

### 읽기 전용 표시
- 읽기 전용 채널 탭에 `👁` 아이콘 표시 (예: `[☀️ 낮 👁]`)
- 입력창 비활성화 + 안내 문구: "관전 모드입니다"

---

## 구현 계획

### 파일 변경

**새로 생성**
```
apps/mafia/res/widgets/unified_chat_widget.html  ← 통합 채팅 위젯
```

**삭제 (통합으로 대체)**
```
apps/mafia/res/widgets/day_chat_widget.html
apps/mafia/res/widgets/dead_chat_widget.html
```

**수정**
```
libs/core/mafia/managers/widget/WidgetType.ts    ← UNIFIED_CHAT 추가
libs/core/mafia/managers/widget/WidgetManager.ts ← 위젯 생성 변경
libs/core/mafia/managers/gameFlow/GameFlowManager.ts ← 채팅 로직 수정
apps/mafia/res/widgets/night_action.html         ← 내부 채팅 UI 제거
```

### 메시지 프로토콜

**서버 → 위젯**
```javascript
// 초기화
{ type: "init", channels: ["day", "mafia"], activeChannel: "day", myPlayerId: "...", ... }

// 채널 추가 (스파이 접선 성공 등)
{ type: "addChannel", channel: "mafia" }

// 채널 설정 (사망 시)
{ type: "setChannels", channels: ["day", "dead"], activeChannel: "dead", readOnly: ["day"] }

// 새 메시지
{ type: "newMessage", channel: "day", senderId: "...", senderName: "...", message: "...", timestamp: ... }

// 자동 채널 전환
{ type: "switchChannel", channel: "mafia" }

// 읽기 전용 모드 설정
{ type: "setReadOnly", channel: "dead", readOnly: true, reason: "밤에만 메시지를 보낼 수 있습니다" }
```

**위젯 → 서버**
```javascript
// 메시지 전송
{ type: "sendMessage", channel: "day", message: "안녕하세요" }

// 탭 전환 (사용자 수동)
{ type: "tabChanged", channel: "mafia" }
```

---

## UI 스타일

### 탭 바 디자인

```css
/* 탭 바 컨테이너 */
.tab-bar {
    display: flex;
    gap: 4px;
    padding: 8px 12px;
    background: var(--bg-base);
    border-bottom: 1px solid var(--border-subtle);
}

/* 개별 탭 */
.tab {
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.15s ease;
}

/* 채널별 색상 */
.tab.day       { color: #ffdd00; border: 1px solid rgba(255, 221, 0, 0.3); }
.tab.mafia     { color: #ff2d95; border: 1px solid rgba(255, 45, 149, 0.3); }
.tab.dead      { color: #b026ff; border: 1px solid rgba(176, 38, 255, 0.3); }
.tab.lover     { color: #ec4899; border: 1px solid rgba(236, 72, 153, 0.3); }

/* 활성 탭 */
.tab.active.day   { background: rgba(255, 221, 0, 0.15); box-shadow: 0 0 12px rgba(255, 221, 0, 0.3); }
.tab.active.mafia { background: rgba(255, 45, 149, 0.15); box-shadow: 0 0 12px rgba(255, 45, 149, 0.3); }
.tab.active.dead  { background: rgba(176, 38, 255, 0.15); box-shadow: 0 0 12px rgba(176, 38, 255, 0.3); }
.tab.active.lover { background: rgba(236, 72, 153, 0.15); box-shadow: 0 0 12px rgba(236, 72, 153, 0.3); }
```

### 뱃지 디자인

```css
.tab-badge {
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    background: var(--neon-pink);
    border-radius: 9px;
    font-size: 11px;
    font-weight: 700;
    color: var(--bg-base);
}

/* 읽기 전용 아이콘 */
.tab .read-only-icon {
    font-size: 11px;
    opacity: 0.7;
}
```

### 메시지 스타일

```css
/* 기본 메시지 */
.message {
    max-width: 85%;
    padding: 8px 12px;
    border-radius: 10px;
    animation: fadeIn 0.2s ease-out;
}

/* 내 메시지 - 채널 색상 적용 */
.message.mine.day   { background: linear-gradient(135deg, #ffdd00, #ccb100); color: #0a0a0f; }
.message.mine.mafia { background: linear-gradient(135deg, #ff2d95, #cc0055); color: #fff; }
.message.mine.dead  { background: linear-gradient(135deg, #b026ff, #8b1acc); color: #fff; }
.message.mine.lover { background: linear-gradient(135deg, #ec4899, #be185d); color: #fff; }

/* 다른 사람 메시지 */
.message.other {
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
}

/* 발신자 이름 - 채널 색상 */
.sender-name.day   { color: #ffdd00; }
.sender-name.mafia { color: #ff2d95; }
.sender-name.dead  { color: #b026ff; }
.sender-name.lover { color: #ec4899; }

/* 시스템 메시지 */
.message.system {
    align-self: center;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 20px;
    font-size: 12px;
    color: var(--text-muted);
}
```

### 입력 영역 (읽기 전용 모드)

```css
.input-container.read-only {
    background: rgba(255, 255, 255, 0.02);
    justify-content: center;
}

.read-only-notice {
    color: var(--text-muted);
    font-size: 13px;
    font-style: italic;
}
```

### 모바일 대응

```css
/* 모바일: 전체 너비 */
body.mobile .chat-container {
    width: 100%;
    border-radius: 0;
}

/* 탭 바 스크롤 가능 */
body.mobile .tab-bar {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

/* 입력창 iOS 줌 방지 */
body.mobile .chat-input {
    font-size: 16px;
}

/* Safe area 대응 */
body.mobile .input-container {
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
}
```

---

## night_action.html 변경사항

- 내부 채팅 UI (`.chat-container`) 완전 제거
- 마피아/연인 채팅은 통합 위젯에서 처리
- night_action은 순수하게 **능력 선택 UI**만 담당

---

## 구현 순서

1. `unified_chat_widget.html` 신규 생성
2. `WidgetType.ts`에 `UNIFIED_CHAT` 추가
3. `WidgetManager.ts` 위젯 생성 로직 수정
4. `GameFlowManager.ts` 채팅 관련 로직 통합 위젯으로 변경
5. `night_action.html`에서 채팅 UI 제거
6. 기존 `day_chat_widget.html`, `dead_chat_widget.html` 삭제
7. 테스트 및 버그 수정

---

## 요약

| 항목 | 결정 |
|-----|------|
| 전환 방식 | 탭 바 + 자동 전환 |
| 탭 표시 | 접근 가능한 채널만 표시 |
| 위치 | 화면 하단 고정 |
| 알림 | 숫자 뱃지 (읽지 않은 메시지 수) |
| 디자인 | 사이버펑크 + 채널별 네온 색상 |
| 사망 시 | 기존 채널 읽기 전용으로 유지 |

### 예상 변경 범위

- **신규 파일**: 1개
- **수정 파일**: 4개
- **삭제 파일**: 2개

---

## 날짜
2026-01-16
