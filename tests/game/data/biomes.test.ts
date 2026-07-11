import { BIOMES, getBiomeById, getItemById } from '../../../src/game/data/biomes';

describe('biome content', () => {
  it('defines four complete playable biomes', () => {
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
    expect(getBiomeById('green')?.title).toBe('Green Planet');
    expect(getItemById('green_flower')?.title).toBe('Flower');
    expect(getItemById('missing')).toBeUndefined();
  });
});
