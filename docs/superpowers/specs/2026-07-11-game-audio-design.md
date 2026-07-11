# Game Audio Design

Date: 2026-07-11

## Goal

Add a cohesive, cozy fairy-tale audio identity to Mini Planet. Audio must make the short create-and-merge loop feel rewarding, distinguish all four release biomes, remain comfortable during repeated play, and comply with mobile browser and Yandex Games behavior.

## Creative Direction

The soundtrack uses soft, toy-like instrumentation and simple memorable motifs. It should feel warm and magical rather than energetic, dramatic, or arcade-like. All music and sound effects will be generated locally for this project, so the project has a consistent style and a documented original source.

Each biome receives a seamless 45–60 second loop:

- Green: marimba, soft flute, and light natural accents; 80–90 BPM.
- Sweet: bells, gentle xylophone, and rounded plucked tones; 85–95 BPM.
- Sea: soft arpeggios, glassy tones, and restrained watery accents; 75–85 BPM.
- Moon: airy synthesizer pads and crystalline notes; 70–80 BPM.

Loops must avoid sharp attacks, heavy bass, vocals, copyrighted melodies, and tiring high-frequency repetition. Master loudness must be consistent across all four tracks.

## Sound Effects

The release audio set contains short effects for:

- UI button press.
- Item creation.
- Item selection.
- Successful merge.
- Coin reward.
- Full-board or invalid-action feedback.
- Level or biome advancement.
- Reward confirmation.

Effects must be immediately readable at low volume and must not mask the music. Repeated actions may use small pitch variations to reduce fatigue. Invalid-action feedback should be soft and informative, not punitive.

## Runtime Architecture

An `AudioManager` owns music and effect playback. Scenes communicate intent through its public methods and do not manage individual sound instances. The manager:

- Maps biome IDs to music keys.
- Starts audio only after the first player gesture, respecting browser autoplay rules.
- Keeps one active music loop and crossfades when the current biome changes.
- Plays named effects for gameplay and UI events.
- Applies the single global enabled/disabled preference.
- Pauses and resumes audio for advertisements and document visibility changes.
- Avoids overlapping duplicate loops after scene restarts.

The audio preference is stored independently in `localStorage` under a versioned key. Audio is enabled by default, but playback does not begin until user interaction. A single utility button toggles all music and effects and visibly shows the current state.

## Integration Flow

`PreloadScene` loads the four music loops and sound effects from local assets. `GameScene` reports creation, selection, merge, error, reward, and biome-change events. `UIScene` reports button and modal interactions, renders the sound toggle, and delegates ad pause/resume behavior to the manager. The manager selects the correct track from the active biome ID.

If an audio asset fails to load or the browser cannot create an audio context, gameplay continues silently without blocking input, saving, ads, or progression. Missing individual effects are ignored. A missing biome track leaves the current valid track playing or remains silent if none is available.

## Asset Format and Provenance

Music and effects are produced by a deterministic local generation script and stored under `public/assets/audio`. Browser-compatible compressed files are preferred for distribution, with a compatible fallback only where the build requires it. The asset manifest records each file as original project-generated audio, the generation method, and its role.

The combined audio payload should remain modest for an HTML5 game. The implementation will favor mono effects and appropriately compressed music while checking that looping and transients remain clean.

## Testing and Acceptance

Automated tests cover preference serialization, biome-to-track mapping, and manager state transitions without requiring audible output. Existing tests must continue to pass, and the production build must complete successfully.

Manual browser verification confirms:

- No audio starts before the first gesture.
- The first gesture starts the correct biome track.
- Each biome selects its own seamless loop.
- Create, select, merge, coin, invalid, level, and reward interactions play the intended effect.
- The global toggle immediately mutes or restores all audio and survives reload.
- Ads and tab visibility pause and resume audio without duplicate playback.
- Missing or unavailable audio does not interrupt gameplay.
- Music and effects are balanced and remain pleasant over several loop repetitions.

## Out of Scope

- Separate music and effects sliders.
- Separate music and effects mute controls.
- Adaptive multi-layer music.
- Spoken dialogue or vocals.
- Remote audio loading.
- User-selected tracks.
