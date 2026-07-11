export type RewardPlacement = 'mergeBoost' | 'betterItem';

export interface YandexBridge {
  isAvailable: boolean;
  ready(): Promise<void>;
  showRewardedAd(placement: RewardPlacement): Promise<boolean>;
}

export async function createYandexBridge(): Promise<YandexBridge> {
  return {
    isAvailable: false,
    ready: async () => undefined,
    showRewardedAd: async () => true,
  };
}
