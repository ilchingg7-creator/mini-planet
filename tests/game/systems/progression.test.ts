import { BIOMES } from '../../../src/game/data/biomes';
import { advanceBiomeIfComplete } from '../../../src/game/systems/progression';
import { createDefaultSave } from '../../../src/game/systems/save';

describe('biome progression', () => {
  it('advances to the next biome when the final current-biome item is discovered', () => {
    const save = createDefaultSave(1000);
    const completedGreen = BIOMES[0].items[BIOMES[0].items.length - 1];

    const advanced = advanceBiomeIfComplete(
      {
        ...save,
        discoveredItemIds: [...save.discoveredItemIds, completedGreen.id],
      },
      BIOMES,
      12,
    );

    expect(advanced.economy.currentBiomeId).toBe(BIOMES[1].id);
    expect(advanced.merge.slots).toHaveLength(12);
    expect(advanced.merge.slots.every((slot) => slot.itemId === undefined)).toBe(true);
  });

  it('stays on the final biome after its last item is discovered', () => {
    const save = createDefaultSave(1000);
    const finalBiome = BIOMES[BIOMES.length - 1];
    const completedFinal = finalBiome.items[finalBiome.items.length - 1];

    const advanced = advanceBiomeIfComplete(
      {
        ...save,
        economy: { ...save.economy, currentBiomeId: finalBiome.id },
        discoveredItemIds: [completedFinal.id],
      },
      BIOMES,
      12,
    );

    expect(advanced.economy.currentBiomeId).toBe(finalBiome.id);
  });
});
