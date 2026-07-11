import type { BiomeDefinition, ItemDefinition } from './types';

export type CreateTierRange = readonly [minimum: number, maximum: number];

export function getCreateTierRange(highestReachedTier: number): CreateTierRange {
  if (highestReachedTier >= 10) {
    return [4, 6];
  }

  if (highestReachedTier >= 7) {
    return [1, 3];
  }

  return [0, 0];
}

export function pickCreateItem(
  biome: BiomeDefinition,
  highestReachedTier: number,
  random: () => number = Math.random,
): ItemDefinition {
  const [minimum, requestedMaximum] = getCreateTierRange(highestReachedTier);
  const maximum = Math.min(requestedMaximum, biome.items.length - 1);
  const normalizedRandom = Math.max(0, Math.min(0.999999, random()));
  const tier = minimum + Math.floor(normalizedRandom * (maximum - minimum + 1));

  return biome.items[tier] ?? biome.items[0];
}

export function getHighestReachedTier(
  biome: BiomeDefinition,
  discoveredItemIds: string[],
): number {
  const discovered = new Set(discoveredItemIds);
  return biome.items.reduce(
    (highest, item) => (discovered.has(item.id) ? Math.max(highest, item.tier) : highest),
    0,
  );
}
