import { createInitialMergeState } from './merge';
import type { BiomeDefinition, MiniPlanetSaveData } from './types';

export function advanceBiomeIfComplete(
  save: MiniPlanetSaveData,
  biomes: BiomeDefinition[],
  slotCount: number,
): MiniPlanetSaveData {
  const currentBiomeIndex = biomes.findIndex((biome) => biome.id === save.economy.currentBiomeId);

  if (currentBiomeIndex === -1) {
    return save;
  }

  const currentBiome = biomes[currentBiomeIndex];
  const finalItem = currentBiome.items[currentBiome.items.length - 1];
  const nextBiome = biomes[currentBiomeIndex + 1];

  if (!finalItem || !nextBiome || !save.discoveredItemIds.includes(finalItem.id)) {
    return save;
  }

  return {
    ...save,
    economy: {
      ...save.economy,
      currentBiomeId: nextBiome.id,
      planetLevel: save.economy.planetLevel + 1,
    },
    merge: createInitialMergeState(slotCount),
  };
}
