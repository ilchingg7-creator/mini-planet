# Yandex Release Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the Yandex SDK, Game Ready, rewarded advertising, localization, onboarding, and support findings.

**Architecture:** Keep platform calls behind `YandexBridge`; scenes consume only that interface. Keep UI overlays in `UIScene` and persistence helpers as pure functions where possible.

**Tech Stack:** TypeScript, Phaser 3, Vite, Vitest, Yandex Games SDK.

## Global Constraints

- `/sdk.js` must load before `YaGames.init()`.
- `LoadingAPI.ready()` runs only after playable scenes start.
- Never grant an ad reward on close or error.
- Locales are `ru` and `en`; SDK locale has priority.
- Support email is `seme4kak@yandex.ru`.

---

### Task 1: SDK bridge

**Files:** `index.html`, `src/game/systems/yandex.ts`, `tests/game/systems/yandex.test.ts`

- [x] Add typed SDK globals and bridge methods for locale, ready, and rewarded ads.
- [x] Add callback-semantic tests and run `npm.cmd test -- tests/game/systems/yandex.test.ts`.

### Task 2: Lifecycle and locale

**Files:** `src/game/scenes/BootScene.ts`, `src/game/scenes/PreloadScene.ts`, `src/game/i18n.ts`, `tests/game/i18n.test.ts`

- [x] Prefer SDK language and call Game Ready after scenes start.
- [x] Verify locale tests and production type checking.

### Task 3: Rewarded UX, onboarding, and contact

**Files:** `src/game/scenes/UIScene.ts`, `src/game/i18n.ts`

- [x] Add localized rewarded confirmation and pause/resume behavior.
- [x] Add two-step first-run guidance, RU/EN switch, and support overlay.
- [x] Verify interaction in the in-app browser.

### Task 4: Release verification

**Files:** `yandex-games-audit.yaml`, `docs/audits/2026-07-11-yandex-games-audit.*`

- [x] Run all tests, production build, `git diff --check`, and browser console checks.
- [x] Rerun the deterministic Yandex audit and update the verdict from fresh evidence.
