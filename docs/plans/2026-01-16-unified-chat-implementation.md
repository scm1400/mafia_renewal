# 통합 채팅 위젯 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 분산된 채팅 UI(낮/죽은자/마피아/연인)를 하나의 탭 기반 통합 위젯으로 합친다.

**Architecture:** 단일 HTML 위젯이 모든 채팅 채널을 관리. 서버(GameFlowManager)가 채널 접근 권한과 메시지를 제어하고, 위젯은 탭 UI와 메시지 렌더링만 담당.

**Tech Stack:** ZEP Script (TypeScript), HTML/CSS/JS 위젯, 기존 사이버펑크 디자인 시스템

**참고 문서:** `docs/plans/2026-01-16-unified-chat-widget-design.md`

---

## Task 1: WidgetType 열거형에 UNIFIED_CHAT 추가

**Files:**
- Modify: `libs/core/mafia/managers/widget/WidgetType.ts`

**Step 1: WidgetType에 UNIFIED_CHAT 추가**

```typescript
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
    DEAD_CHAT = "DEAD_CHAT",      // deprecated - 추후 삭제
    ROLE_CARD = "ROLE_CARD",
    DAY_CHAT = "DAY_CHAT",        // deprecated - 추후 삭제
    UNIFIED_CHAT = "UNIFIED_CHAT", // 통합 채팅 위젯
}
```

**Step 2: 커밋**

```bash
git add libs/core/mafia/managers/widget/WidgetType.ts
git commit -m "feat: add UNIFIED_CHAT to WidgetType enum"
```

---

## Task 2: 통합 채팅 위젯 HTML 파일 생성 - 기본 구조

**Files:**
- Create: `apps/mafia/res/widgets/unified_chat_widget.html`

**Step 1: 기본 HTML 구조 및 CSS 변수 작성**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>통합 채팅</title>
    <style>
        /* Design System Variables */
        :root {
            --sat: env(safe-area-inset-top);
            --sar: env(safe-area-inset-right);
            --sab: env(safe-area-inset-bottom);
            --sal: env(safe-area-inset-left);

            /* Channel Colors */
            --channel-day: #ffdd00;
            --channel-day-dark: #ccb100;
            --channel-mafia: #ff2d95;
            --channel-mafia-dark: #cc0055;
            --channel-dead: #b026ff;
            --channel-dead-dark: #8b1acc;
            --channel-lover: #ec4899;
            --channel-lover-dark: #be185d;

            /* Background */
            --bg-base: #0a0a0f;
            --bg-surface: #12121a;
            --bg-elevated: #1a1a25;

            /* Text */
            --text-primary: #ffffff;
            --text-secondary: #a0a0b0;
            --text-muted: #606070;

            /* Border */
            --border-subtle: rgba(255, 255, 255, 0.05);
            --border-default: rgba(255, 255, 255, 0.1);

            /* Spacing */
            --space-xs: 4px;
            --space-sm: 8px;
            --space-md: 12px;
            --space-lg: 16px;

            /* Radius */
            --radius-sm: 6px;
            --radius-md: 10px;
            --radius-lg: 14px;
            --radius-full: 9999px;

            /* Typography */
            --font-family: 'Pretendard', 'Pretendard JP', -apple-system, BlinkMacSystemFont, sans-serif;

            /* Transition */
            --transition-fast: 0.15s ease;
        }

        /* Base Reset */
        * { margin: 0; padding: 0; box-sizing: border-box; }

        html, body {
            width: 100%;
            height: 100%;
            font-family: var(--font-family);
            font-size: 14px;
            color: var(--text-primary);
            background: transparent;
            overflow: hidden;
        }

        body {
            display: flex;
            user-select: none;
            -webkit-user-select: none;
            -webkit-font-smoothing: antialiased;
        }
    </style>
</head>
<body>
    <div class="chat-container" id="chatContainer">
        <!-- 탭 바 -->
        <div class="tab-bar" id="tabBar"></div>

        <!-- 메시지 영역 -->
        <div class="chat-messages" id="chatMessages"></div>

        <!-- 입력 영역 -->
        <div class="input-container" id="inputContainer">
            <input type="text" class="chat-input" id="chatInput" placeholder="메시지 입력..." maxlength="200">
            <button class="send-button" id="sendButton">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/>
                </svg>
            </button>
        </div>

        <!-- 읽기 전용 안내 -->
        <div class="read-only-notice" id="readOnlyNotice" style="display: none;">
            <span id="readOnlyText">관전 모드입니다</span>
        </div>
    </div>

    <script>
        // 기본 상태
        let state = {
            myPlayerId: '',
            channels: [],           // 접근 가능한 채널 목록
            activeChannel: 'day',   // 현재 활성 채널
            readOnlyChannels: [],   // 읽기 전용 채널 목록
            messages: {},           // 채널별 메시지 { day: [], mafia: [], ... }
            unreadCounts: {},       // 채널별 읽지 않은 메시지 수
            isMobile: false,
            isTablet: false
        };

        // 초기화 - 나중에 구현
        function initialize(data) {
            console.log('Initialize unified chat:', data);
        }

        // 메시지 핸들러
        window.addEventListener('message', function(e) {
            const data = e.data;
            if (!data || !data.type) return;

            switch (data.type) {
                case 'setWidget':
                    state.isMobile = data.isMobile || false;
                    state.isTablet = data.isTablet || false;
                    if (state.isMobile && !state.isTablet) {
                        document.body.classList.add('mobile');
                    }
                    hideWidget();
                    break;
                case 'init':
                    initialize(data);
                    break;
                case 'hideWidget':
                    hideWidget();
                    break;
                case 'showWidget':
                    revealWidget();
                    break;
            }
        });

        function hideWidget() {
            window.parent.postMessage({ type: 'WidgetRearrange', anchor: 'bottom', width: '0', height: '0' }, '*');
        }

        function revealWidget() {
            if (state.isMobile && !state.isTablet) {
                window.parent.postMessage({ type: 'WidgetRearrange', anchor: 'bottom', width: '100%', height: '35%' }, '*');
            } else {
                window.parent.postMessage({ type: 'WidgetRearrange', anchor: 'bottom', width: '40%', height: '35%' }, '*');
            }
        }
    </script>
</body>
</html>
```

**Step 2: 커밋**

```bash
git add apps/mafia/res/widgets/unified_chat_widget.html
git commit -m "feat: create unified chat widget base structure"
```

---

## Task 3: 통합 채팅 위젯 - 탭 바 CSS 및 렌더링

**Files:**
- Modify: `apps/mafia/res/widgets/unified_chat_widget.html`

**Step 1: 탭 바 CSS 추가** (style 태그 안에 추가)

```css
/* Chat Container */
.chat-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: linear-gradient(180deg, rgba(18, 18, 26, 0.98) 0%, rgba(10, 10, 15, 0.98) 100%);
    border-top: 1px solid var(--border-default);
}

/* Tab Bar */
.tab-bar {
    display: flex;
    gap: var(--space-xs);
    padding: var(--space-sm) var(--space-md);
    background: var(--bg-base);
    border-bottom: 1px solid var(--border-subtle);
    overflow-x: auto;
    flex-shrink: 0;
}

.tab-bar::-webkit-scrollbar { height: 0; }

.tab {
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    transition: all var(--transition-fast);
    white-space: nowrap;
    flex-shrink: 0;
}

/* Channel Colors */
.tab.day { color: var(--channel-day); border: 1px solid rgba(255, 221, 0, 0.3); }
.tab.mafia { color: var(--channel-mafia); border: 1px solid rgba(255, 45, 149, 0.3); }
.tab.dead { color: var(--channel-dead); border: 1px solid rgba(176, 38, 255, 0.3); }
.tab.lover { color: var(--channel-lover); border: 1px solid rgba(236, 72, 153, 0.3); }

/* Active Tab */
.tab.active.day { background: rgba(255, 221, 0, 0.15); box-shadow: 0 0 12px rgba(255, 221, 0, 0.3); }
.tab.active.mafia { background: rgba(255, 45, 149, 0.15); box-shadow: 0 0 12px rgba(255, 45, 149, 0.3); }
.tab.active.dead { background: rgba(176, 38, 255, 0.15); box-shadow: 0 0 12px rgba(176, 38, 255, 0.3); }
.tab.active.lover { background: rgba(236, 72, 153, 0.15); box-shadow: 0 0 12px rgba(236, 72, 153, 0.3); }

/* Badge */
.tab-badge {
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    background: var(--channel-mafia);
    border-radius: 9px;
    font-size: 11px;
    font-weight: 700;
    color: var(--bg-base);
    display: flex;
    align-items: center;
    justify-content: center;
}

.read-only-icon {
    font-size: 11px;
    opacity: 0.7;
}
```

**Step 2: 탭 렌더링 JavaScript 추가**

```javascript
const CHANNEL_CONFIG = {
    day: { icon: '☀️', name: '낮', color: 'day' },
    mafia: { icon: '🔪', name: '마피아', color: 'mafia' },
    dead: { icon: '💀', name: '죽은자', color: 'dead' },
    lover: { icon: '💕', name: '연인', color: 'lover' }
};

function renderTabs() {
    const tabBar = document.getElementById('tabBar');
    tabBar.innerHTML = '';

    state.channels.forEach(channel => {
        const config = CHANNEL_CONFIG[channel];
        if (!config) return;

        const tab = document.createElement('div');
        tab.className = `tab ${config.color} ${state.activeChannel === channel ? 'active' : ''}`;
        tab.dataset.channel = channel;
        tab.onclick = () => switchChannel(channel);

        let html = `<span>${config.icon}</span><span>${config.name}</span>`;

        // 읽기 전용 아이콘
        if (state.readOnlyChannels.includes(channel)) {
            html += `<span class="read-only-icon">👁</span>`;
        }

        // 읽지 않은 메시지 뱃지
        const unread = state.unreadCounts[channel] || 0;
        if (unread > 0 && state.activeChannel !== channel) {
            html += `<span class="tab-badge">${unread > 99 ? '99+' : unread}</span>`;
        }

        tab.innerHTML = html;
        tabBar.appendChild(tab);
    });
}

function switchChannel(channel) {
    if (!state.channels.includes(channel)) return;

    state.activeChannel = channel;
    state.unreadCounts[channel] = 0;

    renderTabs();
    renderMessages();
    updateInputState();

    // 서버에 탭 전환 알림
    window.parent.postMessage({ type: 'tabChanged', channel: channel }, '*');
}
```

**Step 3: 커밋**

```bash
git add apps/mafia/res/widgets/unified_chat_widget.html
git commit -m "feat: add tab bar rendering to unified chat"
```

---

## Task 4: 통합 채팅 위젯 - 메시지 영역 CSS 및 렌더링

**Files:**
- Modify: `apps/mafia/res/widgets/unified_chat_widget.html`

**Step 1: 메시지 영역 CSS 추가**

```css
/* Messages Area */
.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    min-height: 0;
}

.chat-messages::-webkit-scrollbar { width: 4px; }
.chat-messages::-webkit-scrollbar-track { background: transparent; }
.chat-messages::-webkit-scrollbar-thumb { background: var(--bg-elevated); border-radius: var(--radius-full); }

/* Message */
.message {
    max-width: 85%;
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-md);
    animation: fadeIn 0.2s ease-out;
    word-break: break-word;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
}

/* My Message - Channel Colors */
.message.mine { align-self: flex-end; }
.message.mine.day { background: linear-gradient(135deg, var(--channel-day), var(--channel-day-dark)); color: var(--bg-base); }
.message.mine.mafia { background: linear-gradient(135deg, var(--channel-mafia), var(--channel-mafia-dark)); color: var(--text-primary); }
.message.mine.dead { background: linear-gradient(135deg, var(--channel-dead), var(--channel-dead-dark)); color: var(--text-primary); }
.message.mine.lover { background: linear-gradient(135deg, var(--channel-lover), var(--channel-lover-dark)); color: var(--text-primary); }

/* Other Message */
.message.other {
    align-self: flex-start;
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
}

/* Sender Name - Channel Colors */
.sender-name { font-size: 11px; font-weight: 600; margin-bottom: 2px; }
.sender-name.day { color: var(--channel-day); }
.sender-name.mafia { color: var(--channel-mafia); }
.sender-name.dead { color: var(--channel-dead); }
.sender-name.lover { color: var(--channel-lover); }

.message-content { font-size: 14px; line-height: 1.4; }
.message-time { font-size: 10px; color: rgba(255, 255, 255, 0.5); text-align: right; margin-top: 2px; }
.message.mine .message-time { color: rgba(0, 0, 0, 0.5); }
.message.mine.mafia .message-time,
.message.mine.dead .message-time,
.message.mine.lover .message-time { color: rgba(255, 255, 255, 0.5); }

/* System Message */
.message.system {
    align-self: center;
    max-width: 90%;
    padding: var(--space-xs) var(--space-md);
    background: rgba(255, 255, 255, 0.05);
    border-radius: var(--radius-full);
    font-size: 12px;
    color: var(--text-muted);
    text-align: center;
}
```

**Step 2: 메시지 렌더링 JavaScript 추가**

```javascript
function renderMessages() {
    const container = document.getElementById('chatMessages');
    container.innerHTML = '';

    const messages = state.messages[state.activeChannel] || [];

    messages.forEach(msg => {
        const messageEl = document.createElement('div');

        if (msg.isSystem) {
            messageEl.className = 'message system';
            messageEl.textContent = msg.message;
        } else {
            const isMine = msg.senderId === state.myPlayerId;
            messageEl.className = `message ${isMine ? 'mine' : 'other'} ${state.activeChannel}`;

            let html = '';
            if (!isMine) {
                html += `<div class="sender-name ${state.activeChannel}">${escapeHtml(msg.senderName)}</div>`;
            }
            html += `<div class="message-content">${escapeHtml(msg.message)}</div>`;

            if (msg.timestamp) {
                const date = new Date(msg.timestamp);
                const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                html += `<div class="message-time">${timeStr}</div>`;
            }

            messageEl.innerHTML = html;
        }

        container.appendChild(messageEl);
    });

    scrollToBottom();
}

function addMessage(channel, messageData) {
    if (!state.messages[channel]) {
        state.messages[channel] = [];
    }

    state.messages[channel].push(messageData);

    // 현재 채널이면 바로 렌더링
    if (channel === state.activeChannel) {
        renderMessages();
    } else {
        // 다른 채널이면 읽지 않은 메시지 수 증가
        state.unreadCounts[channel] = (state.unreadCounts[channel] || 0) + 1;
        renderTabs();
    }
}

function scrollToBottom() {
    const container = document.getElementById('chatMessages');
    container.scrollTop = container.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

**Step 3: 커밋**

```bash
git add apps/mafia/res/widgets/unified_chat_widget.html
git commit -m "feat: add message rendering to unified chat"
```

---

## Task 5: 통합 채팅 위젯 - 입력 영역 및 전송 기능

**Files:**
- Modify: `apps/mafia/res/widgets/unified_chat_widget.html`

**Step 1: 입력 영역 CSS 추가**

```css
/* Input Container */
.input-container {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-md);
    background: var(--bg-surface);
    border-top: 1px solid var(--border-subtle);
    flex-shrink: 0;
}

.chat-input {
    flex: 1;
    height: 40px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    padding: 0 var(--space-md);
    color: var(--text-primary);
    font-family: var(--font-family);
    font-size: 14px;
    outline: none;
    transition: border-color var(--transition-fast);
}

.chat-input:focus { border-color: var(--channel-day); }
.chat-input::placeholder { color: var(--text-muted); }
.chat-input:disabled { opacity: 0.5; cursor: not-allowed; }

/* Dynamic border color based on active channel */
.chat-container.channel-day .chat-input:focus { border-color: var(--channel-day); }
.chat-container.channel-mafia .chat-input:focus { border-color: var(--channel-mafia); }
.chat-container.channel-dead .chat-input:focus { border-color: var(--channel-dead); }
.chat-container.channel-lover .chat-input:focus { border-color: var(--channel-lover); }

.send-button {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, var(--channel-day), var(--channel-day-dark));
    border: none;
    border-radius: var(--radius-md);
    color: var(--bg-base);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-fast);
    flex-shrink: 0;
}

.send-button:hover:not(:disabled) { transform: scale(1.05); }
.send-button:disabled { background: var(--bg-elevated); cursor: not-allowed; opacity: 0.5; }
.send-button svg { width: 18px; height: 18px; }

/* Dynamic button color based on active channel */
.chat-container.channel-day .send-button { background: linear-gradient(135deg, var(--channel-day), var(--channel-day-dark)); color: var(--bg-base); }
.chat-container.channel-mafia .send-button { background: linear-gradient(135deg, var(--channel-mafia), var(--channel-mafia-dark)); color: var(--text-primary); }
.chat-container.channel-dead .send-button { background: linear-gradient(135deg, var(--channel-dead), var(--channel-dead-dark)); color: var(--text-primary); }
.chat-container.channel-lover .send-button { background: linear-gradient(135deg, var(--channel-lover), var(--channel-lover-dark)); color: var(--text-primary); }

/* Read-only Notice */
.read-only-notice {
    display: none;
    align-items: center;
    justify-content: center;
    padding: var(--space-md);
    background: rgba(255, 255, 255, 0.02);
    border-top: 1px solid var(--border-subtle);
    font-size: 13px;
    color: var(--text-muted);
    font-style: italic;
    flex-shrink: 0;
}

.read-only-notice.visible { display: flex; }

/* Mobile */
body.mobile .chat-container { width: 100%; }
body.mobile .chat-input { font-size: 16px; }
body.mobile .input-container { padding-bottom: calc(var(--space-md) + var(--sab)); }
```

**Step 2: 입력 및 전송 JavaScript 추가**

```javascript
function updateInputState() {
    const chatContainer = document.getElementById('chatContainer');
    const inputContainer = document.getElementById('inputContainer');
    const readOnlyNotice = document.getElementById('readOnlyNotice');
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');

    // 채널별 클래스 업데이트
    chatContainer.className = `chat-container channel-${state.activeChannel}`;

    const isReadOnly = state.readOnlyChannels.includes(state.activeChannel);

    if (isReadOnly) {
        inputContainer.style.display = 'none';
        readOnlyNotice.classList.add('visible');
        document.getElementById('readOnlyText').textContent = '관전 모드입니다';
    } else {
        inputContainer.style.display = 'flex';
        readOnlyNotice.classList.remove('visible');
        chatInput.disabled = false;
        sendButton.disabled = false;
    }
}

function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();

    if (!message) return;
    if (state.readOnlyChannels.includes(state.activeChannel)) return;

    // 서버로 메시지 전송
    window.parent.postMessage({
        type: 'sendMessage',
        channel: state.activeChannel,
        message: message
    }, '*');

    chatInput.value = '';
}

// 이벤트 리스너 설정
document.getElementById('sendButton').addEventListener('click', sendMessage);
document.getElementById('chatInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        window.parent.focus();
    }
});
```

**Step 3: 커밋**

```bash
git add apps/mafia/res/widgets/unified_chat_widget.html
git commit -m "feat: add input and send functionality to unified chat"
```

---

## Task 6: 통합 채팅 위젯 - 초기화 및 메시지 핸들러 완성

**Files:**
- Modify: `apps/mafia/res/widgets/unified_chat_widget.html`

**Step 1: initialize 함수 및 메시지 핸들러 완성**

```javascript
function initialize(data) {
    state.myPlayerId = data.myPlayerId || '';
    state.channels = data.channels || ['day'];
    state.activeChannel = data.activeChannel || state.channels[0];
    state.readOnlyChannels = data.readOnlyChannels || [];
    state.messages = {};
    state.unreadCounts = {};

    // 채널별 메시지 초기화
    state.channels.forEach(channel => {
        state.messages[channel] = [];
        state.unreadCounts[channel] = 0;
    });

    // 기존 메시지가 있으면 로드
    if (data.messages) {
        Object.keys(data.messages).forEach(channel => {
            state.messages[channel] = data.messages[channel] || [];
        });
    }

    renderTabs();
    renderMessages();
    updateInputState();
    revealWidget();
}

// 메시지 핸들러 업데이트
window.addEventListener('message', function(e) {
    const data = e.data;
    if (!data || !data.type) return;

    switch (data.type) {
        case 'setWidget':
            state.isMobile = data.isMobile || false;
            state.isTablet = data.isTablet || false;
            if (state.isMobile && !state.isTablet) {
                document.body.classList.add('mobile');
            }
            hideWidget();
            break;

        case 'init':
            initialize(data);
            break;

        case 'hideWidget':
            hideWidget();
            break;

        case 'showWidget':
            revealWidget();
            break;

        case 'newMessage':
            addMessage(data.channel, {
                senderId: data.senderId,
                senderName: data.senderName,
                message: data.message,
                timestamp: data.timestamp || Date.now(),
                isSystem: false
            });
            break;

        case 'systemMessage':
            addMessage(data.channel || state.activeChannel, {
                message: data.message,
                isSystem: true
            });
            break;

        case 'addChannel':
            if (!state.channels.includes(data.channel)) {
                state.channels.push(data.channel);
                state.messages[data.channel] = [];
                state.unreadCounts[data.channel] = 0;
                renderTabs();
            }
            break;

        case 'removeChannel':
            const idx = state.channels.indexOf(data.channel);
            if (idx !== -1) {
                state.channels.splice(idx, 1);
                if (state.activeChannel === data.channel) {
                    state.activeChannel = state.channels[0] || 'day';
                    renderMessages();
                    updateInputState();
                }
                renderTabs();
            }
            break;

        case 'setChannels':
            state.channels = data.channels || [];
            state.readOnlyChannels = data.readOnlyChannels || [];
            if (data.activeChannel) {
                state.activeChannel = data.activeChannel;
            } else if (!state.channels.includes(state.activeChannel)) {
                state.activeChannel = state.channels[0];
            }
            // 새 채널에 대한 메시지 배열 초기화
            state.channels.forEach(ch => {
                if (!state.messages[ch]) state.messages[ch] = [];
                if (!state.unreadCounts[ch]) state.unreadCounts[ch] = 0;
            });
            renderTabs();
            renderMessages();
            updateInputState();
            break;

        case 'switchChannel':
            if (state.channels.includes(data.channel)) {
                switchChannel(data.channel);
            }
            break;

        case 'setReadOnly':
            if (data.readOnly && !state.readOnlyChannels.includes(data.channel)) {
                state.readOnlyChannels.push(data.channel);
            } else if (!data.readOnly) {
                const roIdx = state.readOnlyChannels.indexOf(data.channel);
                if (roIdx !== -1) state.readOnlyChannels.splice(roIdx, 1);
            }
            if (data.reason) {
                document.getElementById('readOnlyText').textContent = data.reason;
            }
            renderTabs();
            updateInputState();
            break;

        case 'focusInput':
            document.getElementById('chatInput').focus();
            break;
    }
});
```

**Step 2: 커밋**

```bash
git add apps/mafia/res/widgets/unified_chat_widget.html
git commit -m "feat: complete unified chat widget initialization and message handlers"
```

---

## Task 7: WidgetManager에 통합 채팅 위젯 등록

**Files:**
- Modify: `libs/core/mafia/managers/widget/WidgetManager.ts`

**Step 1: createWidgets 함수에 UNIFIED_CHAT 추가**

`createWidgets` 함수 내에서 기존 DAY_CHAT, DEAD_CHAT 생성 라인 아래에 추가:

```typescript
this.createAndInitializeWidget(player, widgetMap, WidgetType.UNIFIED_CHAT, "widgets/unified_chat_widget.html", "bottom");
```

**Step 2: showWidget 함수에 UNIFIED_CHAT case 추가**

```typescript
case WidgetType.UNIFIED_CHAT:
    player.tag.widget.unifiedChat = widget.element;
    break;
```

**Step 3: hideWidget 함수에 UNIFIED_CHAT case 추가**

```typescript
case WidgetType.UNIFIED_CHAT:
    player.tag.widget.unifiedChat = null;
    break;
```

**Step 4: cleanupPlayerWidgets 함수에 unifiedChat 추가**

```typescript
player.tag.widget.unifiedChat = null;
```

**Step 5: constructor의 addOnKeyDown에 unifiedChat 추가**

```typescript
if(player.tag.widget.unifiedChat){
    player.tag.widget.unifiedChat.sendMessage({type:"focusInput"})
}
```

**Step 6: 커밋**

```bash
git add libs/core/mafia/managers/widget/WidgetManager.ts
git commit -m "feat: register UNIFIED_CHAT widget in WidgetManager"
```

---

## Task 8: GameFlowManager - 통합 채팅 초기화 함수 추가

**Files:**
- Modify: `libs/core/mafia/managers/gameFlow/GameFlowManager.ts`

**Step 1: 통합 채팅 초기화 함수 추가** (클래스 메서드로 추가)

```typescript
/**
 * 통합 채팅 위젯 초기화
 */
private initUnifiedChat(player: GamePlayer, channels: string[], activeChannel: string, readOnlyChannels: string[] = []) {
    const widgetManager = WidgetManager.instance;

    widgetManager.showWidget(player, WidgetType.UNIFIED_CHAT);

    // 채널별 기존 메시지 수집
    const messages: { [channel: string]: any[] } = {};

    if (channels.includes('day')) {
        messages['day'] = this.dayChatMessages.map(msg => ({
            senderId: msg.sender,
            senderName: msg.senderName,
            message: msg.message,
            timestamp: msg.timestamp
        }));
    }

    if (channels.includes('dead')) {
        messages['dead'] = this.chatMessages
            .filter(msg => msg.target === 'dead')
            .map(msg => ({
                senderId: msg.sender,
                senderName: msg.senderName,
                message: msg.message,
                timestamp: Date.now()
            }));
    }

    if (channels.includes('mafia')) {
        messages['mafia'] = this.chatMessages
            .filter(msg => msg.target === 'mafia')
            .map(msg => ({
                senderId: msg.sender,
                senderName: msg.senderName,
                message: msg.message,
                timestamp: Date.now()
            }));
    }

    if (channels.includes('lover')) {
        messages['lover'] = this.chatMessages
            .filter(msg => msg.target === 'lover')
            .map(msg => ({
                senderId: msg.sender,
                senderName: msg.senderName,
                message: msg.message,
                timestamp: Date.now()
            }));
    }

    widgetManager.sendMessageToWidget(player, WidgetType.UNIFIED_CHAT, {
        type: 'init',
        myPlayerId: player.id,
        channels: channels,
        activeChannel: activeChannel,
        readOnlyChannels: readOnlyChannels,
        messages: messages
    });

    // 메시지 핸들러 등록
    widgetManager.clearMessageHandlers(player, WidgetType.UNIFIED_CHAT);
    widgetManager.registerMessageHandler(player, WidgetType.UNIFIED_CHAT, (sender: GamePlayer, data) => {
        this.handleUnifiedChatMessage(sender, data);
    });
}

/**
 * 통합 채팅 메시지 핸들러
 */
private handleUnifiedChatMessage(player: GamePlayer, data: any) {
    if (data.type === 'sendMessage' && data.message) {
        const channel = data.channel;
        const message = data.message.trim();

        if (!message) return;

        switch (channel) {
            case 'day':
                this.handleDayChatMessage(player, message);
                break;
            case 'dead':
                this.broadcastDeadMessage(player, message);
                break;
            case 'mafia':
                this.broadcastMafiaMessage(player, message);
                break;
            case 'lover':
                this.broadcastLoverMessage(player, message);
                break;
        }
    }
}
```

**Step 2: 커밋**

```bash
git add libs/core/mafia/managers/gameFlow/GameFlowManager.ts
git commit -m "feat: add unified chat initialization and message handler"
```

---

## Task 9: GameFlowManager - 낮 단계에서 통합 채팅 사용

**Files:**
- Modify: `libs/core/mafia/managers/gameFlow/GameFlowManager.ts`

**Step 1: 낮 단계 시작 시 통합 채팅 초기화로 변경**

기존 `DAY_CHAT` 관련 코드를 `UNIFIED_CHAT`으로 교체.

`MafiaPhase.DAY` 케이스에서 각 플레이어에게 채팅 위젯을 보여주는 부분 수정:

```typescript
// 기존 코드 (주석 처리 또는 삭제)
// widgetManager.showWidget(gamePlayer, WidgetType.DAY_CHAT);
// widgetManager.sendMessageToWidget(gamePlayer, WidgetType.DAY_CHAT, { ... });

// 새 코드: 통합 채팅 사용
const channels = ['day'];
const readOnlyChannels: string[] = [];

// 마피아팀은 마피아 채널도 접근 가능 (읽기 전용)
if (this.mafiaChatPlayers.includes(player.id)) {
    channels.push('mafia');
    readOnlyChannels.push('mafia'); // 낮에는 읽기 전용
}

// 연인은 연인 채널도 접근 가능 (읽기 전용)
if (this.loverPlayers.includes(player.id)) {
    channels.push('lover');
    readOnlyChannels.push('lover'); // 낮에는 읽기 전용
}

// 영매는 죽은자 채널 접근 가능 (읽기 전용)
if (player.jobId === JobId.MEDIUM) {
    channels.push('dead');
    readOnlyChannels.push('dead'); // 낮에는 읽기 전용
}

this.initUnifiedChat(gamePlayer, channels, 'day', readOnlyChannels);
```

**Step 2: 기존 DAY_CHAT 핸들러 코드 제거/주석 처리**

```typescript
// 기존 코드 주석 처리
// widgetManager.registerMessageHandler(gamePlayer, WidgetType.DAY_CHAT, (player: GamePlayer, data) => { ... });
```

**Step 3: 커밋**

```bash
git add libs/core/mafia/managers/gameFlow/GameFlowManager.ts
git commit -m "feat: use unified chat in day phase"
```

---

## Task 10: GameFlowManager - 밤 단계에서 채널 전환

**Files:**
- Modify: `libs/core/mafia/managers/gameFlow/GameFlowManager.ts`

**Step 1: 밤 단계 시작 시 채널 업데이트**

`MafiaPhase.NIGHT` 케이스에서 통합 채팅 채널 전환:

```typescript
// 밤 단계 - 통합 채팅 채널 업데이트
const widgetManager = WidgetManager.instance;

// 마피아팀: 마피아 채널로 전환, 쓰기 가능
if (this.mafiaChatPlayers.includes(player.id) ||
    (player.jobId === JobId.WEREWOLF && this.werewolfTamed)) {

    widgetManager.sendMessageToWidget(gamePlayer, WidgetType.UNIFIED_CHAT, {
        type: 'setReadOnly',
        channel: 'mafia',
        readOnly: false
    });
    widgetManager.sendMessageToWidget(gamePlayer, WidgetType.UNIFIED_CHAT, {
        type: 'switchChannel',
        channel: 'mafia'
    });
}

// 연인: 연인 채널로 전환, 쓰기 가능
if (this.loverPlayers.includes(player.id)) {
    widgetManager.sendMessageToWidget(gamePlayer, WidgetType.UNIFIED_CHAT, {
        type: 'setReadOnly',
        channel: 'lover',
        readOnly: false
    });
    widgetManager.sendMessageToWidget(gamePlayer, WidgetType.UNIFIED_CHAT, {
        type: 'switchChannel',
        channel: 'lover'
    });
}

// 영매: 죽은자 채널로 전환, 밤에는 쓰기 가능
if (player.jobId === JobId.MEDIUM && player.isAlive) {
    widgetManager.sendMessageToWidget(gamePlayer, WidgetType.UNIFIED_CHAT, {
        type: 'setReadOnly',
        channel: 'dead',
        readOnly: false
    });
    widgetManager.sendMessageToWidget(gamePlayer, WidgetType.UNIFIED_CHAT, {
        type: 'switchChannel',
        channel: 'dead'
    });
}

// 낮 채널은 밤에 읽기 전용
widgetManager.sendMessageToWidget(gamePlayer, WidgetType.UNIFIED_CHAT, {
    type: 'setReadOnly',
    channel: 'day',
    readOnly: true,
    reason: '밤에는 낮 채팅을 사용할 수 없습니다'
});
```

**Step 2: 커밋**

```bash
git add libs/core/mafia/managers/gameFlow/GameFlowManager.ts
git commit -m "feat: handle channel switching in night phase"
```

---

## Task 11: GameFlowManager - 플레이어 사망 시 채널 업데이트

**Files:**
- Modify: `libs/core/mafia/managers/gameFlow/GameFlowManager.ts`

**Step 1: 사망 처리 함수에서 통합 채팅 업데이트**

플레이어 사망 시 호출되는 부분에 추가:

```typescript
/**
 * 플레이어 사망 시 통합 채팅 업데이트
 */
private updateUnifiedChatOnDeath(player: GamePlayer) {
    const widgetManager = WidgetManager.instance;

    // 기존 채널들을 읽기 전용으로 설정하고 죽은자 채널 추가
    const channels = ['dead'];
    const readOnlyChannels: string[] = [];

    // 기존 낮 채널 유지 (읽기 전용)
    channels.push('day');
    readOnlyChannels.push('day');

    // 마피아였다면 마피아 채널도 유지 (읽기 전용)
    if (this.mafiaChatPlayers.includes(player.id)) {
        channels.push('mafia');
        readOnlyChannels.push('mafia');
    }

    // 연인이었다면 연인 채널도 유지 (읽기 전용)
    if (this.loverPlayers.includes(player.id)) {
        channels.push('lover');
        readOnlyChannels.push('lover');
    }

    widgetManager.sendMessageToWidget(player, WidgetType.UNIFIED_CHAT, {
        type: 'setChannels',
        channels: channels,
        activeChannel: 'dead',
        readOnlyChannels: readOnlyChannels
    });
}
```

**Step 2: 사망 처리 코드에서 이 함수 호출**

`handlePlayerDeath` 또는 유사한 함수에서:

```typescript
// 통합 채팅 업데이트
const gamePlayer = getPlayerById(deadPlayerId);
if (gamePlayer) {
    this.updateUnifiedChatOnDeath(gamePlayer);
}
```

**Step 3: 커밋**

```bash
git add libs/core/mafia/managers/gameFlow/GameFlowManager.ts
git commit -m "feat: update unified chat channels on player death"
```

---

## Task 12: 메시지 브로드캐스트 함수 통합 채팅으로 변경

**Files:**
- Modify: `libs/core/mafia/managers/gameFlow/GameFlowManager.ts`

**Step 1: broadcastDayMessage 함수 수정**

```typescript
private broadcastDayMessage(sender: GamePlayer, senderName: string, message: string) {
    const widgetManager = WidgetManager.instance;

    this.room.actionToRoomPlayers((player) => {
        if (!player.isAlive && !this.deadPlayers.includes(player.id)) return;

        const gamePlayer = getPlayerById(player.id);
        if (!gamePlayer) return;

        // 통합 채팅으로 메시지 전송
        widgetManager.sendMessageToWidget(gamePlayer, WidgetType.UNIFIED_CHAT, {
            type: 'newMessage',
            channel: 'day',
            senderId: sender.id,
            senderName: senderName,
            message: message,
            timestamp: Date.now()
        });
    });
}
```

**Step 2: broadcastDeadMessage 함수 수정**

```typescript
private broadcastDeadMessage(sender: GamePlayer, message: string) {
    const widgetManager = WidgetManager.instance;

    // 메시지 저장
    this.chatMessages.push({
        target: 'dead',
        sender: sender.id,
        senderName: sender.name,
        message: message
    });

    // 죽은 플레이어들에게 전송
    this.deadPlayers.forEach((deadId) => {
        if (deadId === sender.id) return;

        const deadPlayer = getPlayerById(deadId);
        if (deadPlayer) {
            widgetManager.sendMessageToWidget(deadPlayer, WidgetType.UNIFIED_CHAT, {
                type: 'newMessage',
                channel: 'dead',
                senderId: sender.id,
                senderName: sender.name,
                message: message,
                timestamp: Date.now()
            });
        }
    });

    // 영매에게도 전송
    this.room.actionToRoomPlayers((player) => {
        if (player.jobId === JobId.MEDIUM && player.isAlive) {
            const mediumPlayer = getPlayerById(player.id);
            if (mediumPlayer) {
                widgetManager.sendMessageToWidget(mediumPlayer, WidgetType.UNIFIED_CHAT, {
                    type: 'newMessage',
                    channel: 'dead',
                    senderId: sender.id,
                    senderName: sender.name,
                    message: message,
                    timestamp: Date.now()
                });
            }
        }
    });
}
```

**Step 3: broadcastMafiaMessage 함수 수정**

```typescript
private broadcastMafiaMessageToUnifiedChat(sender: GamePlayer, message: string) {
    const widgetManager = WidgetManager.instance;

    this.mafiaChatPlayers.forEach((mafiaId) => {
        if (mafiaId === sender.id) return;

        const player = this.room?.players.find((p) => p.id === mafiaId);
        if (!player || !player.isAlive) return;

        const mafiaPlayer = getPlayerById(mafiaId);
        if (mafiaPlayer) {
            widgetManager.sendMessageToWidget(mafiaPlayer, WidgetType.UNIFIED_CHAT, {
                type: 'newMessage',
                channel: 'mafia',
                senderId: sender.id,
                senderName: sender.name,
                message: message,
                timestamp: Date.now()
            });
        }
    });
}
```

**Step 4: 커밋**

```bash
git add libs/core/mafia/managers/gameFlow/GameFlowManager.ts
git commit -m "feat: update broadcast functions for unified chat"
```

---

## Task 13: night_action.html에서 채팅 UI 제거

**Files:**
- Modify: `apps/mafia/res/widgets/night_action.html`

**Step 1: 채팅 관련 HTML 제거**

`.chat-container` div와 내부 요소들 삭제:

```html
<!-- 삭제할 부분 -->
<!--
<div class="chat-container" id="chat-container">
    <div class="chat-messages" id="chat-messages"></div>
    <div class="chat-input-container">
        <input type="text" class="chat-input" id="chat-input" placeholder="메시지 입력...">
        <button class="chat-send-button" id="chat-send-button">전송</button>
    </div>
</div>
-->
```

**Step 2: 채팅 관련 CSS 제거**

`.chat-container`, `.chat-messages`, `.chat-message`, `.chat-input-container` 등 관련 스타일 삭제

**Step 3: 채팅 관련 JavaScript 제거**

- `chatEnabled`, `chatTarget` 변수 삭제
- `initializeChat()` 함수 삭제
- `addChatMessage()` 함수 삭제
- `roleActions` 객체에서 `showChat`, `chatTarget` 속성 삭제
- 메시지 핸들러에서 채팅 관련 케이스 삭제 (`initChat`, `chatMessage`, `spyContact` 등)

**Step 4: 커밋**

```bash
git add apps/mafia/res/widgets/night_action.html
git commit -m "refactor: remove embedded chat UI from night_action widget"
```

---

## Task 14: 기존 채팅 위젯 파일 삭제

**Files:**
- Delete: `apps/mafia/res/widgets/day_chat_widget.html`
- Delete: `apps/mafia/res/widgets/dead_chat_widget.html`

**Step 1: 기존 위젯 파일 삭제**

```bash
rm apps/mafia/res/widgets/day_chat_widget.html
rm apps/mafia/res/widgets/dead_chat_widget.html
```

**Step 2: WidgetManager에서 기존 위젯 생성 코드 제거**

```typescript
// 삭제할 라인들
// this.createAndInitializeWidget(player, widgetMap, WidgetType.DEAD_CHAT, "widgets/dead_chat_widget.html", "middleright");
// this.createAndInitializeWidget(player, widgetMap, WidgetType.DAY_CHAT, "widgets/day_chat_widget.html", "middleright");
```

**Step 3: 커밋**

```bash
git add -A
git commit -m "refactor: remove deprecated day_chat and dead_chat widgets"
```

---

## Task 15: 빌드 및 테스트

**Step 1: 빌드 실행**

```bash
cd /mnt/c/users/scm14/documents/github/mafia_renewal
npm run build
```

**Step 2: 빌드 오류 수정**

오류 발생 시 해당 파일 수정 후 재빌드

**Step 3: 최종 커밋**

```bash
git add -A
git commit -m "fix: resolve build errors for unified chat integration"
```

---

## 구현 순서 요약

| Task | 설명 | 예상 시간 |
|------|------|----------|
| 1 | WidgetType에 UNIFIED_CHAT 추가 | 2분 |
| 2 | 통합 위젯 기본 구조 생성 | 5분 |
| 3 | 탭 바 CSS 및 렌더링 | 5분 |
| 4 | 메시지 영역 CSS 및 렌더링 | 5분 |
| 5 | 입력 영역 및 전송 기능 | 5분 |
| 6 | 초기화 및 메시지 핸들러 완성 | 5분 |
| 7 | WidgetManager에 위젯 등록 | 5분 |
| 8 | GameFlowManager 초기화 함수 추가 | 10분 |
| 9 | 낮 단계에서 통합 채팅 사용 | 10분 |
| 10 | 밤 단계 채널 전환 | 10분 |
| 11 | 플레이어 사망 시 채널 업데이트 | 5분 |
| 12 | 브로드캐스트 함수 수정 | 10분 |
| 13 | night_action.html 채팅 UI 제거 | 10분 |
| 14 | 기존 위젯 파일 삭제 | 2분 |
| 15 | 빌드 및 테스트 | 10분 |

**총 예상 시간: 약 90분**

---

## 테스트 체크리스트

- [ ] 낮 단계에서 채팅 가능
- [ ] 마피아가 밤에 마피아 채널 사용 가능
- [ ] 연인이 밤에 연인 채널 사용 가능
- [ ] 영매가 죽은자 채널 볼 수 있음 (낮: 읽기전용, 밤: 쓰기가능)
- [ ] 플레이어 사망 시 죽은자 채널로 전환
- [ ] 사망 후 기존 채널 읽기 전용으로 유지
- [ ] 탭 전환 시 메시지 유지
- [ ] 읽지 않은 메시지 뱃지 표시
- [ ] 모바일에서 정상 작동

---

## 날짜
2026-01-16
