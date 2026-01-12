# Cyberpunk UI Overhaul Design

## Overview

Complete UI redesign for the Mafia game widgets using a Cyberpunk/Neon aesthetic with dark backgrounds, bright neon accents (cyan primary, pink secondary), and glowing effects.

## Design System

### Color Palette

```css
:root {
  /* Primary neon colors */
  --neon-cyan: #00f0ff;
  --neon-pink: #ff2d95;
  --neon-purple: #b026ff;

  /* Background layers (darkest to lightest) */
  --bg-base: #0a0a0f;
  --bg-surface: #12121a;
  --bg-elevated: #1a1a25;
  --bg-overlay: rgba(10, 10, 15, 0.85);

  /* Text hierarchy */
  --text-primary: #ffffff;
  --text-secondary: #a0a0b0;
  --text-muted: #606070;

  /* Semantic colors */
  --success: #00ff88;
  --danger: #ff3366;
  --warning: #ffaa00;

  /* Glow effects */
  --glow-cyan: 0 0 20px rgba(0, 240, 255, 0.5);
  --glow-pink: 0 0 20px rgba(255, 45, 149, 0.5);
  --glow-purple: 0 0 20px rgba(176, 38, 255, 0.5);
  --glow-subtle: 0 0 10px rgba(0, 240, 255, 0.2);
}
```

### Typography
- **Font**: Pretendard (existing)
- **Headings**: Bold 700, letter-spacing 0.5-1px
- **Body**: Regular 400-500
- **Labels**: 12px uppercase with letter-spacing

---

## Component Patterns

### Buttons

```css
/* Primary - Neon cyan with glow */
.btn-primary {
  background: linear-gradient(135deg, #00f0ff 0%, #00b8cc 100%);
  color: #0a0a0f;
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.4);
  border: none;
  border-radius: 8px;
  font-weight: 600;
}

/* Secondary - Outlined */
.btn-secondary {
  background: transparent;
  border: 1px solid #00f0ff;
  color: #00f0ff;
}

/* Danger - Pink for mafia/kill */
.btn-danger {
  background: linear-gradient(135deg, #ff2d95 0%, #cc0055 100%);
  box-shadow: 0 0 20px rgba(255, 45, 149, 0.4);
}
```

### Cards

```css
.card {
  background: #12121a;
  border: 1px solid rgba(0, 240, 255, 0.1);
  border-radius: 12px;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.card-highlighted {
  border-color: #00f0ff;
  box-shadow: 0 0 30px rgba(0, 240, 255, 0.2);
}
```

### Inputs

```css
.input {
  background: #0a0a0f;
  border: 1px solid #2a2a35;
  color: #ffffff;
  border-radius: 8px;
}

.input:focus {
  border-color: #00f0ff;
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.2);
}
```

### Player Items

```css
.player-item {
  background: #12121a;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 12px 16px;
}

.player-item:hover {
  background: #1a1a25;
  border-color: rgba(0, 240, 255, 0.3);
}

.player-item.selected {
  border-color: #00f0ff;
  background: rgba(0, 240, 255, 0.1);
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.15);
}

.player-item.dead {
  opacity: 0.4;
  filter: grayscale(0.5);
}

.player-item.mafia {
  border-color: #ff2d95;
  box-shadow: 0 0 15px rgba(255, 45, 149, 0.2);
}
```

### Status Tags

```css
.tag {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tag-waiting { background: rgba(0, 240, 255, 0.2); color: #00f0ff; }
.tag-playing { background: rgba(0, 255, 136, 0.2); color: #00ff88; }
.tag-mafia { background: rgba(255, 45, 149, 0.2); color: #ff2d95; }
.tag-citizen { background: rgba(0, 240, 255, 0.2); color: #00f0ff; }
```

### Timer

```css
.timer {
  font-size: 24px;
  font-weight: 700;
  color: #00f0ff;
  text-shadow: 0 0 20px rgba(0, 240, 255, 0.5);
  font-variant-numeric: tabular-nums;
}

.timer.urgent {
  color: #ff2d95;
  text-shadow: 0 0 20px rgba(255, 45, 149, 0.5);
  animation: pulse 1s infinite;
}
```

---

## Widget Specifications

### Chat Widget

- Dark container with cyan title glow
- Own messages: cyan gradient bubble, dark text
- Others' messages: dark surface, white text, pink sender name
- System messages: purple accent, centered
- Mafia chat: pink gradient for distinction
- Send button: cyan circular with glow

### Vote Widget

- Dark container with subtle cyan border glow
- Player items with vote count badges
- Selected state: cyan highlight
- Vote blocked: pink/red indicator
- Submit button: full-width cyan gradient

### Role Card Widget

- Team-based border colors (cyan/pink/purple)
- Animated glow border effect
- Large centered role icon
- Role name with team color glow
- Description and ability cards

### Lobby Widget

- Dark header with neon title
- Room cards with hover animations
- Status tags (waiting/playing/full)
- Player count progress bar
- Create room button: prominent cyan

### Night Action Widget

- Purple-dominant color scheme (night feel)
- Subtle star/particle background animation
- Scanning line effect
- Target selection with purple highlight
- Kill action uses pink accent
- Ability charge indicators

---

## Animations

```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes neonPulse {
  0%, 100% { box-shadow: 0 0 20px var(--glow-color); }
  50% { box-shadow: 0 0 35px var(--glow-color); }
}

@keyframes urgentPulse {
  0%, 100% { color: #ff2d95; text-shadow: 0 0 20px rgba(255, 45, 149, 0.5); }
  50% { color: #ff6b9d; text-shadow: 0 0 35px rgba(255, 45, 149, 0.8); }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## Mobile Responsiveness

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1023px
- Desktop: >= 1024px

### Key Mobile Adjustments
- Larger touch targets (min 44px height)
- Full-width buttons
- Reduced shadow complexity for performance
- 16px minimum font size for inputs (prevent iOS zoom)
- Safe area inset handling for notch devices

---

## File Structure

```
apps/mafia/res/widgets/
├── common/
│   ├── design-system.css    # All CSS variables, base styles
│   ├── components.css       # Buttons, cards, inputs, tags
│   ├── animations.css       # Keyframes and transitions
│   └── utilities.css        # Helper classes
├── lobby_widget.html
├── room_widget.html
├── vote_widget.html
├── approval_vote_widget.html
├── day_chat_widget.html
├── dead_chat_widget.html
├── night_action.html
├── role_card.html
├── final_defense_widget.html
├── game_status.html
├── system.html
└── fullscreen_widget.html
```

---

## Implementation Order

1. Create shared CSS files in `common/`
2. Update `lobby_widget.html`
3. Update `room_widget.html`
4. Update `vote_widget.html` and `approval_vote_widget.html`
5. Update `day_chat_widget.html` and `dead_chat_widget.html`
6. Update `night_action.html`
7. Update `role_card.html`
8. Update `final_defense_widget.html`
9. Update `game_status.html`
10. Update `system.html` and `fullscreen_widget.html`
