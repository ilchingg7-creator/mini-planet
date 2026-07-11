import {
  activateMergeRewardBoost,
  applyOfflineIncome,
  awardMergeCoins,
  buyUpgrade,
  calculatePassiveIncomePerSecond,
  createInitialEconomyState,
} from '../../../src/game/systems/economy';

describe('economy system', () => {
  it('calculates passive income from discovered items and income level', () => {
    const income = calculatePassiveIncomePerSecond(
      ['green_sprout', 'green_flower'],
      { green_sprout: 1, green_flower: 2 },
      2,
    );

    expect(income).toBe(6);
  });

  it('applies capped offline income', () => {
    const initial = createInitialEconomyState(1_000);
    const next = applyOfflineIncome(initial, 61_000, 10);

    expect(next.coins).toBe(600);
    expect(next.lastSavedAt).toBe(61_000);
  });

  it('awards coins only when a merge supplies a reward', () => {
    const initial = createInitialEconomyState(1_000);
    const next = awardMergeCoins(initial, 8, 1_000);

    expect(next.coins).toBe(8);
    expect(next.lastSavedAt).toBe(1_000);
  });

  it('doubles merge rewards while the rewarded boost is active', () => {
    const initial = createInitialEconomyState(1_000);
    const boosted = activateMergeRewardBoost(initial, 2_000, 120_000);

    expect(awardMergeCoins(boosted, 8, 121_999).coins).toBe(16);
    expect(awardMergeCoins(boosted, 8, 122_000).coins).toBe(8);
    expect(boosted.rewardedBoostEndsAt).toBe(122_000);
  });

  it('buys an upgrade when coins are enough', () => {
    const state = { ...createInitialEconomyState(0), coins: 100 };
    const next = buyUpgrade(state, 'income');

    expect(next.coins).toBe(80);
    expect(next.upgrades.income).toBe(2);
  });

  it('keeps state unchanged when coins are not enough', () => {
    const state = createInitialEconomyState(0);
    const next = buyUpgrade(state, 'income');

    expect(next).toEqual(state);
  });
});
