import { BIOMES } from '../../../src/game/data/biomes';
import { getPlanetDecorPlacement } from '../../../src/game/data/planetDecor';

describe('planet decoration layout', () => {
  it('keeps deterministic slightly irregular positions inside the planet', () => {
    const items = BIOMES[0].items;
    const firstPass = items.map((item, index) => getPlanetDecorPlacement(item, index));
    const secondPass = items.map((item, index) => getPlanetDecorPlacement(item, index));

    expect(secondPass).toEqual(firstPass);
    expect(new Set(firstPass.map(({ x, y }) => String(x) + ':' + String(y))).size).toBe(items.length);

    firstPass.forEach(({ x, y }) => {
      expect(x).toBeGreaterThanOrEqual(145);
      expect(x).toBeLessThanOrEqual(485);
      expect(y).toBeGreaterThanOrEqual(310);
      expect(y).toBeLessThanOrEqual(640);
    });
  });

  it('uses object-specific sizes instead of one uniform decoration size', () => {
    const sizes = BIOMES[0].items.map(
      (item, index) => getPlanetDecorPlacement(item, index).size,
    );

    expect(sizes).toEqual([36, 44, 50, 88, 98, 92, 104, 92, 72, 64, 110, 124]);
  });
});
