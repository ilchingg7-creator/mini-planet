export type BiomeId = string;
export type ItemId = string;

export interface ItemDefinition {
  id: ItemId;
  biomeId: BiomeId;
  tier: number;
  title: string;
  iconKey: string;
  decorKey: string;
  baseIncome: number;
}

export interface BiomeDefinition {
  id: BiomeId;
  title: string;
  planetAssetKey: string;
  backgroundAssetKey: string;
  items: ItemDefinition[];
}
