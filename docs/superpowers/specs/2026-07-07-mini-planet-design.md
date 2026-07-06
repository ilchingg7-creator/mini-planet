# Mini Planet Design Spec

Date: 2026-07-07

## Goal

Build a very simple mass-market HTML5 game for Yandex Games where the main appeal comes from clear visual progress, cute generated assets, and a short merge-idle loop. The project must avoid mechanical complexity. The first playable version should be fast to implement and easy to polish.

Working title: **Mini Planet: Собери свой мир**

## Product Positioning

Mini Planet is a portrait-mode hypercasual merge-idle collection game for a broad 0+/6+ audience.

The player grows a small planet by creating and merging cute objects. Each newly discovered object appears as a visible decoration on the planet. The hook is immediate: the planet changes on the main screen, so progress is visible without opening extra menus.

## Core Promise

One screen, one action, one visible reward:

1. Tap `Создать`.
2. Get a small item.
3. Merge two matching items.
4. Unlock a new item.
5. See a new decoration appear on the planet.

The game should feel satisfying because of assets, presentation, and pacing, not because of many mechanics.

## Main Screen

The entire MVP runs from one gameplay screen.

Required layout:

- Center: a cute round planet sprite.
- Top: compact currency and planet level.
- Bottom: six item slots for the merge board.
- Primary button: `Создать`.
- Secondary button: `Улучшить`.
- Small settings button.

The approved concept direction is bright toy-like 3D game art with soft shapes, clean silhouettes, and readable mobile UI. The generated preview image is a style reference, not a final asset.

## MVP Mechanics

The MVP must include only these mechanics:

- Tap/click `Создать` to generate a base item.
- Six item slots.
- Tap one item, then tap a matching item to merge them.
- Merging two equal items creates the next item in the current biome chain.
- First-time discovery of an item unlocks a matching decoration on the planet.
- Discovered decorations increase passive coin income.
- Coins buy simple upgrades.
- Offline income is calculated from the last saved time.

The MVP must not include:

- Real physics.
- 3D rendering.
- Drag-and-drop as a required input.
- Multiple gameplay screens.
- Combat.
- Character systems.
- Quests.
- Daily tasks.
- Complex inventory.
- Random gacha presentation.
- Casino-like visuals or language.
- Procedural content generation at runtime.

## Initial Content

The first playable build should contain two biomes.

### Green Biome

Items:

1. Росток
2. Цветок
3. Гриб
4. Дерево
5. Домик
6. Пруд
7. Мельница
8. Радуга

### Sweet Biome

Items:

1. Конфета
2. Кекс
3. Пончик
4. Вафля
5. Фонтан сиропа
6. Мармеладное дерево
7. Торт-дом
8. Сахарный замок

Post-MVP biomes can add lunar and magic themes, but they are not required before the first playable version is fun.

## Economy

The economy should be deliberately small.

Resources:

- Coins.
- Planet level.
- Current biome.

Upgrades:

- `Автосоздание`: periodically creates a base item when there is a free slot.
- `Доход планеты`: increases passive coin income from unlocked decorations.
- `Больше места`: unlocks the fifth and sixth slots if we choose to start with four slots during early testing.

The first implementation can start with all six slots unlocked if that is faster and clearer.

## Monetization Hooks

The MVP should define safe hooks but can use local stubs before Yandex SDK integration.

Rewarded ad hooks:

- Double passive income for two minutes.
- Create one item one tier higher than the base item.

Interstitial ads:

- Only after calm milestones such as unlocking a biome.
- Never during a merge action.

No banner ads in the MVP main layout unless later testing proves the screen has enough space.

## Save Data

Save data must include:

- Coins.
- Planet level.
- Current biome.
- Merge slot contents.
- Discovered items.
- Upgrade levels.
- Rewarded boost end time.
- Last save timestamp for offline income.

First implementation uses `localStorage`. The code should expose a save adapter so Yandex Games cloud saves can be added later without rewriting game logic.

## Asset Strategy

Assets are mandatory. The game should not ship with CSS-only placeholders or abstract geometric stand-ins as primary visuals.

Every gameplay asset must go through preview and approval before it is treated as final.

Asset approval workflow:

1. Generate or find candidate assets.
2. Show preview to the user.
3. User approves or requests changes.
4. Copy approved assets into the project.
5. Record source, generation prompt, or license note in an asset manifest.
6. Use the approved file in the game.

Generated assets are preferred for:

- Planet bases.
- Item icons.
- Decoration sprites.
- Background.
- Promo art.

Open-source assets can be used only when the license is clear and compatible with Yandex Games publication. Each external asset needs its source URL and license captured in the asset manifest.

## Required Asset List

MVP assets:

- 1 main background.
- 1 green planet base.
- 1 sweet planet base or planet overlay.
- 16 item icons.
- 12-16 planet decorations.
- Coin icon.
- Energy or create icon.
- Upgrade icon.
- Settings icon.
- Simple logo/title image.

Promo assets before publication:

- Game icon.
- Cover image.
- 3 screenshots or promotional compositions.

## Visual Style

Style rules:

- Bright 3D toy-like illustration.
- Soft rounded shapes.
- Clean silhouettes.
- No text inside item art.
- No copyrighted characters.
- No brand logos.
- No realistic people.
- No dark sci-fi tone.
- No purple-gradient-dominant palette.
- No casino, case-opening, or gambling visual language.

The UI can use native canvas/text rendering. Item, planet, decoration, background, and promo visuals should be raster assets.

## Animation Scope

Animations must be simple and deterministic.

Allowed MVP animations:

- Planet idle bobbing.
- Decoration pop-in when unlocked.
- Item slot bounce on creation.
- Merge flash and scale pulse.
- Coin number increment.
- Button press scale.

Not allowed in MVP:

- Skeletal animation.
- Complex particle systems.
- Physics-based animation.
- Long cinematic sequences.
- Procedural animation systems that require tuning.

Animation previews should be implemented with temporary sprites first, then checked in the running game before final polish.

## Technical Direction

Recommended stack:

- Vite.
- TypeScript.
- Phaser 3.

Reasoning:

- Fast HTML5 setup.
- Good sprite and tween support.
- Simple asset loading.
- Suitable for Yandex Games.
- Enough structure without forcing a large engine workflow.

Proposed modules:

- `BootScene`: game boot and SDK stub initialization.
- `PreloadScene`: asset loading.
- `GameScene`: planet, item slots, merge actions, simple animations.
- `UIScene`: buttons, counters, modals.
- `data/biomes.ts`: biome and item definitions.
- `systems/merge.ts`: merge rules.
- `systems/economy.ts`: coins, passive income, upgrade costs.
- `systems/save.ts`: local save adapter.
- `systems/yandex.ts`: Yandex SDK wrapper and local fallback.
- `assets/manifest.json`: approved asset references and source notes.

## Yandex Games Constraints

The game should be prepared for Yandex Games from the start:

- HTML5 build.
- Portrait mobile support.
- Mouse and touch input.
- No external runtime asset loading required for core gameplay.
- No interactive generative AI in the published game.
- All generated and external assets must have documented rights/source notes.
- Save and ads should be wrapped so Yandex SDK integration is isolated.
- Build size must stay well under 100 MB.

## Success Criteria

The MVP is successful when:

- A new player understands the action within five seconds.
- A player can unlock several decorations without reading instructions.
- The planet visibly changes during the first minute.
- The game remains playable on mobile portrait screens.
- There are at least 10 minutes of unlockable content across the first two biomes.
- All non-placeholder gameplay assets have been previewed and approved.
- The implementation has no required mechanics beyond tap, merge, upgrade, and save.

## Open Decisions

These are intentionally deferred until implementation preview:

- Whether the MVP starts with four or six slots.
- Whether biome switching is manual or automatic after item 8.
- Exact upgrade prices.
- Final name and icon.

