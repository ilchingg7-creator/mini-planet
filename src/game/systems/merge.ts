import type { GameSlot, ItemId, MergeState } from './types';

export function createInitialMergeState(slotCount: number): MergeState {
  return {
    slots: Array.from({ length: slotCount }, (_, index) => ({ index })),
  };
}

export function createBaseItem(state: MergeState, baseItemId: ItemId): MergeState {
  const firstEmptyIndex = state.slots.findIndex((slot) => slot.itemId === undefined);

  if (firstEmptyIndex === -1) {
    return state;
  }

  return {
    ...state,
    slots: state.slots.map((slot) =>
      slot.index === firstEmptyIndex ? { ...slot, itemId: baseItemId } : slot,
    ),
  };
}

export function selectSlot(
  state: MergeState,
  slotIndex: number,
  nextItemId: ItemId | undefined,
): MergeState {
  const slot = state.slots[slotIndex];

  if (!slot?.itemId) {
    return { ...state, selectedSlotIndex: undefined };
  }

  if (state.selectedSlotIndex === undefined || state.selectedSlotIndex === slotIndex) {
    return { ...state, selectedSlotIndex: slotIndex };
  }

  const selectedSlot = state.slots[state.selectedSlotIndex];

  if (!selectedSlot?.itemId || selectedSlot.itemId !== slot.itemId || !nextItemId) {
    return { ...state, selectedSlotIndex: slotIndex };
  }

  const mergedSlots = mergeSlots(state.slots, selectedSlot.index, slot.index, nextItemId);

  return {
    slots: mergedSlots,
    selectedSlotIndex: undefined,
    lastDiscoveryItemId: nextItemId,
  };
}

function mergeSlots(
  slots: GameSlot[],
  targetIndex: number,
  consumedIndex: number,
  nextItemId: ItemId,
): GameSlot[] {
  return slots.map((slot) => {
    if (slot.index === targetIndex) {
      return { ...slot, itemId: nextItemId };
    }

    if (slot.index === consumedIndex) {
      return { index: slot.index };
    }

    return slot;
  });
}
