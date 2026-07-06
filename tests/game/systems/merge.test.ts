import {
  createBaseItem,
  createInitialMergeState,
  selectSlot,
} from '../../../src/game/systems/merge';

describe('merge system', () => {
  it('creates a base item in the first empty slot', () => {
    const state = createBaseItem(createInitialMergeState(3), 'green_sprout');

    expect(state.slots.map((slot) => slot.itemId)).toEqual(['green_sprout', undefined, undefined]);
  });

  it('does not create an item when slots are full', () => {
    const state = createBaseItem(
      createBaseItem(createInitialMergeState(1), 'green_sprout'),
      'green_sprout',
    );

    expect(state.slots.map((slot) => slot.itemId)).toEqual(['green_sprout']);
  });

  it('selects the first item and merges with a matching second item', () => {
    const filled = createBaseItem(
      createBaseItem(createInitialMergeState(3), 'green_sprout'),
      'green_sprout',
    );

    const selected = selectSlot(filled, 0, 'green_flower');
    const merged = selectSlot(selected, 1, 'green_flower');

    expect(merged.selectedSlotIndex).toBeUndefined();
    expect(merged.slots.map((slot) => slot.itemId)).toEqual(['green_flower', undefined, undefined]);
    expect(merged.lastDiscoveryItemId).toBe('green_flower');
  });

  it('switches selection when second selected slot does not match', () => {
    const initial = createInitialMergeState(2);
    const withItems = {
      ...initial,
      slots: [
        { index: 0, itemId: 'green_sprout' },
        { index: 1, itemId: 'green_flower' },
      ],
    };

    const selected = selectSlot(withItems, 0, 'green_flower');
    const switched = selectSlot(selected, 1, undefined);

    expect(switched.selectedSlotIndex).toBe(1);
    expect(switched.slots.map((slot) => slot.itemId)).toEqual(['green_sprout', 'green_flower']);
  });
});
