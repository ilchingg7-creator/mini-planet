import { BIOMES } from '../../../src/game/data/biomes';
import {
  getCreateTierRange,
  pickCreateItem,
} from '../../../src/game/systems/generator';

describe('item generator progression', () => {
  it('upgrades the generated tier range after tiers seven and ten', () => {
    expect(getCreateTierRange(6)).toEqual([0, 0]);
    expect(getCreateTierRange(7)).toEqual([1, 3]);
    expect(getCreateTierRange(9)).toEqual([1, 3]);
    expect(getCreateTierRange(10)).toEqual([4, 6]);
  });

  it('picks within the unlocked range deterministically from the supplied random value', () => {
    const biome = BIOMES[0];

    expect(pickCreateItem(biome, 7, () => 0).tier).toBe(1);
    expect(pickCreateItem(biome, 7, () => 0.999).tier).toBe(3);
    expect(pickCreateItem(biome, 10, () => 0).tier).toBe(4);
    expect(pickCreateItem(biome, 10, () => 0.999).tier).toBe(6);
  });
});
