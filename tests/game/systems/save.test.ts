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
