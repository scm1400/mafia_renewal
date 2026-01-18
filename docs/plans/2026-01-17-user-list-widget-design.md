# UserList 위젯 설계

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 로비 전용 유저 목록 위젯 + 친구 시스템 구현

**Architecture:** lobby_navbar 통합 팝업 방식, Supabase 친구 데이터 저장

**Tech Stack:** TypeScript, HTML/CSS/JavaScript (ZEP Script), Supabase

---

## 1. 개요 및 데이터 모델

### 목적
로비에 접속한 전체 유저 목록을 표시하는 위젯. 기존 `lobby_navbar`의 "👥 유저" 버튼 클릭 시 팝업으로 표시.

### 유저 데이터 모델 (`IUserProfileData`)

```typescript
interface IUserProfileData {
  id: string;              // 플레이어 ID
  name: string;            // 닉네임
  profileImage: string;    // 프로필 이미지 URL
  status: UserStatus;      // 현재 상태
  roomId?: string;         // 방에 있을 경우 방 ID
  roomTitle?: string;      // 방 제목 (빠른 입장용)
}

enum UserStatus {
  LOBBY = "lobby",         // 로비 대기 중
  IN_ROOM = "in_room",     // 방에서 대기 중
  IN_GAME = "in_game"      // 게임 중
}
```

### 친구 데이터 모델 (Supabase)

```typescript
// friends 테이블
interface FriendRecord {
  id: string;              // PK
  requester_id: string;    // 요청자 ZEP ID
  receiver_id: string;     // 수신자 ZEP ID
  status: "pending" | "accepted";
  created_at: timestamp;
}
```

### 온라인 트래커 (서버 메모리)
```typescript
// SocialManager에서 관리
onlineTracker: Record<string, IUserProfileData>
```

---

## 2. 서버 아키텍처

### 파일 구조

```
libs/core/mafia/
├── managers/
│   └── social/
│       └── SocialManager.ts      # 친구/유저목록 관리
├── types/
│   └── SocialTypes.ts            # IUserProfileData, FriendRecord 등
└── services/
    └── SupabaseService.ts        # Supabase API 래퍼

libs/api-service/
└── ApiService.ts                 # 기존 HTTP 요청 유틸 (확장)
```

### SocialManager 핵심 구조

```typescript
class SocialManager extends ManagerBase {
  private onlineTracker: Record<string, IUserProfileData> = {};
  private updateDelay: number = 0;  // 2초 배치 업데이트

  // 플레이어 입장 시
  addPlayer(player: ScriptPlayer): void {
    this.onlineTracker[player.id] = {
      id: player.id,
      name: player.name,
      profileImage: player.profileImage,
      status: UserStatus.LOBBY
    };
    this.requestUpdate();
  }

  // 플레이어 퇴장 시
  removePlayer(playerId: string): void {
    delete this.onlineTracker[playerId];
    this.requestUpdate();
  }

  // 상태 변경 시 (방 입장/게임 시작 등)
  updatePlayerStatus(playerId: string, status: UserStatus, roomId?: string, roomTitle?: string): void;

  // 2초 딜레이 후 전체 클라이언트에 갱신
  private requestUpdate(): void {
    this.updateDelay = 120; // 2초 (60fps 기준)
  }
}
```

### 기존 시스템과 연동

- `Game.ts`에서 `SocialManager` 인스턴스 생성
- `GameRoomManager`에서 방 입장/퇴장 시 `SocialManager.updatePlayerStatus()` 호출
- `GameFlowManager`에서 게임 시작/종료 시 상태 업데이트

---

## 3. 서버-위젯 메시지 통신

### 서버 → 위젯 메시지

| 타입 | 페이로드 | 설명 |
|------|----------|------|
| `init` | `{ onlineTracker, friendList, pendingRequests, myId }` | 위젯 초기화 |
| `refreshList` | `{ onlineTracker }` | 유저 목록 갱신 |
| `friendListUpdate` | `{ friendList, pendingRequests }` | 친구 목록 변경 |
| `friendRequestReceived` | `{ fromId, fromName, fromImage }` | 친구 요청 수신 알림 |
| `friendRequestAccepted` | `{ byId, byName }` | 요청 수락 알림 |

### 위젯 → 서버 메시지

| 타입 | 페이로드 | 설명 |
|------|----------|------|
| `lookupUser` | `{ targetId }` | 프로필 조회 요청 |
| `whisper` | `{ targetId, message }` | 귓속말 전송 |
| `joinRoom` | `{ roomId }` | 같은 방 입장 요청 |
| `sendFriendRequest` | `{ targetId }` | 친구 요청 전송 |
| `acceptFriendRequest` | `{ requesterId }` | 친구 요청 수락 |
| `rejectFriendRequest` | `{ requesterId }` | 친구 요청 거절 |
| `removeFriend` | `{ friendId }` | 친구 삭제 |

### 메시지 핸들러 위치

```typescript
// SocialManager.ts
handleUserListMessage(player: ScriptPlayer, msg: any): void {
  switch (msg.type) {
    case "lookupUser":
      this.showUserProfile(player, msg.targetId);
      break;
    case "whisper":
      this.sendWhisper(player, msg.targetId, msg.message);
      break;
    case "joinRoom":
      this.eventEmitter.emit("JOIN_ROOM_REQUEST", { player, roomId: msg.roomId });
      break;
    case "sendFriendRequest":
      this.sendFriendRequest(player, msg.targetId);
      break;
    // ...
  }
}
```

---

## 4. 위젯 UI 설계

### 레이아웃 구조

```
┌─────────────────────────────────────┐
│  👥 접속자 (12명)              [×]  │  ← 헤더
├─────────────────────────────────────┤
│  [🔍 유저 검색...]                  │  ← 검색바
├─────────────────────────────────────┤
│  ▼ 나                               │  ← 카테고리 (접기 가능)
│  ┌─────────────────────────────┐    │
│  │ 🟢 [img] 철수     로비 대기 │    │
│  └─────────────────────────────┘    │
├─────────────────────────────────────┤
│  ▼ 친구 (3)                         │
│  ┌─────────────────────────────┐    │
│  │ 🟢 [img] 영희     방 대기   │    │  ← 클릭 시 액션 메뉴
│  │ 🟡 [img] 민수     게임 중   │    │
│  │ ⚫ [img] 지연     오프라인  │    │  ← 오프라인 친구
│  └─────────────────────────────┘    │
├─────────────────────────────────────┤
│  ▼ 일반 유저 (8)                    │
│  ┌─────────────────────────────┐    │
│  │ 🟢 [img] 유저1    로비 대기 │    │
│  │ 🟢 [img] 유저2    방 대기   │    │
│  │ ...                         │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### 상태 인디케이터

| 상태 | 색상 변수 |
|------|-----------|
| 로비 대기 | `--neon-cyan` (#00f0ff) |
| 방 대기 | `--warning` (#ffaa00) |
| 게임 중 | `--neon-pink` (#ff2d95) |
| 오프라인 | `--text-muted` (#606070) |

### 유저 클릭 시 액션 메뉴

```
┌─────────────────────┐
│  📋 프로필 보기     │
│  💬 귓속말          │
│  🚪 같은 방 입장    │  ← 방에 있을 때만 표시
│  ──────────────     │
│  ➕ 친구 추가       │  ← 친구 아닐 때
│  ➖ 친구 삭제       │  ← 친구일 때
└─────────────────────┘
```

### 친구 요청 알림 (인라인)

```
┌─────────────────────────────────────┐
│  🔔 영희님이 친구 요청을 보냈습니다 │
│            [수락]  [거절]           │
└─────────────────────────────────────┘
```

---

## 5. Supabase 연동

### 데이터베이스 스키마

```sql
-- 친구 관계 테이블
CREATE TABLE mafia_friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id TEXT NOT NULL,      -- ZEP 플레이어 ID
  receiver_id TEXT NOT NULL,       -- ZEP 플레이어 ID
  status TEXT DEFAULT 'pending',   -- 'pending' | 'accepted'
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(requester_id, receiver_id)
);

-- 인덱스 (조회 성능)
CREATE INDEX idx_friends_requester ON mafia_friends(requester_id);
CREATE INDEX idx_friends_receiver ON mafia_friends(receiver_id);
CREATE INDEX idx_friends_status ON mafia_friends(status);
```

### SupabaseService API

```typescript
// libs/core/mafia/services/SupabaseService.ts

class SupabaseService {
  private baseUrl: string = "https://[PROJECT_ID].supabase.co/rest/v1";
  private apiKey: string = "[ANON_KEY]";

  // 친구 목록 조회 (수락된 친구만)
  getFriendList(playerId: string, callback: (friends: string[]) => void): void;

  // 대기 중인 친구 요청 조회
  getPendingRequests(playerId: string, callback: (requests: FriendRequest[]) => void): void;

  // 친구 요청 전송
  sendFriendRequest(requesterId: string, receiverId: string, callback: (success: boolean) => void): void;

  // 친구 요청 수락
  acceptFriendRequest(requesterId: string, receiverId: string, callback: (success: boolean) => void): void;

  // 친구 요청 거절/삭제
  removeFriendRecord(playerId: string, targetId: string, callback: (success: boolean) => void): void;

  // 오프라인 친구 프로필 조회 (배치)
  getOfflineFriendProfiles(friendIds: string[], callback: (profiles: IUserProfileData[]) => void): void;
}
```

### HTTP 요청 패턴 (ZEP 제약사항 준수)

```typescript
// ScriptApp.httpGet/Post 사용 (fetch/Promise 불가)
sendFriendRequest(requesterId: string, receiverId: string, callback: (success: boolean) => void): void {
  const url = `${this.baseUrl}/mafia_friends`;
  const body = JSON.stringify({
    requester_id: requesterId,
    receiver_id: receiverId,
    status: "pending"
  });

  ScriptApp.httpPost(url, {
    "apikey": this.apiKey,
    "Content-Type": "application/json"
  }, body, (response) => {
    callback(response.statusCode === 201);
  });
}
```

---

## 6. 파일 변경 목록

### 신규 파일

| 파일 | 설명 |
|------|------|
| `libs/core/mafia/types/SocialTypes.ts` | IUserProfileData, UserStatus, FriendRequest 타입 |
| `libs/core/mafia/managers/social/SocialManager.ts` | 유저 목록/친구 관리 매니저 |
| `libs/core/mafia/services/SupabaseService.ts` | Supabase API 래퍼 |
| `apps/mafia/res/widgets/user_list_widget.html` | 유저 목록 위젯 |

### 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `libs/core/mafia/Game.ts` | SocialManager 인스턴스 생성 및 초기화 |
| `libs/core/mafia/managers/gameRoom/GameRoomManager.ts` | 방 입장/퇴장 시 SocialManager 상태 업데이트 |
| `libs/core/mafia/managers/gameFlow/GameFlowManager.ts` | 게임 시작/종료 시 상태 업데이트 |
| `libs/core/mafia/managers/widget/WidgetManager.ts` | USER_LIST 위젯 타입 추가 |
| `apps/mafia/res/widgets/lobby_navbar.html` | 유저 버튼 클릭 시 user_list_widget 표시 연동 |

---

## 7. 구현 순서

1. **타입 정의** - SocialTypes.ts
2. **Supabase 서비스** - SupabaseService.ts + DB 테이블 생성
3. **SocialManager** - 온라인 트래커, 친구 관리 로직
4. **위젯 HTML** - user_list_widget.html (사이버펑크 스타일)
5. **Game.ts 연동** - SocialManager 초기화, 이벤트 연결
6. **GameRoomManager 연동** - 상태 업데이트 호출
7. **lobby_navbar 연동** - 유저 버튼 클릭 핸들러

### 예상 코드량

| 파일 | 라인 수 |
|------|---------|
| SocialTypes.ts | ~40줄 |
| SupabaseService.ts | ~150줄 |
| SocialManager.ts | ~250줄 |
| user_list_widget.html | ~500줄 |
| 기존 파일 수정 | ~100줄 |

---

## 날짜
2026-01-17
