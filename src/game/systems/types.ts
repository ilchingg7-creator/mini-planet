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

export interface GameSlot {
  index: number;
  itemId?: ItemId;
}

export interface MergeState {
  slots: GameSlot[];
  selectedSlotIndex?: number;
  lastDiscoveryItemId?: ItemId;
}

export type UpgradeId = 'autoCreate' | 'income' | 'slots';

export interface EconomyState {
  coins: number;
  planetLevel: number;
  currentBiomeId: BiomeId;
  upgrades: Record<UpgradeId, number>;
  rewardedBoostEndsAt?: number;
  lastSavedAt: number;
}

export interface MiniPlanetSaveData {
  version: 1;
  economy: EconomyState;
  merge: MergeState;
  discoveredItemIds: ItemId[];
  /**
   * Epoch milliseconds of the last write. Used to reconcile local vs cloud
   * saves (last-write-wins). Optional for backward compatibility with
   * existing saves that predate cloud sync; treated as 0 when absent.
   */
  lastModified?: number;
}
