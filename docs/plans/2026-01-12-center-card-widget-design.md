# Center Card Widget Design

## Overview

GameLobbyWidget과 RoomWidget의 UX를 개선하기 위해 Center Card 방식으로 재설계했습니다.

## 문제점 (Before)

- 로비/룸 위젯이 화면 우측에 좁은 너비(30% / 400px)로 표시
- 게임 화면을 가리면서도 충분한 공간을 제공하지 못함
- 게임 참여 전에만 사용하는 위젯인데 불필요하게 게임 화면과 공간을 나눔

## 해결책 (After)

### Center Card Mode (확장 모드)
- 화면 중앙에 70% 너비, 80% 높이의 카드 형태로 표시
- 최대 크기: 900px x 700px
- 배경: 반투명 blur overlay (게임 화면 어둡게)
- 네온 테두리와 glow 효과로 시각적 강조

### Compact Mode (축소 모드)
- 데스크톱에서만 사용 가능
- 우측 상단에 56x56px 버튼으로 축소
- 로비: 대기 중인 방 개수를 badge로 표시
- 룸: 준비된 인원/전체 인원을 badge로 표시
- 클릭하면 다시 확장 모드로 전환

### Mobile
- 항상 전체화면 (100% x 100%)
- Compact 모드 없음 (축소 버튼 숨김)
- 닫기 버튼으로 위젯 숨김

## 변경된 파일

### `apps/mafia/res/widgets/lobby_widget.html`
- Center Card 레이아웃 적용
- Compact 버튼 추가 (cyan 색상, 방 개수 badge)
- 헤더에 최소화/닫기 버튼 추가
- Blur overlay 배경 추가

### `apps/mafia/res/widgets/room_widget.html`
- Center Card 레이아웃 적용
- Compact 버튼 추가 (pink 색상, 플레이어 준비 상태 badge)
- 헤더에 최소화 버튼 추가
- Blur overlay 배경 추가

## UI 요소

### 헤더 버튼
- `−` (최소화): Compact 모드로 전환 (데스크톱만)
- `×` (닫기): 위젯 숨김 및 게임 화면 포커스

### Compact 버튼
- 로비: `🎮` 아이콘 + 대기 방 개수 badge
- 룸: `👥` 아이콘 + 준비 인원 badge

## WidgetRearrange 설정

### Expanded Mode
```javascript
{ anchor: 'middle', width: '100%', height: '100%' }
```

### Compact Mode
```javascript
{ anchor: 'topright', width: '80px', height: '80px' }
```

### Hidden
```javascript
{ width: '0px', height: '0px' }
```

## 날짜
2026-01-12
