# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a ZEP Script application for a Mafia game built in TypeScript. ZEP is a virtual world platform where this app runs as a mini-game. The project is structured as a monorepo with shared libraries and a main mafia application.

## Build Commands

**Root level:**
- `npm run build` - Builds the mafia app, runs webpack, archives with zep-script, and creates mafia.zepapp.zip

**In apps/mafia directory:**
- `npm run build` - Runs webpack to build TypeScript code
- `npm run pack` - Builds and archives the project
- `npm run archive` - Creates .zepapp.zip file for upload to ZEP
- `npm run deploy` - Publishes the app to ZEP platform
- `npm run yaho` - Full pipeline: build, archive, and deploy

## Linting

ESLint with TypeScript support configured in `eslint.config.mjs`:
- `@ts-ignore` allowed
- `@typescript-eslint/no-explicit-any` disabled
- Empty catch blocks allowed

## Architecture

### Core Structure

The codebase follows a strict layered architecture:

```
apps/mafia/
  ├── main.ts                    # Entry point: creates Game singleton via ScriptApp.onInit
  └── res/
      ├── widgets/               # HTML widget files with embedded CSS/JS
      └── sounds/                # Audio resources

libs/
  ├── core/
  │   ├── GameBase.ts            # Abstract base class with event lifecycle (onStart, onJoinPlayer, etc.)
  │   ├── mafia/
  │   │   ├── Game.ts            # Singleton - orchestrates all managers
  │   │   ├── managers/          # Core game systems
  │   │   │   ├── gameRoom/      # Multi-room management
  │   │   │   ├── gameFlow/      # Game state, phases, voting logic
  │   │   │   ├── widget/        # Widget lifecycle and message handling
  │   │   │   └── Sprite/        # Visual sprite management
  │   │   ├── gameMode/          # Game mode definitions and configurations
  │   │   └── types/             # JobTypes, GamePlayer, shared interfaces
  │   └── @common/
  │       ├── ManagerBase.ts     # Base class providing EventEmitter pattern
  │       └── baseTemplate/      # Abstract template classes
  └── utils/
      ├── EventEmitter.ts        # Global singleton event bus
      └── Common.ts              # Utility functions
```

### Manager Pattern

All managers inherit from `ManagerBase` which provides:
- Access to global `EventEmitter` singleton for cross-system communication
- `EventListener` instance for listening to game events
- Standardized callback registration pattern

**Key Managers:**
- `GameRoomManager` - Creates/removes game rooms (max 20), registers game modes, emits room lifecycle events
- `GameFlowManager` - Controls `GameState` (WAITING/IN_PROGRESS/ENDED), `MafiaPhase` cycles, voting, night actions, player death
- `WidgetManager` - Singleton managing player-specific widget pools, message routing via `IWidget` interface
- `SpriteManager` - Singleton handling visual sprites and effects

### Game Flow

1. `apps/mafia/main.ts` calls `Game.create()` on `ScriptApp.onInit`
2. `Game` constructor (singleton):
   - Initializes `SpriteManager` and `WidgetManager` singletons
   - Creates `GameRoomManager` instance
   - Registers default game modes via `createDefaultGameModes()`
   - Sets up event listeners via `GameBase` callbacks (onStart, onJoinPlayer, onLeavePlayer, onUpdate, onDestroy)
3. When players join, `WidgetManager.initPlayerWidgets()` creates widget pool
4. Players create/join rooms via `GameRoomManager`, which assigns them to `GameRoom` instances
5. `GameRoom` uses `GameFlowManager` to run game phases and handle voting

### Widget System

Widgets are HTML files in `res/widgets/` with embedded CSS and JavaScript. Key characteristics:
- Each widget implements `IWidget` interface with message handlers
- Widget communication: `widget.sendMessage(data)` sends data to widget, handlers receive messages from widget
- Handlers can be added/removed via `addMessageHandler()` and return handler ID for removal
- Common widgets: lobby, room, game_status, vote, approval_vote, day_chat, dead_chat, night_action, role_card, final_defense

### Game Modes and Jobs

- Game modes defined in `libs/core/mafia/gameMode/`
- `GameMode` class contains: id, name, description, jobIds array, min/max players
- Job system in `libs/core/mafia/types/JobTypes.ts`:
  - `JobId` enum: all job types (MAFIA, POLICE, DOCTOR, CITIZEN, etc.)
  - `JobTeam` enum: MAFIA, CITIZEN, NEUTRAL
  - `JobAbilityType` enum: KILL, INVESTIGATE, PROTECT, etc.
  - `JOBS` array: complete job definitions with abilities, target types, usage limits

### Event-Driven Architecture

Global `EventEmitter` singleton pattern:
- `EventEmitter.getInstance()` provides app-wide event bus
- Managers use `this.eventEmitter.emit(event, data)` to broadcast
- Listeners use `this.eventListener.listen(event, callback)` to subscribe
- ScriptApp lifecycle hooks (onStart, onJoinPlayer, onLeavePlayer, onUpdate, onDestroy) wrapped in `GameBase`

### ZEP Platform Constraints

**CRITICAL**: This codebase runs in ZEP Script environment with strict limitations:
- **TypeScript syntax only** - No external npm libraries or web APIs allowed (enforced by `.cursor/rules/main/main.mdc`)
- Must use ZEP's built-in `ScriptApp` global API exclusively
- All resources (images, sounds, HTML) must be in `res/` directory
- Widget system uses ZEP's proprietary widget framework

### Critical Runtime Constraints (ZEP/Jint)

ZEP의 Jint(JavaScript 인터프리터)는 다음을 지원하지 않음 - **절대 사용 금지:**

| 금지                             | 대안                                       |
| -------------------------------- | ------------------------------------------ |
| `Promise` / `async` / `await`    | 콜백 패턴                                  |
| `console.log()`                  | `ScriptApp.sayToStaffs()` 또는 위젯 메시지 |
| `setTimeout()` / `setInterval()` | `ScriptApp.onUpdate` 루프에서 타이머 관리  |
| `Map` / `Set` 객체               | 일반 객체 `{}` 또는 배열                   |
| `window` / `document`            | 위젯 HTML에서만 사용 (서버사이드 금지)     |
| `fetch` / `XMLHttpRequest`       | `ScriptApp.httpGet/Post` 사용              |
| `localStorage` / `sessionStorage`| `ScriptApp.storage` 또는 Supabase          |

### WidgetRearrange (위젯 레이아웃/크기 재배치)

위젯(HTML)에서 **ZEP 클라이언트에게 위젯의 위치/크기/상호작용을 재설정**하고 싶을 때 사용한다.
`res/shop.html`의 `revealWidget()`처럼 초기 렌더링 직후(예: `init` 수신 후) 호출하는 패턴을 권장한다.

**공식 메시지 명세(필드):**

```typescript
window.parent.postMessage(
    {
        type: "WidgetRearrange",
        anchor: payload.anchor,
        width: payload.width,
        height: payload.height,
        pointerEvents: payload.pointerEvents,
        zIndex: payload.zIndex,
        visibility: payload.visibility,
    },
    "*"
);
```

- **anchor**: 위젯 기준점. (`"middle"`, `"bottom"`, `"top"`, `"middleleft"`, `"middleright"`, `"topleft"`, `"topright"`, `"bottomleft"`, `"bottomright"`)
- **width / height**: 문자열 기반 크기. (`"680px"`, `"100%"`, `"85%"` 등)
- **pointerEvents**: 위젯 클릭/터치 처리 여부(예: `"auto"` / `"none"`)
- **zIndex**: 위젯 레이어 우선순위(숫자)
- **visibility**: 표시 여부(예: `"visible"` / `"hidden"`)

**규칙:**

- 위젯 레이아웃 변경은 **위젯 HTML에서만** `window.parent.postMessage`로 수행한다.
- 가능한 한 **공식 명세 필드만** 사용한다. (예: `bottom` 같은 비표준 필드에 의존하지 말 것)

### Build Process

1. Webpack compiles `apps/mafia/main.ts` with all imported libs
2. Uses `ts-loader` and `babel-loader` for TypeScript transpilation
3. Outputs bundled `main.js` to `apps/mafia/res/`
4. `zep-script archive` packages res/ folder into `.zepapp.zip`
5. Archive uploaded to ZEP platform via website or `zep-script publish`

## Important Notes

- Game supports Korean language - comments and strings often in Korean (한국어)
- All managers use callback arrays for extensibility
- Player state stored in `player.tag` object (widget references, ready state, profile)
- Multiple game rooms can run simultaneously (dynamic up to ROOM_COUNT, determined by map locations)
- Webpack optimization disabled for debugging (`minimize: false`)