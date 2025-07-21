# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a ZEP Script application for a Mafia game built in TypeScript. ZEP is a virtual world platform where this app runs as a mini-game. The project is structured as a monorepo with shared libraries and a main mafia application.

## Build Commands

**Root level:**
- `npm run build` - Builds the mafia app, runs webpack, archives with zep-script, and creates mafia.zepapp.zip

**In apps/mafia directory:**
- `npm run build` - Runs webpack to build the TypeScript code
- `npm run pack` - Builds and archives the project
- `npm run archive` - Creates a .zepapp.zip file for upload to ZEP
- `npm run deploy` - Publishes the app to ZEP platform
- `npm run yaho` - Full pipeline: build, archive, and deploy

## Linting

The project uses ESLint with TypeScript support:
- Configuration in `eslint.config.mjs`
- Key rule customizations: allows `@ts-ignore`, disables explicit any warnings, allows empty catch blocks
- Run linting from root with standard ESLint commands

## Architecture

### Core Structure
- `libs/core/` - Shared game engine and utilities
  - `GameBase.ts` - Base game class that all games extend
  - `mafia/Game.ts` - Main mafia game implementation (singleton)
  - `@common/` - Common base classes and utilities shared across games

### Mafia Game Architecture
- **Manager Pattern**: Core functionality split into specialized managers
  - `GameRoomManager` - Handles multiple game rooms, game modes registration
  - `GameFlowManager` - Controls game state, phases (day/night), voting
  - `WidgetManager` - Manages UI widgets (singleton pattern)
  - `SpriteManager` - Handles visual sprites and effects
- **Game Rooms**: Each game instance runs in a `GameRoom` with configurable game modes
- **Widgets**: HTML-based UI components in `res/widgets/` for different game screens

### Key Design Patterns
- Singleton pattern for managers (WidgetManager, SpriteManager, Game)
- Event-driven architecture with callbacks and message handlers
- Template-based configuration system for game modes

### ZEP Platform Constraints
- **TypeScript only** - No external libraries or web APIs allowed (enforced by Cursor rules)
- Uses ZEP's built-in `ScriptApp` API for game functionality
- Widget system uses ZEP's widget framework
- All resources (images, sounds, HTML) must be in `res/` directory

### File Structure
- `apps/mafia/` - Main application entry point and resources
- `libs/` - Shared libraries organized by domain
- `res/widgets/` - HTML widget templates with embedded CSS/JS
- Entry point: `apps/mafia/main.ts`

## Important Notes

- Game supports Korean language (코멘트 in Korean throughout codebase)
- Uses webpack for bundling TypeScript to single output file
- Widget HTML files contain embedded CSS and JavaScript
- All managers implement callback systems for extensibility
- Game rooms can be configured with different game modes via `GameMode` objects