# Room Widget 통합 설계

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** room_widget을 제거하고 lobby_navbar, lobby_widget, lobby_chat_widget에 기능을 통합

**Architecture:** 상태 전환 방식 - 각 위젯이 LOBBY/ROOM 두 가지 상태를 가지며, 방 입장/퇴장 시 UI가 자동 전환됨

**Tech Stack:** HTML/CSS/JavaScript (ZEP Script 위젯)

---

## 1. 상태 모델

위젯들이 공유하는 두 가지 상태:

```
LOBBY 상태: 방에 입장하지 않은 상태
ROOM 상태: 방에 입장한 상태
```

### 상태 전환 트리거
- LOBBY → ROOM: 방 생성/입장 성공 시
- ROOM → LOBBY: 나가기/강퇴/방 삭제 시

### 데이터 흐름
```
Game.ts에서 상태 변경 시
  → 모든 로비 위젯에 { type: "enterRoom", roomData } 또는 { type: "exitRoom" } 전송
  → 각 위젯이 자체적으로 UI 전환
```

---

## 2. lobby_navbar 변경

### LOBBY 상태 (현재)
```
┌─────────────────────────────────────────┐
│  [🚪 방 목록]  [👥 유저]  │  🌐 5명 접속  │
└─────────────────────────────────────────┘
```

### ROOM 상태 (신규)
```
┌─────────────────────────────────────────────┐
│  [🎮 즐거운마피아]  [3/8 준비]  │  [나가기]  │
└─────────────────────────────────────────────┘
```

### 동작
- 방 제목 클릭 → lobby_widget에 참가자 팝업 표시
- "3/8 준비" 클릭 → 동일하게 참가자 팝업 표시
- 나가기 클릭 → `leaveRoom` 메시지 전송, LOBBY 상태로 복귀

### 수신 메시지
- `enterRoom`: roomData (title, playerCount, maxPlayers, readyCount)
- `exitRoom`: LOBBY 상태로 전환
- `updateRoomStatus`: 준비 상태 업데이트 (3/8 → 4/8)

---

## 3. lobby_widget 변경

### LOBBY 상태 (현재)
- 방 목록 팝업
- 검색, 필터, 방 생성 모달

### ROOM 상태 (신규)
```
┌────────────────────────────────────┐
│  🎮 즐거운마피아            [×]   │
├────────────────────────────────────┤
│  ⚙️ 게임 설정                      │
│  ┌──────────────────────────────┐  │
│  │ 클래식 모드                  │  │
│  │ 마피아 vs 시민의 기본 대결   │  │
│  │ [마피아] [경찰] [의사] [시민]│  │
│  └──────────────────────────────┘  │
├────────────────────────────────────┤
│  👥 참가자 (3/8)                   │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐     │
│  │ 👑 │ │ ✓  │ │ ✓  │ │ ·  │     │
│  │철수│ │영희│ │민수│ │    │     │
│  └────┘ └────┘ └────┘ └────┘     │
├────────────────────────────────────┤
│  [      준비 완료 / 게임 시작     ]│
└────────────────────────────────────┘
```

### 동작
- 닫기(×) → 팝업만 닫음, 방 유지
- 방장: "게임 시작" 버튼 (모두 준비 시 활성화)
- 일반: "준비 완료/취소" 토글 버튼
- 방장은 참가자 카드에 강퇴 버튼 표시

### 수신 메시지
- `showWidget` (ROOM 상태): 참가자 팝업으로 표시
- `updateRoomInfo`: 참가자/준비 상태 갱신
- `gameModeDetails`: 게임 모드 정보

---

## 4. lobby_chat_widget 변경

### LOBBY 상태 (현재)
```
┌──────────────────────────┐
│ 💬 로비 채팅        [▼] │
├──────────────────────────┤
│ 철수: 안녕하세요         │
│ 영희: 같이 하실분?       │
├──────────────────────────┤
│ [메시지 입력...]  [전송] │
└──────────────────────────┘
```

### ROOM 상태 (신규)
```
┌──────────────────────────┐
│ 💬 방 채팅          [▼] │
├──────────────────────────┤
│ ⚡ 채팅방에 입장했습니다  │
│ 철수: 준비하세요~        │
│ ⚡ 영희님이 준비완료     │
├──────────────────────────┤
│ [메시지 입력...]  [전송] │
└──────────────────────────┘
```

### 변경점
- 헤더 텍스트: "로비 채팅" ↔ "방 채팅"
- 상태 전환 시 채팅 기록 초기화
- 시스템 메시지 스타일 동일 (입장/퇴장/준비 등)

### 수신 메시지
- `enterRoom`: 채팅 초기화, 헤더 변경, "채팅방에 입장했습니다" 표시
- `exitRoom`: 채팅 초기화, 헤더 변경
- `chatMessage`: 동일 (senderId, senderName, content)
- `systemMessage`: 방 내 이벤트 (준비, 입장, 퇴장 등)

---

## 5. Game.ts 변경사항

### 기존 흐름
```
방 입장 → hideLobbyWidgets() → showRoomWidget()
방 퇴장 → hideRoomWidget() → showLobbyWidget()
```

### 새 흐름
```
방 입장 → 로비 위젯들에 enterRoom 메시지 전송
방 퇴장 → 로비 위젯들에 exitRoom 메시지 전송
```

### 제거되는 것
- `WidgetType.ROOM` 및 관련 코드
- `showRoomWidget()` 메서드
- `room_widget.html` 파일
- `roomWidgetMessageHandler`

### 추가되는 메시지 핸들러 (lobby_widget)
- `setReady` / `cancelReady`: 준비 상태 변경
- `startGame`: 게임 시작 (방장)
- `kickPlayer`: 강퇴 (방장)
- `requestRoomInfo`: 방 정보 요청

### 브로드캐스트 (방 내 모든 플레이어)
- `updateRoomInfo`: 참가자/준비 상태 변경 시
- `systemMessage`: 입장/퇴장/준비/강퇴 이벤트

---

## 6. 파일 변경 목록

### 수정
| 파일 | 변경 내용 |
|------|-----------|
| `lobby_navbar.html` | ROOM 상태 UI 추가 (방 제목, 준비 상태, 나가기) |
| `lobby_widget.html` | ROOM 상태 UI 추가 (참가자 목록, 게임 설정, 액션 버튼) |
| `lobby_chat_widget.html` | 상태별 헤더 전환, 초기화 로직 |
| `WidgetManager.ts` | ROOM 타입 제거, 관련 참조 정리 |
| `WidgetType.ts` | `ROOM` 제거 |
| `Game.ts` | showRoomWidget 제거, enterRoom/exitRoom 메시지 전송 로직 |
| `GamePlayer.ts` | roomWidgetMessageHandler 제거 |

### 삭제
| 파일 |
|------|
| `room_widget.html` |

### 예상 코드량
- lobby_navbar.html: +100줄 (ROOM 상태 처리)
- lobby_widget.html: +300줄 (참가자 UI, room_widget에서 이전)
- lobby_chat_widget.html: +30줄 (상태 전환)
- Game.ts: -200줄 (room_widget 관련), +50줄 (새 메시지 흐름)

---

## 날짜
2026-01-17
