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
  ['garden_bench', 'Садовая лавка', 256],
  ['bird_house', 'Птичий домик', 512],
  ['sun_tower', 'Солнечная башня', 1024],
  ['rainbow_palace', 'Дворец радуги', 2048],
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
  ['lollipop_bridge', 'Леденцовый мост', 512],
  ['waffle_mill', 'Вафельная мельница', 1024],
  ['chocolate_fountain', 'Шоколадный фонтан', 2048],
  ['royal_cake', 'Королевский торт', 4096],
] as const;

const seaItems = [
  ['shell', 'Ракушка', 2],
  ['starfish', 'Морская звезда', 4],
  ['coral', 'Коралл', 8],
  ['pearl', 'Жемчужина', 16],
  ['boat', 'Лодочка', 32],
  ['lighthouse', 'Маяк', 64],
  ['reef_house', 'Домик-риф', 128],
  ['whale_fountain', 'Кит-фонтан', 256],
  ['bubble_bridge', 'Пузырьковый мост', 512],
  ['sea_garden', 'Морской сад', 1024],
  ['crystal_lagoon', 'Кристальная лагуна', 2048],
  ['ocean_palace', 'Океанский дворец', 4096],
] as const;

const moonItems = [
  ['stone', 'Лунный камень', 2],
  ['crater', 'Кратер', 4],
  ['crystal', 'Кристалл', 8],
  ['satellite', 'Спутник', 16],
  ['antenna', 'Антенна', 32],
  ['rover', 'Луноход', 64],
  ['dome', 'Купол', 128],
  ['rocket', 'Ракета', 256],
  ['star_gate', 'Звёздные ворота', 512],
  ['moon_garden', 'Лунный сад', 1024],
  ['silver_tower', 'Серебряная башня', 2048],
  ['cosmic_castle', 'Космический замок', 4096],
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
  {
    id: 'sea',
    title: 'Морская планета',
    planetAssetKey: 'planet_sea',
    backgroundAssetKey: 'background_day',
    items: buildItems('sea', seaItems),
  },
  {
    id: 'moon',
    title: 'Лунная планета',
    planetAssetKey: 'planet_moon',
    backgroundAssetKey: 'background_day',
    items: buildItems('moon', moonItems),
  },
];

export function getBiomeById(id: string): BiomeDefinition | undefined {
  return BIOMES.find((biome) => biome.id === id);
}

export function getItemById(itemId: string): ItemDefinition | undefined {
  return BIOMES.flatMap((biome) => biome.items).find((item) => item.id === itemId);
}
