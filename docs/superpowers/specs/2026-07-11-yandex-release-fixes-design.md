# Yandex Release Fixes Design

## Goal

Bring Mini Planet from the 2026-07-11 audit verdict `NOT_READY` to a build with a real Yandex Games SDK integration, correct Game Ready timing, explicit rewarded-ad UX, SDK-driven localization, first-run guidance, and support contact information.

## SDK boundary

`systems/yandex.ts` owns all Yandex globals and exposes a typed bridge. It initializes `YaGames`, reports the SDK locale, marks the game ready, and resolves rewarded ads only after `onRewarded`. Localhost uses a deterministic fallback; a failed SDK on a non-local host never grants ad rewards.

## Lifecycle and localization

Boot initializes the bridge and chooses locale from `ysdk.environment.i18n.lang`, falling back to browser languages. Preload calls Game Ready only after assets are loaded and both game scenes have started. The UI offers a compact RU/EN switch and restarts only the UI scene when changed.

## Rewarded UX

The x2 control opens a localized confirmation overlay describing the ad and exact reward. During a real ad, gameplay timers and audio pause. The boost is granted only from `onRewarded`; close/error restores the game without reward.

## Onboarding and contact

A two-step first-run overlay points to Create and then explains merging two equal items. Completion is stored separately in local storage. A compact info control displays `seme4kak@yandex.ru`.

## Verification

Unit tests cover SDK locale mapping and rewarded callback semantics. Existing tests, production build, desktop/mobile browser checks, save restoration, and the pinned Yandex audit are rerun.
