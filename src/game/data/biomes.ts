import type { BiomeDefinition, ItemDefinition } from '../systems/types';

type ItemRow = readonly [slug: string, title: string, baseIncome: number];

const greenItems = [
  ['sprout', 'Sprout', 1], ['flower', 'Flower', 2], ['mushroom', 'Mushroom', 4],
  ['tree', 'Tree', 8], ['house', 'Cottage', 16], ['pond', 'Pond', 32],
  ['mill', 'Windmill', 64], ['rainbow', 'Rainbow', 128], ['garden_bench', 'Garden Bench', 256],
  ['bird_house', 'Bird House', 512], ['sun_tower', 'Sun Tower', 1024], ['rainbow_palace', 'Rainbow Palace', 2048],
] as const satisfies readonly ItemRow[];

const sweetItems = [
  ['sugar_crystal', 'Sugar Crystal', 2], ['candy', 'Candy', 4], ['lollipop', 'Lollipop', 8],
  ['cupcake', 'Cupcake', 16], ['donut', 'Donut', 32], ['cake', 'Cake', 64],
  ['pastry_cart', 'Pastry Cart', 128], ['gingerbread_house', 'Gingerbread House', 256], ['bakery', 'Candy Bakery', 512],
  ['chocolate_tower', 'Chocolate Tower', 1024], ['sugar_castle', 'Sugar Castle', 2048], ['royal_palace', 'Royal Candy Palace', 4096],
] as const satisfies readonly ItemRow[];

const seaItems = [
  ['shell', 'Shell', 2], ['starfish', 'Starfish', 4], ['coral', 'Coral', 8],
  ['pearl_shrine', 'Pearl Shrine', 16], ['reef', 'Reef', 32], ['boat', 'Boat', 64],
  ['lighthouse', 'Lighthouse', 128], ['reef_house', 'Reef House', 256], ['harbor', 'Harbor', 512],
  ['underwater_town', 'Underwater Town', 1024], ['ocean_palace', 'Ocean Palace', 2048], ['sea_kingdom', 'Sea Kingdom', 4096],
] as const satisfies readonly ItemRow[];

const moonItems = [
  ['stone', 'Moon Stone', 2], ['crystal', 'Moon Crystal', 4], ['beacon', 'Signal Beacon', 8],
  ['antenna', 'Antenna', 16], ['satellite', 'Satellite', 32], ['rover', 'Lunar Rover', 64],
  ['landing_module', 'Landing Module', 128], ['dome', 'Habitat Dome', 256], ['rocket_base', 'Rocket Base', 512],
  ['star_gate', 'Star Gate', 1024], ['moon_tower', 'Moon Tower', 2048], ['cosmic_castle', 'Cosmic Castle', 4096],
] as const satisfies readonly ItemRow[];

function buildItems(biomeId: string, rows: readonly ItemRow[]): ItemDefinition[] {
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
  { id: 'green', title: 'Green Planet', planetAssetKey: 'planet_green', backgroundAssetKey: 'background_day', items: buildItems('green', greenItems) },
  { id: 'sweet', title: 'Sweet Planet', planetAssetKey: 'planet_sweet', backgroundAssetKey: 'background_day', items: buildItems('sweet', sweetItems) },
  { id: 'sea', title: 'Sea Planet', planetAssetKey: 'planet_sea', backgroundAssetKey: 'background_day', items: buildItems('sea', seaItems) },
  { id: 'moon', title: 'Moon Planet', planetAssetKey: 'planet_moon', backgroundAssetKey: 'background_day', items: buildItems('moon', moonItems) },
];

export function getBiomeById(id: string): BiomeDefinition | undefined {
  return BIOMES.find((biome) => biome.id === id);
}

export function getItemById(itemId: string): ItemDefinition | undefined {
  return BIOMES.flatMap((biome) => biome.items).find((item) => item.id === itemId);
}
