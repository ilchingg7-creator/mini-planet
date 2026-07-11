import {
  createDefaultSave,
  loadSave,
  mergeSaves,
  parseSaveRaw,
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
    expect(save.merge.slots).toHaveLength(12);
  });

  it('round-trips save data', () => {
    const storage = createMemoryStorage();
    const save = createDefaultSave(1000);
    const changed = { ...save, discoveredItemIds: ['green_sprout'] };

    writeSave(storage, changed);

    expect(loadSave(storage, 2000).discoveredItemIds).toEqual(['green_sprout']);
  });

  it('expands old six-slot saves to the current board size', () => {
    const storage = createMemoryStorage();
    const save = { ...createDefaultSave(1000), merge: { slots: Array.from({ length: 6 }, (_, index) => ({ index })) } };
    writeSave(storage, save);

    const loaded = loadSave(storage, 2000);

    expect(loaded.merge.slots).toHaveLength(12);
    expect(loaded.merge.slots.slice(0, 6)).toEqual(save.merge.slots);
  });

  it('falls back to default save for invalid JSON', () => {
    const storage = createMemoryStorage();
    storage.setItem('mini-planet-save', '{bad json');

    expect(loadSave(storage, 3000).economy.lastSavedAt).toBe(3000);
  });
});

describe('parseSaveRaw', () => {
  it('returns null for invalid JSON', () => {
    expect(parseSaveRaw('{bad json', 1000)).toBeNull();
  });

  it('returns null for wrong version', () => {
    const raw = JSON.stringify({ version: 99, economy: {}, merge: { slots: [] }, discoveredItemIds: [] });
    expect(parseSaveRaw(raw, 1000)).toBeNull();
  });

  it('returns null for missing required fields', () => {
    const raw = JSON.stringify({ version: 1, economy: {}, merge: { slots: [] } });
    expect(parseSaveRaw(raw, 1000)).toBeNull();
  });

  it('returns a normalized save for valid input', () => {
    const save = createDefaultSave(1000);
    const raw = JSON.stringify(save);
    const parsed = parseSaveRaw(raw, 2000);
    expect(parsed).not.toBeNull();
    expect(parsed?.version).toBe(1);
    expect(parsed?.merge.slots).toHaveLength(12);
  });
});

describe('mergeSaves', () => {
  it('returns local when cloud is null', () => {
    const local = createDefaultSave(1000);
    expect(mergeSaves(local, null)).toBe(local);
  });

  it('returns local when local is fresher', () => {
    const local = { ...createDefaultSave(1000), lastModified: 2000 };
    const cloud = { ...createDefaultSave(1000), lastModified: 1000 };
    expect(mergeSaves(local, cloud)).toBe(local);
  });

  it('returns cloud when cloud is fresher', () => {
    const local = { ...createDefaultSave(1000), lastModified: 1000 };
    const cloud = { ...createDefaultSave(1000), lastModified: 2000 };
    expect(mergeSaves(local, cloud)).toBe(cloud);
  });

  it('returns local on equal timestamps (local wins ties)', () => {
    const local = { ...createDefaultSave(1000), lastModified: 1000 };
    const cloud = { ...createDefaultSave(1000), lastModified: 1000 };
    expect(mergeSaves(local, cloud)).toBe(local);
  });

  it('treats saves without lastModified as timestamp 0', () => {
    const local = createDefaultSave(1000); // lastModified undefined → 0
    const cloud = { ...createDefaultSave(1000), lastModified: 1 };
    expect(mergeSaves(local, cloud)).toBe(cloud);
  });

  it('save with lastModified wins over save without', () => {
    const local = { ...createDefaultSave(1000), lastModified: 1 };
    const cloud = createDefaultSave(1000); // lastModified undefined → 0
    expect(mergeSaves(local, cloud)).toBe(local);
  });
});
