import type { BiomeDefinition, ItemDefinition } from '../systems/types';

const greenItems = [
  ['sprout', 'Росток', 1],
  ['flower', 'Цветок', 2],
  ['mushroom', 'Гриб', 4],
  ['tree', 'Дерево', 8],
  ['house', 'Домик', 16],
  ['pond', 'Пруд', 32],
  ['mill', 'Мельница', 64],
  ['rainbow', 'Радуга', 128],
] as const;

const sweetItems = [
  ['candy', 'Конфета', 2],
  ['cupcake', 'Кекс', 4],
  ['donut', 'Пончик', 8],
  ['waffle', 'Вафля', 16],
  ['syrup_fountain', 'Фонтан сиропа', 32],
  ['jelly_tree', 'Мармеладное дерево', 64],
  ['cake_house', 'Торт-дом', 128],
  ['sugar_castle', 'Сахарный замок', 256],
] as const;

function buildItems(
  biomeId: string,
  rows: readonly (readonly [string, string, number])[],
): ItemDefinition[] {
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
  {
    id: 'green',
    title: 'Зелёная планета',
    planetAssetKey: 'planet_green',
    backgroundAssetKey: 'background_day',
    items: buildItems('green', greenItems),
  },
  {
    id: 'sweet',
    title: 'Сладкая планета',
    planetAssetKey: 'planet_sweet',
    backgroundAssetKey: 'background_day',
    items: buildItems('sweet', sweetItems),
  },
];

export function getBiomeById(id: string): BiomeDefinition | undefined {
  return BIOMES.find((biome) => biome.id === id);
}

export function getItemById(itemId: string): ItemDefinition | undefined {
  return BIOMES.flatMap((biome) => biome.items).find((item) => item.id === itemId);
}
