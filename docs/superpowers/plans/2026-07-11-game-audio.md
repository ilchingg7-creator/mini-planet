# Game Audio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four original biome soundtracks, responsive sound effects, and one persistent global sound toggle to Mini Planet.

**Architecture:** A pure audio-state module defines preferences and biome mappings; a Phaser-facing `AudioManager` owns playback and crossfades. Scenes only call semantic methods or emit gameplay events. A deterministic PowerShell generator creates project-owned WAV assets, and the existing approved-asset loader gains explicit audio support.

**Tech Stack:** TypeScript 5.8, Phaser 3.90, Vite 6, Vitest 3, PowerShell WAV generation.

## Global Constraints

- Four seamless 45–60 second loops: `green`, `sweet`, `sea`, and `moon`.
- One global enabled/disabled control for both music and effects; enabled by default.
- Playback starts only after the first player gesture.
- Ads and document visibility pause audio; gameplay must continue if audio is unavailable.
- All files are local, original project-generated audio under `public/assets/audio`.
- No sliders, separate mute controls, vocals, remote audio, or adaptive music layers.

## File Structure

- Create `scripts/generate-audio.ps1`: deterministic PCM WAV composer for four loops and eight effects.
- Create `src/game/systems/audioState.ts`: pure preference parsing and biome/music mapping.
- Create `src/game/systems/AudioManager.ts`: Phaser sound lifecycle, effects, crossfades, pause/resume.
- Create `tests/game/systems/audioState.test.ts`: pure unit coverage.
- Create `tests/game/systems/audioAssets.test.ts`: manifest/file coverage.
- Modify `src/game/data/assetManifest.ts`: audio record kinds and audio loading.
- Modify `src/game/assets/manifest.json`: provenance records for generated audio.
- Modify `src/game/scenes/BootScene.ts`: construct/register the manager and visibility cleanup.
- Modify `src/game/scenes/GameScene.ts`: semantic gameplay sound calls and biome music changes.
- Modify `src/game/scenes/UIScene.ts`: sound toggle, UI effects, and ad pause/resume delegation.

---

### Task 1: Pure Audio State and Mapping

**Files:**
- Create: `src/game/systems/audioState.ts`
- Test: `tests/game/systems/audioState.test.ts`

**Interfaces:**
- Produces: `AUDIO_PREFERENCE_KEY`, `MusicKey`, `readAudioEnabled(storage): boolean`, `writeAudioEnabled(storage, enabled): void`, `getBiomeMusicKey(biomeId): MusicKey | undefined`.

- [ ] **Step 1: Write failing tests** for default enabled state, persisted `0`/`1`, storage exceptions, all four mappings, and unknown biome.

```ts
import { describe, expect, it } from 'vitest';
import { getBiomeMusicKey, readAudioEnabled, writeAudioEnabled } from '../../../src/game/systems/audioState';

describe('audio state', () => {
  it('defaults to enabled and persists both values', () => {
    const values = new Map<string, string>();
    const storage = { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => values.set(k, v) };
    expect(readAudioEnabled(storage)).toBe(true);
    writeAudioEnabled(storage, false);
    expect(readAudioEnabled(storage)).toBe(false);
    writeAudioEnabled(storage, true);
    expect(readAudioEnabled(storage)).toBe(true);
  });

  it.each([['green', 'music_green'], ['sweet', 'music_sweet'], ['sea', 'music_sea'], ['moon', 'music_moon']])('maps %s', (biome, key) => {
    expect(getBiomeMusicKey(biome)).toBe(key);
  });

  it('tolerates unavailable storage and unknown biomes', () => {
    const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect(readAudioEnabled(broken)).toBe(true);
    expect(() => writeAudioEnabled(broken, false)).not.toThrow();
    expect(getBiomeMusicKey('unknown')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run** `npm test -- tests/game/systems/audioState.test.ts`; expect failure because the module does not exist.
- [ ] **Step 3: Implement** a constant record mapping the four biome IDs, defensive `try/catch` storage access, and exact `'0'`/`'1'` serialization.
- [ ] **Step 4: Run** the focused test; expect all tests to pass.
- [ ] **Step 5: Commit** with `git add src/game/systems/audioState.ts tests/game/systems/audioState.test.ts && git commit -m "feat: define audio preferences and biome tracks"`.

### Task 2: Generate and Register Original Audio Assets

**Files:**
- Create: `scripts/generate-audio.ps1`
- Create: `public/assets/audio/music_green.wav`
- Create: `public/assets/audio/music_sweet.wav`
- Create: `public/assets/audio/music_sea.wav`
- Create: `public/assets/audio/music_moon.wav`
- Create: `public/assets/audio/sfx_button.wav`, `sfx_create.wav`, `sfx_select.wav`, `sfx_merge.wav`, `sfx_coin.wav`, `sfx_invalid.wav`, `sfx_level.wav`, `sfx_reward.wav`
- Modify: `src/game/assets/manifest.json`
- Modify: `src/game/data/assetManifest.ts`
- Test: `tests/game/systems/audioAssets.test.ts`

**Interfaces:**
- Produces Phaser cache keys `music_<biome>` and `sfx_<event>`.

- [ ] **Step 1: Write a failing manifest test** asserting the twelve keys exist, paths start with `assets/audio/`, music records use kind `music`, effect records use `sfx`, and all records say `source: generated`, `license: project-generated`.
- [ ] **Step 2: Run** `npm test -- tests/game/systems/audioAssets.test.ts`; expect missing records.
- [ ] **Step 3: Implement the generator** using 44,100 Hz, 16-bit mono PCM, additive sine/triangle voices, short attack/release envelopes, biome-specific note sequences, exact whole-bar loop lengths between 45 and 60 seconds, and peak normalization capped at 0.75. Accept `-OutputDirectory public/assets/audio`, create the directory, and overwrite only the twelve named files.
- [ ] **Step 4: Run** `powershell -ExecutionPolicy Bypass -File scripts/generate-audio.ps1`; expect twelve non-empty WAV files.
- [ ] **Step 5: Register assets** in `manifest.json`; extend `AssetKind` with `'music' | 'sfx'`, and change `loadApprovedAssets` to call `scene.load.audio(asset.key, asset.path)` for those kinds and `scene.load.image` otherwise.
- [ ] **Step 6: Run** `npm test -- tests/game/systems/audioAssets.test.ts` and `npm run build`; expect pass and a successful Vite build.
- [ ] **Step 7: Commit** all generator, audio, manifest, loader, and test files with `git commit -m "feat: add original game audio assets"`.

### Task 3: Phaser Audio Manager

**Files:**
- Create: `src/game/systems/AudioManager.ts`
- Modify: `src/game/scenes/BootScene.ts`

**Interfaces:**
- Consumes: `MusicKey`, preference helpers, Phaser `SoundManager`.
- Produces: `unlock(biomeId): void`, `setBiome(biomeId): void`, `playEffect(key: EffectKey): void`, `toggle(): boolean`, `isEnabled(): boolean`, `pause(): void`, `resume(): void`, `destroy(): void`.

- [ ] **Step 1: Add a small injectable sound-port test seam** and unit tests verifying no playback before `unlock`, correct first track, no duplicate track, crossfade on biome change, mute persistence, ignored missing sounds, and pause/resume.
- [ ] **Step 2: Run the focused test** and expect module-not-found failure.
- [ ] **Step 3: Implement `AudioManager`** with music volume `0.32`, effects volume `0.55`, 600 ms crossfade tweens, one active loop, guarded cache lookups, and idempotent lifecycle methods.
- [ ] **Step 4: Register one manager** in `BootScene` under registry key `audioManager`; attach `visibilitychange` to pause when hidden and resume when visible, and remove the listener on game destruction.
- [ ] **Step 5: Run focused tests and `npm run build`**; expect pass.
- [ ] **Step 6: Commit** with `git commit -m "feat: manage music and sound playback"`.

### Task 4: Gameplay and UI Integration

**Files:**
- Modify: `src/game/scenes/GameScene.ts`
- Modify: `src/game/scenes/UIScene.ts`
- Modify: `src/game/i18n.ts`

**Interfaces:**
- Consumes: registry `audioManager` and its public methods from Task 3.

- [ ] **Step 1: Add scene-level tests or extracted callback tests** asserting the action-to-effect mapping: create→`sfx_create`, select→`sfx_select`, merge→`sfx_merge` then `sfx_coin`, full board→`sfx_invalid`, level advance→`sfx_level`, reward→`sfx_reward`, ordinary UI→`sfx_button`.
- [ ] **Step 2: Run focused tests** and confirm they fail before integration.
- [ ] **Step 3: Integrate `GameScene`**: unlock on the first create/slot gesture, call `setBiome` after save/progression updates, and play effects only when the corresponding state transition succeeds.
- [ ] **Step 4: Integrate `UIScene`**: add a third utility button showing `🔊` or `🔇`, toggle and refresh its label, play button/reward effects, and replace direct `this.sound.pauseAll/resumeAll` ad handling with manager `pause/resume`.
- [ ] **Step 5: Add localized accessible labels** `soundOn` and `soundOff` in Russian and English and apply them to the toggle hit area.
- [ ] **Step 6: Run** `npm test` and `npm run build`; expect the full suite and production build to pass.
- [ ] **Step 7: Commit** with `git commit -m "feat: connect audio to game interactions"`.

### Task 5: Browser Verification and Final Polish

**Files:**
- Modify only files whose behavior fails the checks below.

**Interfaces:**
- Consumes the complete audio system.

- [ ] **Step 1: Start** `npm run dev` and open the local game in a browser.
- [ ] **Step 2: Verify autoplay behavior**: reload, confirm silence before interaction, then create an item and confirm green music begins once.
- [ ] **Step 3: Verify interaction effects** for create, select, successful merge, coin reward, full board, level transition, reward modal, and normal buttons.
- [ ] **Step 4: Verify preference behavior**: toggle off, reload, confirm silence and muted icon; toggle on and confirm correct music resumes.
- [ ] **Step 5: Verify lifecycle behavior**: switch tabs and exercise the rewarded-ad stub; confirm pause/resume with no doubled loop.
- [ ] **Step 6: Verify all four tracks** by setting current biome in a controlled local save, reloading, and listening through at least two loop boundaries per track for clicks, drift, imbalance, or fatigue.
- [ ] **Step 7: Run final evidence commands**: `npm test`, `npm run build`, and `git diff --check`; all must exit 0.
- [ ] **Step 8: Commit any polish** with `git commit -m "fix: polish game audio playback"`; skip this commit if no files changed.
