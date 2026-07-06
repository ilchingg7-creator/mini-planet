import {
  applyOfflineIncome,
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
