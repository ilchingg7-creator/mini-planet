import type { EconomyState, UpgradeId } from './types';

const MAX_OFFLINE_MS = 4 * 60 * 60 * 1000;
const BASE_UPGRADE_COST: Record<UpgradeId, number> = {
  autoCreate: 30,
  income: 20,
  slots: 100,
};

export function createInitialEconomyState(now: number): EconomyState {
  return {
    coins: 0,
    planetLevel: 1,
    currentBiomeId: 'green',
    upgrades: {
      autoCreate: 1,
      income: 1,
      slots: 1,
    },
    lastSavedAt: now,
  };
}

export function calculatePassiveIncomePerSecond(
  discoveredItemIds: string[],
  itemIncome: Record<string, number>,
  incomeLevel: number,
): number {
  const baseIncome = discoveredItemIds.reduce((sum, itemId) => sum + (itemIncome[itemId] ?? 0), 0);
  return baseIncome * incomeLevel;
}

export function applyOfflineIncome(
  state: EconomyState,
  now: number,
  incomePerSecond: number,
): EconomyState {
  const elapsedMs = Math.max(0, Math.min(now - state.lastSavedAt, MAX_OFFLINE_MS));
  const earnedCoins = Math.floor((elapsedMs / 1000) * incomePerSecond);

  return {
    ...state,
    coins: state.coins + earnedCoins,
    lastSavedAt: now,
  };
}

export function accruePassiveIncome(
  state: EconomyState,
  now: number,
  discoveredItemIds: string[],
  itemIncome: Record<string, number>,
): EconomyState {
  const incomePerSecond = calculatePassiveIncomePerSecond(
    discoveredItemIds,
    itemIncome,
    state.upgrades.income,
  );

  return applyOfflineIncome(state, now, incomePerSecond);
}

export function buyUpgrade(state: EconomyState, upgradeId: UpgradeId): EconomyState {
  const level = state.upgrades[upgradeId];
  const cost = getUpgradeCost(upgradeId, level);

  if (state.coins < cost) {
    return state;
  }

  return {
    ...state,
    coins: state.coins - cost,
    upgrades: {
      ...state.upgrades,
      [upgradeId]: level + 1,
    },
  };
}

export function getUpgradeCost(upgradeId: UpgradeId, level: number): number {
  return Math.floor(BASE_UPGRADE_COST[upgradeId] * Math.pow(1.7, level - 1));
}
