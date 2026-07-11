# Yandex Games Audit: Mini Planet

Date: 2026-07-11
Rules snapshot: requirements updated 2026-05-05, catalog checked 2026-06-19.

## Latest deterministic result

- BLOCKER: 0
- ERROR: 0
- WARNING: 0
- MANUAL: 110
- PASS: 0

The deterministic audit intentionally leaves gameplay, moderation, rights, archive, and promo checks as `MANUAL`; it does not convert them to `PASS` automatically.

## Fixed findings

### Rule 1.1 — Yandex Games SDK is embedded

- The game dynamically loads `/sdk.js` before SDK initialization.
- `YaGames.init()` is represented by the injected typed SDK global and all platform behavior is isolated in `src/game/systems/yandex.ts`.
- Source: https://yandex.ru/dev/games/doc/ru/concepts/requirements#1-1

### Rule 1.19.2 — LoadingAPI.ready is called at the playable moment

- `markReady()` calls `ysdk.features.LoadingAPI.ready()` only after `GameScene` and interactive `UIScene` controls are created.
- Source: https://yandex.ru/dev/games/doc/ru/concepts/requirements#1-19-2

### Rule 4.5.1 — Rewarded-ad UI explains viewing and reward

- The x2 button is explicitly marked as advertising.
- A localized confirmation explains that watching an ad doubles merge coins for two minutes.
- Rewards are granted only after `onRewarded`; close and error paths return no reward.
- Gameplay and sound pause during the ad and resume on close.
- Source: https://yandex.ru/dev/games/doc/ru/concepts/requirements#4-5-1

### Rules 2.14, 6.8, 6.9, and 6.1

- Locale now prefers `ysdk.environment.i18n.lang`, with browser fallback and a visible RU/EN switch.
- First run guides the player through two creates and one merge.
- The support dialog displays `seme4kak@yandex.ru`.
- Sources: https://yandex.ru/dev/games/doc/ru/concepts/requirements, https://yandex.ru/dev/games/doc/ru/concepts/requirements#6-8, https://yandex.ru/dev/games/doc/ru/concepts/requirements#6-9, https://yandex.ru/dev/games/doc/ru/concepts/requirements#6-1

## Runtime evidence

- Desktop and portrait mobile builds load without runtime errors or detected overflow.
- RU/EN switching updates all visible gameplay text.
- Reward confirmation, cancellation, local rewarded fallback, and the two-minute timer work.
- The first-run tutorial advances after two creates and disappears after a successful merge.
- Created and merged progress survives reload.
- 37 unit tests pass and the production build succeeds.
- The unpacked build remains below 100 MB.

## Remaining manual release work

- Test the draft inside the Yandex debug panel to exercise the real ad callbacks and verify the Game Ready and I18N indicators.
- Build and inspect the exact submission ZIP; rule 1.21 remains manual until that archive exists.
- Add and audit the final icon, cover, screenshots, descriptions, category, age rating, and rights records.
- Review sound/pause requirements if audio is added later.

## Verdict

Code-level audit blockers are fixed. The game is ready for final Yandex draft testing and publication-asset review, but acceptance is not guaranteed and the final ZIP/promo checks are still required.
