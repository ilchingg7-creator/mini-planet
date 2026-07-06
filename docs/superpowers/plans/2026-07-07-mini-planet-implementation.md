# Mini Planet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fast playable Mini Planet prototype that uses a data-driven content model, approved raster assets, simple merge-idle mechanics, saves, and Yandex Games-ready wrappers.

**Architecture:** Keep all game rules in pure TypeScript systems with Vitest coverage, and keep Phaser scenes thin. Content is loaded from biome data and an asset manifest so release content can grow from 2 prototype biomes to 4 launch biomes and 8 planned biomes without changing merge logic.

**Tech Stack:** Vite, TypeScript, Phaser 3, Vitest, HTML5 Canvas/WebGL, localStorage first, Yandex Games SDK wrapper later.

## Global Constraints

- One gameplay screen for MVP.
- Portrait mobile support.
- Mouse and touch input.
- No real physics.
- No 3D rendering.
- No drag-and-drop as a required input.
- No combat, quests, character systems, complex inventory, or daily tasks in MVP.
- Prototype content: 2 biomes, 8 items per biome.
- First release content target: 4 biomes, 12 items per biome, 48 item discoveries.
- Post-release content roadmap: 8 planned biomes, 12 items per biome, 96 item discoveries.
- Content data must support arbitrary biome and item counts; merge logic must not hard-code 8 or 12.
- Gameplay assets must be raster assets, previewed and approved before final use.
- External assets require source URL and license note in the asset manifest.
- Generated assets require prompt and approval status in the asset manifest.
- No interactive generative AI in the published game.
- Build size must stay well under 100 MB.

---

## File Structure

- `package.json`: npm scripts and dependencies.
- `index.html`: Vite app entry.
- `src/main.ts`: starts Phaser.
- `src/game/config.ts`: Phaser config factory.
- `src/game/scenes/BootScene.ts`: SDK stub initialization and transition.
- `src/game/scenes/PreloadScene.ts`: asset loading from manifest.
- `src/game/scenes/GameScene.ts`: planet, slots, input, tweens.
- `src/game/scenes/UIScene.ts`: top bar, buttons, simple modal text.
- `src/game/data/biomes.ts`: prototype and release biome data.
- `src/game/data/assetManifest.ts`: typed asset metadata consumed by preload.
- `src/game/systems/types.ts`: shared pure system types.
- `src/game/systems/merge.ts`: slot selection, creation, merge rules.
- `src/game/systems/economy.ts`: passive income, upgrade costs, boosts.
- `src/game/systems/save.ts`: localStorage save adapter and schema migration.
- `src/game/systems/yandex.ts`: SDK facade with local fallback.
- `src/game/assets/manifest.json`: approval/source metadata for approved assets.
- `public/assets/approved/`: final approved raster assets used by the build.
- `public/assets/temp/`: temporary preview assets used only during implementation previews.
- `tests/game/data/biomes.test.ts`: content validation.
- `tests/game/systems/merge.test.ts`: merge behavior.
- `tests/game/systems/economy.test.ts`: economy behavior.
- `tests/game/systems/save.test.ts`: save behavior.

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `src/main.ts`
- Create: `src/game/config.ts`
- Create: `src/game/scenes/BootScene.ts`
- Create: `src/game/scenes/PreloadScene.ts`
- Create: `src/game/scenes/GameScene.ts`
- Create: `src/game/scenes/UIScene.ts`

**Interfaces:**
- Produces: `createGameConfig(parent: string): Phaser.Types.Core.GameConfig`
- Produces: scene keys `BootScene`, `PreloadScene`, `GameScene`, `UIScene`

- [ ] **Step 1: Create package metadata**

Create `package.json`:

```json
{
  "name": "mini-planet-yandex-game",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview --host 127.0.0.1",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "phaser": "^3.90.0"
  },
  "devDependencies": {
    "@vitejs/plugin-legacy": "^6.0.0",
    "typescript": "^5.8.0",
    "vite": "^7.0.0",
    "vitest": "^3.2.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`

Expected: `package-lock.json` is created and npm reports no vulnerabilities that block local development.

- [ ] **Step 3: Create Vite and TypeScript config**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vitest/globals"],
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src", "tests", "vite.config.ts", "vitest.config.ts"]
}
```

Create `vite.config.ts`:

```ts
import legacy from '@vitejs/plugin-legacy';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
  ],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
});
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Create HTML entry**

Create `index.html`:

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Mini Planet</title>
    <style>
      html,
      body,
      #game {
        width: 100%;
        height: 100%;
        margin: 0;
        overflow: hidden;
        background: #aee8ff;
      }
    </style>
  </head>
  <body>
    <div id="game"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 5: Create Phaser bootstrap**

Create `src/main.ts`:

```ts
import Phaser from 'phaser';
import { createGameConfig } from './game/config';

new Phaser.Game(createGameConfig('game'));
```

Create `src/game/config.ts`:

```ts
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { PreloadScene } from './scenes/PreloadScene';
import { UIScene } from './scenes/UIScene';

export function createGameConfig(parent: string): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#aee8ff',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 720,
      height: 1280,
    },
    render: {
      pixelArt: false,
      antialias: true,
    },
    scene: [BootScene, PreloadScene, GameScene, UIScene],
  };
}
```

Create `src/game/scenes/BootScene.ts`:

```ts
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    this.scene.start('PreloadScene');
  }
}
```

Create `src/game/scenes/PreloadScene.ts`:

```ts
import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  create(): void {
    this.scene.start('GameScene');
    this.scene.launch('UIScene');
  }
}
```

Create `src/game/scenes/GameScene.ts`:

```ts
import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create(): void {
    this.add.rectangle(360, 640, 720, 1280, 0xaee8ff);
    this.add.circle(360, 520, 170, 0x7bdc6f);
    this.add.text(360, 520, 'Mini Planet', {
      fontFamily: 'Arial',
      fontSize: '42px',
      color: '#17442a',
    }).setOrigin(0.5);
  }
}
```

Create `src/game/scenes/UIScene.ts`:

```ts
import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create(): void {
    this.add.text(32, 28, 'Монеты: 0', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#17442a',
    });
  }
}
```

- [ ] **Step 6: Verify scaffold**

Run: `npm run build`

Expected: TypeScript passes and Vite writes `dist/`.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json index.html tsconfig.json vite.config.ts vitest.config.ts src
git commit -m "chore: scaffold mini planet app"
```

---

### Task 2: Data-Driven Biomes and Content Validation

**Files:**
- Create: `src/game/systems/types.ts`
- Create: `src/game/data/biomes.ts`
- Create: `tests/game/data/biomes.test.ts`

**Interfaces:**
- Produces: `BiomeDefinition`, `ItemDefinition`
- Produces: `BIOMES: BiomeDefinition[]`
- Produces: `getBiomeById(id: string): BiomeDefinition | undefined`
- Produces: `getItemById(itemId: string): ItemDefinition | undefined`

- [ ] **Step 1: Write failing content validation tests**

Create `tests/game/data/biomes.test.ts`:

```ts
import { BIOMES, getBiomeById, getItemById } from '../../../src/game/data/biomes';

describe('biome content', () => {
  it('ships prototype data with two playable biomes', () => {
    expect(BIOMES.map((biome) => biome.id)).toEqual(['green', 'sweet']);
    expect(BIOMES.every((biome) => biome.items.length >= 8)).toBe(true);
  });

  it('keeps item order data-driven and unique', () => {
    const ids = new Set<string>();

    for (const biome of BIOMES) {
      biome.items.forEach((item, index) => {
        expect(item.tier).toBe(index);
        expect(ids.has(item.id)).toBe(false);
        ids.add(item.id);
      });
    }
  });

  it('finds biomes and items by id', () => {
    expect(getBiomeById('green')?.title).toBe('Зелёная планета');
    expect(getItemById('green_flower')?.title).toBe('Цветок');
    expect(getItemById('missing')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/game/data/biomes.test.ts`

Expected: FAIL because `src/game/data/biomes.ts` does not exist.

- [ ] **Step 3: Add shared types**

Create `src/game/systems/types.ts`:

```ts
export type BiomeId = string;
export type ItemId = string;

export interface ItemDefinition {
  id: ItemId;
  biomeId: BiomeId;
  tier: number;
  title: string;
  iconKey: string;
  decorKey: string;
  baseIncome: number;
}

export interface BiomeDefinition {
  id: BiomeId;
  title: string;
  planetAssetKey: string;
  backgroundAssetKey: string;
  items: ItemDefinition[];
}
```

- [ ] **Step 4: Add prototype biome data**

Create `src/game/data/biomes.ts`:

```ts
import type { BiomeDefinition, ItemDefinition } from '../systems/types';

const greenItems = [
  ['sprout', 'Росток', 1],
  ['flower', 'Цветок', 2],
  ['mushroom', 'Гриб', 4],
  ['tree', 'Дерево', 8],
  ['house', 'Домик', 16],
  ['pond', 'Пруд', 32],
  ['mill', 'Мельница', 64],
  ['rainbow', 'Радуга', 128],
] as const;

const sweetItems = [
  ['candy', 'Конфета', 2],
  ['cupcake', 'Кекс', 4],
  ['donut', 'Пончик', 8],
  ['waffle', 'Вафля', 16],
  ['syrup_fountain', 'Фонтан сиропа', 32],
  ['jelly_tree', 'Мармеладное дерево', 64],
  ['cake_house', 'Торт-дом', 128],
  ['sugar_castle', 'Сахарный замок', 256],
] as const;

function buildItems(
  biomeId: string,
  rows: readonly (readonly [string, string, number])[],
): ItemDefinition[] {
  return rows.map(([slug, title, baseIncome], tier) => ({
    id: `${biomeId}_${slug}`,
    biomeId,
    tier,
    title,
    iconKey: `item_${biomeId}_${slug}`,
    decorKey: `decor_${biomeId}_${slug}`,
    baseIncome,
  }));
}

export const BIOMES: BiomeDefinition[] = [
  {
    id: 'green',
    title: 'Зелёная планета',
    planetAssetKey: 'planet_green',
    backgroundAssetKey: 'background_day',
    items: buildItems('green', greenItems),
  },
  {
    id: 'sweet',
    title: 'Сладкая планета',
    planetAssetKey: 'planet_sweet',
    backgroundAssetKey: 'background_day',
    items: buildItems('sweet', sweetItems),
  },
];

export function getBiomeById(id: string): BiomeDefinition | undefined {
  return BIOMES.find((biome) => biome.id === id);
}

export function getItemById(itemId: string): ItemDefinition | undefined {
  return BIOMES.flatMap((biome) => biome.items).find((item) => item.id === itemId);
}
```

- [ ] **Step 5: Run tests**

Run: `npm test -- tests/game/data/biomes.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/game/systems/types.ts src/game/data/biomes.ts tests/game/data/biomes.test.ts
git commit -m "feat: add data-driven biome definitions"
```

---

### Task 3: Merge System

**Files:**
- Modify: `src/game/systems/types.ts`
- Create: `src/game/systems/merge.ts`
- Create: `tests/game/systems/merge.test.ts`

**Interfaces:**
- Consumes: `ItemId`
- Produces: `GameSlot`, `MergeState`
- Produces: `createInitialMergeState(slotCount: number): MergeState`
- Produces: `createBaseItem(state: MergeState, baseItemId: ItemId): MergeState`
- Produces: `selectSlot(state: MergeState, slotIndex: number, nextItemId: ItemId | undefined): MergeState`

- [ ] **Step 1: Write failing merge tests**

Create `tests/game/systems/merge.test.ts`:

```ts
import {
  createBaseItem,
  createInitialMergeState,
  selectSlot,
} from '../../../src/game/systems/merge';

describe('merge system', () => {
  it('creates a base item in the first empty slot', () => {
    const state = createBaseItem(createInitialMergeState(3), 'green_sprout');

    expect(state.slots.map((slot) => slot.itemId)).toEqual(['green_sprout', undefined, undefined]);
  });

  it('does not create an item when slots are full', () => {
    const state = createBaseItem(
      createBaseItem(createInitialMergeState(1), 'green_sprout'),
      'green_sprout',
    );

    expect(state.slots.map((slot) => slot.itemId)).toEqual(['green_sprout']);
  });

  it('selects the first item and merges with a matching second item', () => {
    const filled = createBaseItem(
      createBaseItem(createInitialMergeState(3), 'green_sprout'),
      'green_sprout',
    );

    const selected = selectSlot(filled, 0, 'green_flower');
    const merged = selectSlot(selected, 1, 'green_flower');

    expect(merged.selectedSlotIndex).toBeUndefined();
    expect(merged.slots.map((slot) => slot.itemId)).toEqual(['green_flower', undefined, undefined]);
    expect(merged.lastDiscoveryItemId).toBe('green_flower');
  });

  it('switches selection when second selected slot does not match', () => {
    const initial = createInitialMergeState(2);
    const withItems = {
      ...initial,
      slots: [
        { index: 0, itemId: 'green_sprout' },
        { index: 1, itemId: 'green_flower' },
      ],
    };

    const selected = selectSlot(withItems, 0, 'green_flower');
    const switched = selectSlot(selected, 1, undefined);

    expect(switched.selectedSlotIndex).toBe(1);
    expect(switched.slots.map((slot) => slot.itemId)).toEqual(['green_sprout', 'green_flower']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/game/systems/merge.test.ts`

Expected: FAIL because `merge.ts` does not exist.

- [ ] **Step 3: Add merge types**

Append to `src/game/systems/types.ts`:

```ts
export interface GameSlot {
  index: number;
  itemId?: ItemId;
}

export interface MergeState {
  slots: GameSlot[];
  selectedSlotIndex?: number;
  lastDiscoveryItemId?: ItemId;
}
```

- [ ] **Step 4: Implement merge system**

Create `src/game/systems/merge.ts`:

```ts
import type { GameSlot, ItemId, MergeState } from './types';

export function createInitialMergeState(slotCount: number): MergeState {
  return {
    slots: Array.from({ length: slotCount }, (_, index) => ({ index })),
  };
}

export function createBaseItem(state: MergeState, baseItemId: ItemId): MergeState {
  const firstEmptyIndex = state.slots.findIndex((slot) => slot.itemId === undefined);

  if (firstEmptyIndex === -1) {
    return state;
  }

  return {
    ...state,
    slots: state.slots.map((slot) =>
      slot.index === firstEmptyIndex ? { ...slot, itemId: baseItemId } : slot,
    ),
  };
}

export function selectSlot(
  state: MergeState,
  slotIndex: number,
  nextItemId: ItemId | undefined,
): MergeState {
  const slot = state.slots[slotIndex];

  if (!slot?.itemId) {
    return { ...state, selectedSlotIndex: undefined };
  }

  if (state.selectedSlotIndex === undefined || state.selectedSlotIndex === slotIndex) {
    return { ...state, selectedSlotIndex: slotIndex };
  }

  const selectedSlot = state.slots[state.selectedSlotIndex];

  if (!selectedSlot?.itemId || selectedSlot.itemId !== slot.itemId || !nextItemId) {
    return { ...state, selectedSlotIndex: slotIndex };
  }

  const mergedSlots = mergeSlots(state.slots, selectedSlot.index, slot.index, nextItemId);

  return {
    slots: mergedSlots,
    selectedSlotIndex: undefined,
    lastDiscoveryItemId: nextItemId,
  };
}

function mergeSlots(
  slots: GameSlot[],
  targetIndex: number,
  consumedIndex: number,
  nextItemId: ItemId,
): GameSlot[] {
  return slots.map((slot) => {
    if (slot.index === targetIndex) {
      return { ...slot, itemId: nextItemId };
    }

    if (slot.index === consumedIndex) {
      return { index: slot.index };
    }

    return slot;
  });
}
```

- [ ] **Step 5: Run tests**

Run: `npm test -- tests/game/systems/merge.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/game/systems/types.ts src/game/systems/merge.ts tests/game/systems/merge.test.ts
git commit -m "feat: add merge system"
```

---

### Task 4: Economy System

**Files:**
- Modify: `src/game/systems/types.ts`
- Create: `src/game/systems/economy.ts`
- Create: `tests/game/systems/economy.test.ts`

**Interfaces:**
- Produces: `UpgradeId`, `EconomyState`
- Produces: `createInitialEconomyState(now: number): EconomyState`
- Produces: `calculatePassiveIncomePerSecond(discoveredItemIds: string[], itemIncome: Record<string, number>, incomeLevel: number): number`
- Produces: `applyOfflineIncome(state: EconomyState, now: number, incomePerSecond: number): EconomyState`
- Produces: `buyUpgrade(state: EconomyState, upgradeId: UpgradeId): EconomyState`

- [ ] **Step 1: Write failing economy tests**

Create `tests/game/systems/economy.test.ts`:

```ts
import {
  applyOfflineIncome,
  buyUpgrade,
  calculatePassiveIncomePerSecond,
  createInitialEconomyState,
} from '../../../src/game/systems/economy';

describe('economy system', () => {
  it('calculates passive income from discovered items and income level', () => {
    const income = calculatePassiveIncomePerSecond(
      ['green_sprout', 'green_flower'],
      { green_sprout: 1, green_flower: 2 },
      2,
    );

    expect(income).toBe(6);
  });

  it('applies capped offline income', () => {
    const initial = createInitialEconomyState(1_000);
    const next = applyOfflineIncome(initial, 61_000, 10);

    expect(next.coins).toBe(600);
    expect(next.lastSavedAt).toBe(61_000);
  });

  it('buys an upgrade when coins are enough', () => {
    const state = { ...createInitialEconomyState(0), coins: 100 };
    const next = buyUpgrade(state, 'income');

    expect(next.coins).toBe(80);
    expect(next.upgrades.income).toBe(2);
  });

  it('keeps state unchanged when coins are not enough', () => {
    const state = createInitialEconomyState(0);
    const next = buyUpgrade(state, 'income');

    expect(next).toEqual(state);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/game/systems/economy.test.ts`

Expected: FAIL because `economy.ts` does not exist.

- [ ] **Step 3: Add economy types**

Append to `src/game/systems/types.ts`:

```ts
export type UpgradeId = 'autoCreate' | 'income' | 'slots';

export interface EconomyState {
  coins: number;
  planetLevel: number;
  currentBiomeId: BiomeId;
  upgrades: Record<UpgradeId, number>;
  rewardedBoostEndsAt?: number;
  lastSavedAt: number;
}
```

- [ ] **Step 4: Implement economy**

Create `src/game/systems/economy.ts`:

```ts
import type { EconomyState, UpgradeId } from './types';

const MAX_OFFLINE_MS = 4 * 60 * 60 * 1000;
const BASE_UPGRADE_COST: Record<UpgradeId, number> = {
  autoCreate: 30,
  income: 20,
  slots: 100,
};

export function createInitialEconomyState(now: number): EconomyState {
  return {
    coins: 0,
    planetLevel: 1,
    currentBiomeId: 'green',
    upgrades: {
      autoCreate: 1,
      income: 1,
      slots: 1,
    },
    lastSavedAt: now,
  };
}

export function calculatePassiveIncomePerSecond(
  discoveredItemIds: string[],
  itemIncome: Record<string, number>,
  incomeLevel: number,
): number {
  const baseIncome = discoveredItemIds.reduce((sum, itemId) => sum + (itemIncome[itemId] ?? 0), 0);
  return baseIncome * incomeLevel;
}

export function applyOfflineIncome(
  state: EconomyState,
  now: number,
  incomePerSecond: number,
): EconomyState {
  const elapsedMs = Math.max(0, Math.min(now - state.lastSavedAt, MAX_OFFLINE_MS));
  const earnedCoins = Math.floor((elapsedMs / 1000) * incomePerSecond);

  return {
    ...state,
    coins: state.coins + earnedCoins,
    lastSavedAt: now,
  };
}

export function buyUpgrade(state: EconomyState, upgradeId: UpgradeId): EconomyState {
  const level = state.upgrades[upgradeId];
  const cost = getUpgradeCost(upgradeId, level);

  if (state.coins < cost) {
    return state;
  }

  return {
    ...state,
    coins: state.coins - cost,
    upgrades: {
      ...state.upgrades,
      [upgradeId]: level + 1,
    },
  };
}

export function getUpgradeCost(upgradeId: UpgradeId, level: number): number {
  return Math.floor(BASE_UPGRADE_COST[upgradeId] * Math.pow(1.7, level - 1));
}
```

- [ ] **Step 5: Run tests**

Run: `npm test -- tests/game/systems/economy.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/game/systems/types.ts src/game/systems/economy.ts tests/game/systems/economy.test.ts
git commit -m "feat: add economy system"
```

---

### Task 5: Save Adapter

**Files:**
- Modify: `src/game/systems/types.ts`
- Create: `src/game/systems/save.ts`
- Create: `tests/game/systems/save.test.ts`

**Interfaces:**
- Produces: `MiniPlanetSaveData`
- Produces: `SaveStorage`
- Produces: `createDefaultSave(now: number): MiniPlanetSaveData`
- Produces: `loadSave(storage: SaveStorage, now: number): MiniPlanetSaveData`
- Produces: `writeSave(storage: SaveStorage, data: MiniPlanetSaveData): void`

- [ ] **Step 1: Write failing save tests**

Create `tests/game/systems/save.test.ts`:

```ts
import {
  createDefaultSave,
  loadSave,
  writeSave,
  type SaveStorage,
} from '../../../src/game/systems/save';

function createMemoryStorage(): SaveStorage {
  const data = new Map<string, string>();

  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
}

describe('save adapter', () => {
  it('returns default save when storage is empty', () => {
    const save = loadSave(createMemoryStorage(), 1000);

    expect(save.version).toBe(1);
    expect(save.economy.lastSavedAt).toBe(1000);
    expect(save.merge.slots).toHaveLength(6);
  });

  it('round-trips save data', () => {
    const storage = createMemoryStorage();
    const save = createDefaultSave(1000);
    const changed = { ...save, discoveredItemIds: ['green_sprout'] };

    writeSave(storage, changed);

    expect(loadSave(storage, 2000).discoveredItemIds).toEqual(['green_sprout']);
  });

  it('falls back to default save for invalid JSON', () => {
    const storage = createMemoryStorage();
    storage.setItem('mini-planet-save', '{bad json');

    expect(loadSave(storage, 3000).economy.lastSavedAt).toBe(3000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/game/systems/save.test.ts`

Expected: FAIL because `save.ts` does not exist.

- [ ] **Step 3: Add save type**

Append to `src/game/systems/types.ts`:

```ts
export interface MiniPlanetSaveData {
  version: 1;
  economy: EconomyState;
  merge: MergeState;
  discoveredItemIds: ItemId[];
}
```

- [ ] **Step 4: Implement save adapter**

Create `src/game/systems/save.ts`:

```ts
import { createInitialEconomyState } from './economy';
import { createInitialMergeState } from './merge';
import type { MiniPlanetSaveData } from './types';

const SAVE_KEY = 'mini-planet-save';

export interface SaveStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function createDefaultSave(now: number): MiniPlanetSaveData {
  return {
    version: 1,
    economy: createInitialEconomyState(now),
    merge: createInitialMergeState(6),
    discoveredItemIds: [],
  };
}

export function loadSave(storage: SaveStorage, now: number): MiniPlanetSaveData {
  const raw = storage.getItem(SAVE_KEY);

  if (!raw) {
    return createDefaultSave(now);
  }

  try {
    const parsed = JSON.parse(raw) as MiniPlanetSaveData;
    return isVersionOneSave(parsed) ? parsed : createDefaultSave(now);
  } catch {
    return createDefaultSave(now);
  }
}

export function writeSave(storage: SaveStorage, data: MiniPlanetSaveData): void {
  storage.setItem(SAVE_KEY, JSON.stringify(data));
}

function isVersionOneSave(value: MiniPlanetSaveData): value is MiniPlanetSaveData {
  return (
    value.version === 1 &&
    Array.isArray(value.discoveredItemIds) &&
    Array.isArray(value.merge?.slots) &&
    typeof value.economy?.coins === 'number'
  );
}
```

- [ ] **Step 5: Run tests**

Run: `npm test -- tests/game/systems/save.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/game/systems/types.ts src/game/systems/save.ts tests/game/systems/save.test.ts
git commit -m "feat: add local save adapter"
```

---

### Task 6: Asset Approval Manifest and Prototype Asset Batch

**Files:**
- Create: `src/game/data/assetManifest.ts`
- Create: `src/game/assets/manifest.json`
- Create: `public/assets/approved/.gitkeep`
- Create: `public/assets/temp/.gitkeep`
- Modify: `src/game/scenes/PreloadScene.ts`

**Interfaces:**
- Produces: `AssetRecord`
- Produces: `APPROVED_ASSETS: AssetRecord[]`
- Produces: `loadApprovedAssets(scene: Phaser.Scene): void`

- [ ] **Step 1: Generate or find prototype asset candidates**

Generate or source one small candidate batch before coding against final assets:

- `background_day`
- `planet_green`
- `planet_sweet`
- `item_green_sprout`
- `item_green_flower`
- `item_sweet_candy`
- `item_sweet_cupcake`
- `decor_green_sprout`
- `decor_green_flower`
- `decor_sweet_candy`
- `decor_sweet_cupcake`
- `ui_coin`
- `ui_create`
- `ui_upgrade`

Show the preview image(s) to the user before copying files into `public/assets/approved/`.

Expected approval sentence from user: `approve prototype asset batch`.

- [ ] **Step 2: Copy approved assets**

After approval, copy files into:

```text
public/assets/approved/background_day.png
public/assets/approved/planet_green.png
public/assets/approved/planet_sweet.png
public/assets/approved/item_green_sprout.png
public/assets/approved/item_green_flower.png
public/assets/approved/item_sweet_candy.png
public/assets/approved/item_sweet_cupcake.png
public/assets/approved/decor_green_sprout.png
public/assets/approved/decor_green_flower.png
public/assets/approved/decor_sweet_candy.png
public/assets/approved/decor_sweet_cupcake.png
public/assets/approved/ui_coin.png
public/assets/approved/ui_create.png
public/assets/approved/ui_upgrade.png
```

- [ ] **Step 3: Create manifest metadata**

Create `src/game/assets/manifest.json`:

```json
[
  {
    "key": "background_day",
    "path": "assets/approved/background_day.png",
    "kind": "background",
    "status": "approved",
    "source": "generated",
    "license": "project-generated",
    "prompt": "Bright toy-like mobile game background, cheerful daylight, soft sky blue and green, no text, no watermark."
  },
  {
    "key": "planet_green",
    "path": "assets/approved/planet_green.png",
    "kind": "planet",
    "status": "approved",
    "source": "generated",
    "license": "project-generated",
    "prompt": "Cute round green mini planet, toy-like 3D style, isolated, no text, no watermark."
  },
  {
    "key": "planet_sweet",
    "path": "assets/approved/planet_sweet.png",
    "kind": "planet",
    "status": "approved",
    "source": "generated",
    "license": "project-generated",
    "prompt": "Cute round sweet candy mini planet, toy-like 3D style, isolated, no text, no watermark."
  },
  {
    "key": "item_green_sprout",
    "path": "assets/approved/item_green_sprout.png",
    "kind": "item",
    "status": "approved",
    "source": "generated",
    "license": "project-generated",
    "prompt": "Cute toy-like 3D sprout icon, isolated, no text, no watermark."
  },
  {
    "key": "item_green_flower",
    "path": "assets/approved/item_green_flower.png",
    "kind": "item",
    "status": "approved",
    "source": "generated",
    "license": "project-generated",
    "prompt": "Cute toy-like 3D flower icon, isolated, no text, no watermark."
  },
  {
    "key": "item_sweet_candy",
    "path": "assets/approved/item_sweet_candy.png",
    "kind": "item",
    "status": "approved",
    "source": "generated",
    "license": "project-generated",
    "prompt": "Cute toy-like 3D candy icon, isolated, no text, no watermark."
  },
  {
    "key": "item_sweet_cupcake",
    "path": "assets/approved/item_sweet_cupcake.png",
    "kind": "item",
    "status": "approved",
    "source": "generated",
    "license": "project-generated",
    "prompt": "Cute toy-like 3D cupcake icon, isolated, no text, no watermark."
  },
  {
    "key": "decor_green_sprout",
    "path": "assets/approved/decor_green_sprout.png",
    "kind": "decor",
    "status": "approved",
    "source": "generated",
    "license": "project-generated",
    "prompt": "Small cute sprout decoration for a mini planet, toy-like 3D style, no text, no watermark."
  },
  {
    "key": "decor_green_flower",
    "path": "assets/approved/decor_green_flower.png",
    "kind": "decor",
    "status": "approved",
    "source": "generated",
    "license": "project-generated",
    "prompt": "Small cute flower decoration for a mini planet, toy-like 3D style, no text, no watermark."
  },
  {
    "key": "decor_sweet_candy",
    "path": "assets/approved/decor_sweet_candy.png",
    "kind": "decor",
    "status": "approved",
    "source": "generated",
    "license": "project-generated",
    "prompt": "Small cute candy decoration for a mini planet, toy-like 3D style, no text, no watermark."
  },
  {
    "key": "decor_sweet_cupcake",
    "path": "assets/approved/decor_sweet_cupcake.png",
    "kind": "decor",
    "status": "approved",
    "source": "generated",
    "license": "project-generated",
    "prompt": "Small cute cupcake decoration for a mini planet, toy-like 3D style, no text, no watermark."
  },
  {
    "key": "ui_coin",
    "path": "assets/approved/ui_coin.png",
    "kind": "ui",
    "status": "approved",
    "source": "generated",
    "license": "project-generated",
    "prompt": "Simple cute gold coin UI icon, toy-like 3D style, no text, no watermark."
  },
  {
    "key": "ui_create",
    "path": "assets/approved/ui_create.png",
    "kind": "ui",
    "status": "approved",
    "source": "generated",
    "license": "project-generated",
    "prompt": "Simple cute create button UI icon with sparkle, toy-like 3D style, no text, no watermark."
  },
  {
    "key": "ui_upgrade",
    "path": "assets/approved/ui_upgrade.png",
    "kind": "ui",
    "status": "approved",
    "source": "generated",
    "license": "project-generated",
    "prompt": "Simple cute upgrade arrow UI icon, toy-like 3D style, no text, no watermark."
  }
]
```

- [ ] **Step 4: Add typed loader**

Create `src/game/data/assetManifest.ts`:

```ts
import Phaser from 'phaser';
import manifest from '../assets/manifest.json';

export type AssetKind = 'background' | 'planet' | 'item' | 'decor' | 'ui';
export type AssetStatus = 'approved';

export interface AssetRecord {
  key: string;
  path: string;
  kind: AssetKind;
  status: AssetStatus;
  source: 'generated' | 'external';
  license: string;
  prompt?: string;
  sourceUrl?: string;
}

export const APPROVED_ASSETS = manifest as AssetRecord[];

export function loadApprovedAssets(scene: Phaser.Scene): void {
  for (const asset of APPROVED_ASSETS) {
    scene.load.image(asset.key, asset.path);
  }
}
```

- [ ] **Step 5: Load approved assets**

Modify `src/game/scenes/PreloadScene.ts`:

```ts
import Phaser from 'phaser';
import { loadApprovedAssets } from '../data/assetManifest';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload(): void {
    loadApprovedAssets(this);
  }

  create(): void {
    this.scene.start('GameScene');
    this.scene.launch('UIScene');
  }
}
```

- [ ] **Step 6: Verify build**

Run: `npm run build`

Expected: PASS and assets are copied into `dist/assets/approved/`.

- [ ] **Step 7: Commit**

```bash
git add src/game/data/assetManifest.ts src/game/assets/manifest.json public/assets src/game/scenes/PreloadScene.ts
git commit -m "feat: add approved asset manifest"
```

---

### Task 7: Playable Game Scene

**Files:**
- Modify: `src/game/scenes/GameScene.ts`
- Modify: `src/game/scenes/UIScene.ts`

**Interfaces:**
- Consumes: `BIOMES`
- Consumes: `createBaseItem`, `selectSlot`
- Consumes: `loadSave`, `writeSave`
- Produces: playable one-screen prototype with tap-create, tap-merge, simple pop animations, and visible planet decorations.

- [ ] **Step 1: Replace static GameScene with stateful prototype**

Modify `src/game/scenes/GameScene.ts`:

```ts
import Phaser from 'phaser';
import { BIOMES, getItemById } from '../data/biomes';
import { createBaseItem, selectSlot } from '../systems/merge';
import { createDefaultSave, loadSave, writeSave } from '../systems/save';
import type { MiniPlanetSaveData } from '../systems/types';

const SLOT_POSITIONS = [
  { x: 150, y: 1040 },
  { x: 270, y: 1040 },
  { x: 390, y: 1040 },
  { x: 510, y: 1040 },
  { x: 210, y: 1160 },
  { x: 330, y: 1160 },
];

const DECOR_POSITIONS = [
  { x: 290, y: 450 },
  { x: 405, y: 440 },
  { x: 250, y: 535 },
  { x: 470, y: 535 },
  { x: 360, y: 390 },
  { x: 355, y: 600 },
  { x: 295, y: 600 },
  { x: 430, y: 600 },
];

export class GameScene extends Phaser.Scene {
  private save: MiniPlanetSaveData = createDefaultSave(Date.now());
  private slotSprites: Phaser.GameObjects.Container[] = [];
  private planet?: Phaser.GameObjects.Image;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.save = loadSave(window.localStorage, Date.now());

    this.add.image(360, 640, 'background_day').setDisplaySize(720, 1280);
    this.planet = this.add.image(360, 510, 'planet_green').setDisplaySize(360, 360);
    this.tweens.add({
      targets: this.planet,
      y: 525,
      duration: 1700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });

    this.drawDecorations();
    this.drawSlots();
    this.events.emit('save-changed', this.save);
  }

  createBaseItem(): void {
    const baseItemId = BIOMES[0].items[0].id;
    this.save = {
      ...this.save,
      merge: createBaseItem(this.save.merge, baseItemId),
    };
    this.persistAndRedraw();
  }

  selectSlot(slotIndex: number): void {
    const slot = this.save.merge.slots[slotIndex];
    const item = slot.itemId ? getItemById(slot.itemId) : undefined;
    const nextItem = item ? BIOMES.find((biome) => biome.id === item.biomeId)?.items[item.tier + 1] : undefined;
    const nextMerge = selectSlot(this.save.merge, slotIndex, nextItem?.id);
    const discovered = nextMerge.lastDiscoveryItemId;
    const discoveredItemIds = discovered && !this.save.discoveredItemIds.includes(discovered)
      ? [...this.save.discoveredItemIds, discovered]
      : this.save.discoveredItemIds;

    this.save = {
      ...this.save,
      merge: { ...nextMerge, lastDiscoveryItemId: undefined },
      discoveredItemIds,
    };

    this.persistAndRedraw();
  }

  private persistAndRedraw(): void {
    writeSave(window.localStorage, this.save);
    this.drawSlots();
    this.drawDecorations();
    this.events.emit('save-changed', this.save);
  }

  private drawSlots(): void {
    this.slotSprites.forEach((slot) => slot.destroy());
    this.slotSprites = [];

    this.save.merge.slots.forEach((slot) => {
      const position = SLOT_POSITIONS[slot.index];
      const container = this.add.container(position.x, position.y);
      const bg = this.add.rectangle(0, 0, 100, 100, 0xffffff, 0.9)
        .setStrokeStyle(4, this.save.merge.selectedSlotIndex === slot.index ? 0xffcc33 : 0x6bbf59);
      container.add(bg);

      if (slot.itemId) {
        const item = getItemById(slot.itemId);
        if (item && this.textures.exists(item.iconKey)) {
          container.add(this.add.image(0, -4, item.iconKey).setDisplaySize(72, 72));
        } else {
          container.add(this.add.text(0, -4, item?.title.slice(0, 2) ?? '?', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#17442a',
          }).setOrigin(0.5));
        }
      }

      container.setSize(100, 100);
      container.setInteractive(new Phaser.Geom.Rectangle(-50, -50, 100, 100), Phaser.Geom.Rectangle.Contains);
      container.on('pointerdown', () => this.selectSlot(slot.index));
      this.slotSprites.push(container);
    });
  }

  private drawDecorations(): void {
    this.children.list
      .filter((child) => child.getData('decor') === true)
      .forEach((child) => child.destroy());

    this.save.discoveredItemIds.slice(0, DECOR_POSITIONS.length).forEach((itemId, index) => {
      const item = getItemById(itemId);
      const position = DECOR_POSITIONS[index];

      if (!item || !position || !this.textures.exists(item.decorKey)) {
        return;
      }

      const decor = this.add.image(position.x, position.y, item.decorKey).setDisplaySize(72, 72);
      decor.setData('decor', true);
      this.tweens.add({
        targets: decor,
        scale: { from: 0, to: decor.scale },
        duration: 220,
        ease: 'Back.out',
      });
    });
  }
}
```

- [ ] **Step 2: Replace static UIScene with buttons**

Modify `src/game/scenes/UIScene.ts`:

```ts
import Phaser from 'phaser';
import type { MiniPlanetSaveData } from '../systems/types';

export class UIScene extends Phaser.Scene {
  private coinText?: Phaser.GameObjects.Text;

  constructor() {
    super('UIScene');
  }

  create(): void {
    this.coinText = this.add.text(32, 28, 'Монеты: 0', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#17442a',
      backgroundColor: '#ffffffaa',
      padding: { x: 16, y: 8 },
    });

    const createButton = this.add.rectangle(360, 900, 300, 88, 0xffd44d).setStrokeStyle(4, 0xd99b1f);
    const createLabel = this.add.text(360, 900, 'Создать', {
      fontFamily: 'Arial',
      fontSize: '36px',
      color: '#5b3b00',
    }).setOrigin(0.5);

    createButton.setInteractive();
    createButton.on('pointerdown', () => {
      const gameScene = this.scene.get('GameScene') as Phaser.Scene & { createBaseItem(): void };
      gameScene.createBaseItem();
      this.tweens.add({ targets: [createButton, createLabel], scale: 0.96, duration: 60, yoyo: true });
    });

    this.scene.get('GameScene').events.on('save-changed', (save: MiniPlanetSaveData) => {
      this.coinText?.setText(`Монеты: ${save.economy.coins}`);
    });
  }
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: Manual browser check**

Run: `npm run dev`

Open the local URL and verify:

- The game is portrait.
- `Создать` fills empty slots.
- Tapping two matching items merges them.
- A discovered decoration appears on the planet.
- Reloading preserves slots and discoveries.

- [ ] **Step 5: Commit**

```bash
git add src/game/scenes/GameScene.ts src/game/scenes/UIScene.ts
git commit -m "feat: add playable merge planet scene"
```

---

### Task 8: Yandex SDK Facade and Reward Hook

**Files:**
- Create: `src/game/systems/yandex.ts`
- Modify: `src/game/scenes/BootScene.ts`
- Modify: `src/game/scenes/UIScene.ts`

**Interfaces:**
- Produces: `YandexBridge`
- Produces: `createYandexBridge(): Promise<YandexBridge>`
- Consumes in UI: `showRewardedAd('incomeBoost')`

- [ ] **Step 1: Create local SDK facade**

Create `src/game/systems/yandex.ts`:

```ts
export type RewardPlacement = 'incomeBoost' | 'betterItem';

export interface YandexBridge {
  isAvailable: boolean;
  ready(): Promise<void>;
  showRewardedAd(placement: RewardPlacement): Promise<boolean>;
}

export async function createYandexBridge(): Promise<YandexBridge> {
  return {
    isAvailable: false,
    ready: async () => undefined,
    showRewardedAd: async () => true,
  };
}
```

- [ ] **Step 2: Initialize bridge in BootScene**

Modify `src/game/scenes/BootScene.ts`:

```ts
import Phaser from 'phaser';
import { createYandexBridge, type YandexBridge } from '../systems/yandex';

declare module 'phaser' {
  namespace Data {
    interface DataManager {
      get(key: 'yandexBridge'): YandexBridge | undefined;
    }
  }
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  async create(): Promise<void> {
    const bridge = await createYandexBridge();
    await bridge.ready();
    this.registry.set('yandexBridge', bridge);
    this.scene.start('PreloadScene');
  }
}
```

- [ ] **Step 3: Add rewarded button**

Modify `src/game/scenes/UIScene.ts` by adding this after the create button code:

```ts
    const adButton = this.add.rectangle(600, 900, 110, 88, 0x7cc7ff).setStrokeStyle(4, 0x3289c9);
    const adLabel = this.add.text(600, 900, 'x2', {
      fontFamily: 'Arial',
      fontSize: '30px',
      color: '#07324f',
    }).setOrigin(0.5);

    adButton.setInteractive();
    adButton.on('pointerdown', async () => {
      const bridge = this.registry.get('yandexBridge');
      await bridge?.showRewardedAd('incomeBoost');
      this.tweens.add({ targets: [adButton, adLabel], scale: 0.96, duration: 60, yoyo: true });
    });
```

- [ ] **Step 4: Verify build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/systems/yandex.ts src/game/scenes/BootScene.ts src/game/scenes/UIScene.ts
git commit -m "feat: add yandex sdk facade"
```

---

### Task 9: Release Content Data Expansion

**Files:**
- Modify: `src/game/data/biomes.ts`
- Modify: `tests/game/data/biomes.test.ts`

**Interfaces:**
- Produces: four release biomes in data: `green`, `sweet`, `sea`, `moon`
- Keeps merge and scene code unchanged.

- [ ] **Step 1: Update test for release data shape**

Modify `tests/game/data/biomes.test.ts` to include:

```ts
  it('defines the first release content target in data', () => {
    expect(BIOMES.map((biome) => biome.id)).toEqual(['green', 'sweet', 'sea', 'moon']);
    expect(BIOMES.every((biome) => biome.items.length === 12)).toBe(true);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/game/data/biomes.test.ts`

Expected: FAIL because current data has two biomes with eight items.

- [ ] **Step 3: Replace biome data with release-shaped data**

Replace `src/game/data/biomes.ts` with:

```ts
import type { BiomeDefinition, ItemDefinition } from '../systems/types';

const greenItems = [
  ['sprout', 'Росток', 1],
  ['flower', 'Цветок', 2],
  ['mushroom', 'Гриб', 4],
  ['tree', 'Дерево', 8],
  ['house', 'Домик', 16],
  ['pond', 'Пруд', 32],
  ['mill', 'Мельница', 64],
  ['rainbow', 'Радуга', 128],
  ['garden_bench', 'Садовая лавка', 256],
  ['bird_house', 'Птичий домик', 512],
  ['sun_tower', 'Солнечная башня', 1024],
  ['rainbow_palace', 'Дворец радуги', 2048],
] as const;

const sweetItems = [
  ['candy', 'Конфета', 2],
  ['cupcake', 'Кекс', 4],
  ['donut', 'Пончик', 8],
  ['waffle', 'Вафля', 16],
  ['syrup_fountain', 'Фонтан сиропа', 32],
  ['jelly_tree', 'Мармеладное дерево', 64],
  ['cake_house', 'Торт-дом', 128],
  ['sugar_castle', 'Сахарный замок', 256],
  ['lollipop_bridge', 'Леденцовый мост', 512],
  ['waffle_mill', 'Вафельная мельница', 1024],
  ['chocolate_fountain', 'Шоколадный фонтан', 2048],
  ['royal_cake', 'Королевский торт', 4096],
] as const;

const seaItems = [
  ['shell', 'Ракушка', 2],
  ['starfish', 'Морская звезда', 4],
  ['coral', 'Коралл', 8],
  ['pearl', 'Жемчужина', 16],
  ['boat', 'Лодочка', 32],
  ['lighthouse', 'Маяк', 64],
  ['reef_house', 'Домик-риф', 128],
  ['whale_fountain', 'Кит-фонтан', 256],
  ['bubble_bridge', 'Пузырьковый мост', 512],
  ['sea_garden', 'Морской сад', 1024],
  ['crystal_lagoon', 'Кристальная лагуна', 2048],
  ['ocean_palace', 'Океанский дворец', 4096],
] as const;

const moonItems = [
  ['stone', 'Лунный камень', 2],
  ['crater', 'Кратер', 4],
  ['crystal', 'Кристалл', 8],
  ['satellite', 'Спутник', 16],
  ['antenna', 'Антенна', 32],
  ['rover', 'Луноход', 64],
  ['dome', 'Купол', 128],
  ['rocket', 'Ракета', 256],
  ['star_gate', 'Звёздные ворота', 512],
  ['moon_garden', 'Лунный сад', 1024],
  ['silver_tower', 'Серебряная башня', 2048],
  ['cosmic_castle', 'Космический замок', 4096],
] as const;

function buildItems(
  biomeId: string,
  rows: readonly (readonly [string, string, number])[],
): ItemDefinition[] {
  return rows.map(([slug, title, baseIncome], tier) => ({
    id: `${biomeId}_${slug}`,
    biomeId,
    tier,
    title,
    iconKey: `item_${biomeId}_${slug}`,
    decorKey: `decor_${biomeId}_${slug}`,
    baseIncome,
  }));
}

export const BIOMES: BiomeDefinition[] = [
  {
    id: 'green',
    title: 'Зелёная планета',
    planetAssetKey: 'planet_green',
    backgroundAssetKey: 'background_day',
    items: buildItems('green', greenItems),
  },
  {
    id: 'sweet',
    title: 'Сладкая планета',
    planetAssetKey: 'planet_sweet',
    backgroundAssetKey: 'background_day',
    items: buildItems('sweet', sweetItems),
  },
  {
    id: 'sea',
    title: 'Морская планета',
    planetAssetKey: 'planet_sea',
    backgroundAssetKey: 'background_day',
    items: buildItems('sea', seaItems),
  },
  {
    id: 'moon',
    title: 'Лунная планета',
    planetAssetKey: 'planet_moon',
    backgroundAssetKey: 'background_day',
    items: buildItems('moon', moonItems),
  },
];

export function getBiomeById(id: string): BiomeDefinition | undefined {
  return BIOMES.find((biome) => biome.id === id);
}

export function getItemById(itemId: string): ItemDefinition | undefined {
  return BIOMES.flatMap((biome) => biome.items).find((item) => item.id === itemId);
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- tests/game/data/biomes.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/data/biomes.ts tests/game/data/biomes.test.ts
git commit -m "feat: add first release biome data"
```

---

### Task 10: Final Prototype Verification

**Files:**
- Modify only files required by failed checks.

**Interfaces:**
- Consumes all prior tasks.
- Produces a buildable prototype ready for asset expansion and Yandex-specific audit work.

- [ ] **Step 1: Run unit tests**

Run: `npm test`

Expected: all test files pass.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: TypeScript passes and Vite writes `dist/`.

- [ ] **Step 3: Run local browser smoke test**

Run: `npm run dev`

Verify manually:

- 720x1280 gameplay is centered and scales to window.
- Primary action is `Создать`.
- Six slots are visible.
- Slot tap-merge works without drag-and-drop.
- Planet remains the focus.
- At least one approved raster asset appears in the scene.
- Reload keeps save state.

- [ ] **Step 4: Capture remaining release gaps**

Create or update `docs/release-gaps.md`:

```md
# Release Gaps

- Generate and approve full 4-biome release asset batch.
- Add Yandex Games SDK cloud saves.
- Add Yandex Games rewarded ads implementation.
- Add Yandex Games loading ready call.
- Add promo icon, cover, and three screenshots.
- Run Yandex Games audit manifest and browser checks before publication.
```

- [ ] **Step 5: Commit**

```bash
git add docs/release-gaps.md
git commit -m "docs: record release gaps"
```

---

## Self-Review

Spec coverage:

- One-screen simple MVP: Tasks 1 and 7.
- Data-driven content and release expansion: Tasks 2 and 9.
- Tap-create and tap-merge: Tasks 3 and 7.
- Economy and upgrades foundation: Task 4.
- localStorage save adapter: Task 5.
- Approved asset workflow: Task 6.
- Yandex SDK wrapper: Task 8.
- Verification: Task 10.

Known deferred release gaps:

- Full approved 48-item release asset set is intentionally not required before the first playable prototype task sequence completes.
- Real Yandex cloud saves and ads are isolated behind wrappers and scheduled after local prototype verification.
- Publication audit is a separate phase after a build exists.
