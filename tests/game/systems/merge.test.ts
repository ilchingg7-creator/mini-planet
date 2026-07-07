import {
  createBaseItem,
  createInitialMergeState,
  selectSlot,
} from '../../../src/game/systems/merge';
import { BIOMES } from '../../../src/game/data/biomes';

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

  it('can reach the final item in a twelve-item biome with twelve slots', () => {
    const biome = BIOMES[0];
    let state = createInitialMergeState(12);

    for (let createCount = 0; createCount < Math.pow(2, biome.items.length - 1); createCount += 1) {
      state = createBaseItem(state, biome.items[0].id);

      let mergedPair = true;
      while (mergedPair) {
        mergedPair = false;

        for (const item of biome.items) {
          const matchingSlots = state.slots.filter((slot) => slot.itemId === item.id);
          const nextItem = biome.items[item.tier + 1];

          if (matchingSlots.length >= 2 && nextItem) {
            state = selectSlot(state, matchingSlots[0].index, nextItem.id);
            state = selectSlot(state, matchingSlots[1].index, nextItem.id);
            mergedPair = true;
            break;
          }
        }
      }
    }

    expect(state.slots.some((slot) => slot.itemId === biome.items[biome.items.length - 1].id)).toBe(true);
  });
});
