# 로비 위젯 리디자인

## 개요

기존 로비 위젯을 **좌측 하단 사이드바 형태**로 변경하고, 모바일/태블릿 UX를 개선합니다.

### 핵심 변경사항

- **위치**: 우측 하단 → 좌측 하단
- **PC/태블릿**: 좌측 20% 너비 세로 사이드바
- **모바일**: 전체 화면, 탭 기반 레이아웃 (방/유저 전환, 채팅 하단 고정)

---

## 레이아웃 명세

### PC/태블릿 (Expanded)

**WidgetRearrange:**
```javascript
{
    anchor: "bottomleft",
    width: "20%",      // 최소 280px CSS로 보장
    height: "100%",
    pointerEvents: "auto",
    visibility: "visible"
}
```

**레이아웃 구조:**
```
┌──────────────────────┐
│  🎮 마피아 로비 [−]  │  ← 헤더 + 접기 버튼
├──────────────────────┤
│  👥 유저 (5)         │  ← 유저 목록 (접히는 섹션)
│  ├ 플레이어1         │
│  ├ 플레이어2         │
│  └ ...               │
├──────────────────────┤
│  🚪 방 목록          │  ← 방 목록 (메인 콘텐츠)
│  ┌────────────────┐  │
│  │ 방1 (2/8)      │  │
│  └────────────────┘  │
│  ┌────────────────┐  │
│  │ 방2 (4/8)      │  │
│  └────────────────┘  │
├──────────────────────┤
│  💬 채팅             │  ← 채팅 영역
│  메시지들...         │
│  [입력]       [전송] │
├──────────────────────┤
│  [+ 방 만들기]       │  ← 액션 버튼
└──────────────────────┘
```

### PC/태블릿 (Compact)

**WidgetRearrange:**
```javascript
{
    anchor: "bottomleft",
    width: "60px",
    height: "100%",
    pointerEvents: "auto",
    visibility: "visible"
}
```

**레이아웃:**
```
┌────┐
│ 🎮 │  ← 로고/펼치기
├────┤
│ 👥 │  ← 유저 (뱃지로 인원 표시)
├────┤
│ 🚪 │  ← 방 (뱃지로 방 수 표시)
├────┤
│ 💬 │  ← 채팅 (뱃지로 읽지않은 메시지)
├────┤
│ ➕ │  ← 방 만들기
└────┘
```

### 모바일 (Expanded)

**WidgetRearrange:**
```javascript
{
    anchor: "bottomleft",
    width: "100%",
    height: "100%",
    pointerEvents: "auto",
    visibility: "visible"
}
```

**레이아웃 구조:**
```
┌─────────────────────────┐
│  🎮 마피아 로비    [−]  │  ← 헤더 + 접기 버튼
├─────────────────────────┤
│  [🚪 방 목록] [👥 유저] │  ← 탭 바 (2개만)
├─────────────────────────┤
│                         │
│   방 목록 또는 유저     │  ← 메인 콘텐츠 (스크롤)
│   (활성 탭에 따라)      │     높이: ~40%
│                         │
├─────────────────────────┤
│  💬 채팅                │  ← 채팅 (하단 고정)
│  메시지들...            │     높이: ~30%
│  [입력]          [전송] │
├─────────────────────────┤
│  [+ 방 만들기]          │  ← 액션 버튼
└─────────────────────────┘
```

### 모바일 (Compact)

**WidgetRearrange:**
```javascript
{
    anchor: "bottomleft",
    width: "60px",
    height: "60px",
    pointerEvents: "auto",
    visibility: "visible"
}
```

**레이아웃:**
```
┌────┐
│ 🎮 │  ← 펼치기 버튼 (읽지않은 메시지 뱃지)
└────┘
```

---

## 크기 요약표

| 모드 | 너비 | 높이 | 앵커 | 특징 |
|------|------|------|------|------|
| PC/태블릿 Expanded | 20% (min 280px) | 100% | bottomleft | 세로 사이드바 |
| PC/태블릿 Compact | 60px | 100% | bottomleft | 아이콘 바 |
| 모바일 Expanded | 100% | 100% | bottomleft | 탭 기반 |
| 모바일 Compact | 60px | 60px | bottomleft | 단일 버튼 |

---

## CSS 구조 변경

### 새로운 CSS 변수

```css
:root {
    /* 사이드바 크기 */
    --sidebar-width: 20%;
    --sidebar-min-width: 280px;
    --sidebar-compact-width: 60px;

    /* 모바일 탭 높이 */
    --tab-bar-height: 44px;
    --chat-section-height: 30%;
    --action-bar-height: 50px;
}
```

### 주요 클래스 변경

**기존 `.lobby-container`:**
- `display: flex` (가로 배치)
- 사이드바 + 메인 영역

**새로운 `.lobby-container`:**
```css
.lobby-container {
    display: flex;
    flex-direction: column;  /* 세로 스택 */
    width: 100%;
    height: 100%;
    min-width: var(--sidebar-min-width);
}

/* PC/태블릿 */
@media (min-width: 768px) {
    .lobby-container {
        width: var(--sidebar-width);
    }
}
```

### 모바일 탭 바

```css
.mobile-tab-bar {
    display: none;  /* PC에서 숨김 */
    height: var(--tab-bar-height);
    background: var(--bg-elevated);
    border-bottom: 1px solid var(--border-subtle);
}

@media (max-width: 767px) {
    .mobile-tab-bar {
        display: flex;
    }

    /* 섹션별 표시 제어 */
    .section-users,
    .section-rooms {
        display: none;
    }

    .section-users.active,
    .section-rooms.active {
        display: block;
    }
}
```

---

## JavaScript 변경사항

### 상태 추가

```javascript
state = {
    // 기존 상태...
    mobileActiveTab: 'rooms',  // 'rooms' | 'users'
    isCompact: false,
    isMobile: window.innerWidth < 768
};
```

### 디바이스 감지

```javascript
function checkDevice() {
    const wasMobile = state.isMobile;
    state.isMobile = window.innerWidth < 768;

    if (wasMobile !== state.isMobile) {
        renderLayout();
        sendRearrangeMessage();
    }
}

window.addEventListener('resize', debounce(checkDevice, 200));
```

### WidgetRearrange 메시지

```javascript
function sendRearrangeMessage() {
    const config = getRearrangeConfig();
    window.parent.postMessage({
        type: "WidgetRearrange",
        ...config
    }, "*");
}

function getRearrangeConfig() {
    if (state.isMobile) {
        return state.isCompact
            ? { anchor: "bottomleft", width: "60px", height: "60px", ... }
            : { anchor: "bottomleft", width: "100%", height: "100%", ... };
    } else {
        return state.isCompact
            ? { anchor: "bottomleft", width: "60px", height: "100%", ... }
            : { anchor: "bottomleft", width: "20%", height: "100%", ... };
    }
}
```

### 탭 전환 (모바일)

```javascript
function switchMobileTab(tab) {
    state.mobileActiveTab = tab;

    document.querySelectorAll('.section-rooms, .section-users').forEach(el => {
        el.classList.remove('active');
    });

    document.querySelector(`.section-${tab}`).classList.add('active');

    document.querySelectorAll('.mobile-tab').forEach(el => {
        el.classList.toggle('active', el.dataset.tab === tab);
    });
}
```

---

## 구현 순서

### Task 1: WidgetRearrange 메시지 수정
- `revealWidget()` 함수에서 anchor를 `bottomleft`로 변경
- PC/태블릿: width `20%`, height `100%`
- 모바일: width `100%`, height `100%`

### Task 2: CSS 구조 변경
- 기존 가로 레이아웃 → 세로 스택 레이아웃
- 새로운 CSS 변수 추가
- 섹션별 flex 비율 조정

### Task 3: 모바일 탭 바 추가
- HTML에 탭 바 요소 추가
- 탭 전환 JavaScript 구현
- 미디어 쿼리로 모바일에서만 표시

### Task 4: Compact 모드 리디자인
- 아이콘 바 형태로 변경 (60px 너비)
- 뱃지 표시 로직 추가
- 모바일 Compact는 60x60px 단일 버튼

### Task 5: 유저 섹션 재배치
- PC: 상단 접히는 섹션으로 이동
- 모바일: 탭 콘텐츠로 이동
- 기존 사이드바 제거

### Task 6: 테스트 및 미세 조정
- 다양한 화면 크기에서 테스트
- 스크롤 동작 확인
- 터치 영역 크기 확인 (최소 44px)

---

## 파일 변경 목록

**수정:**
- `apps/mafia/res/widgets/lobby_widget.html` - 전체 리팩토링

**변경 없음:**
- `libs/core/mafia/managers/widget/WidgetManager.ts` - 메시지 프로토콜 동일

---

## 날짜
2026-01-16
