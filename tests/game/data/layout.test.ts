import { SLOT_POSITIONS } from '../../../src/game/data/layout';

describe('game layout', () => {
  it('places the twelve merge slots as a compact four-by-three tray', () => {
    const rows = new Map<number, number>();

    SLOT_POSITIONS.forEach((position) => {
      rows.set(position.y, (rows.get(position.y) ?? 0) + 1);
      expect(position.x).toBeGreaterThanOrEqual(90);
      expect(position.x).toBeLessThanOrEqual(630);
      expect(position.y).toBeGreaterThanOrEqual(840);
      expect(position.y).toBeLessThanOrEqual(1180);
    });

    expect([...rows.values()]).toEqual([4, 4, 4]);
  });
});
