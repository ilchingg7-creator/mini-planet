import { BIOMES, getBiomeById, getItemById } from '../../../src/game/data/biomes';

describe('biome content', () => {
  it('ships prototype data with two playable biomes', () => {
    expect(BIOMES.map((biome) => biome.id).slice(0, 2)).toEqual(['green', 'sweet']);
    expect(BIOMES.every((biome) => biome.items.length >= 8)).toBe(true);
  });

  it('defines the first release content target in data', () => {
    expect(BIOMES.map((biome) => biome.id)).toEqual(['green', 'sweet', 'sea', 'moon']);
    expect(BIOMES.every((biome) => biome.items.length === 12)).toBe(true);
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
