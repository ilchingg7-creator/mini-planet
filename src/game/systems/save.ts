import { createInitialEconomyState } from './economy';
import { createInitialMergeState } from './merge';
import { BOARD_SLOT_COUNT } from '../data/layout';
import type { MiniPlanetSaveData } from './types';

const SAVE_KEY = 'mini-planet-save';

export interface SaveStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function createDefaultSave(now: number): MiniPlanetSaveData {
  return {
    version: 1,
    economy: createInitialEconomyState(now),
    merge: createInitialMergeState(BOARD_SLOT_COUNT),
    discoveredItemIds: [],
  };
}

export function loadSave(storage: SaveStorage, now: number): MiniPlanetSaveData {
  const raw = storage.getItem(SAVE_KEY);

  if (!raw) {
    return createDefaultSave(now);
  }

  try {
    const parsed = JSON.parse(raw) as MiniPlanetSaveData;
    return isVersionOneSave(parsed) ? normalizeSave(parsed) : createDefaultSave(now);
  } catch {
    return createDefaultSave(now);
  }
}

export function writeSave(storage: SaveStorage, data: MiniPlanetSaveData): void {
  storage.setItem(SAVE_KEY, JSON.stringify(data));
}

function isVersionOneSave(value: MiniPlanetSaveData): value is MiniPlanetSaveData {
  return (
    value.version === 1 &&
    Array.isArray(value.discoveredItemIds) &&
    Array.isArray(value.merge?.slots) &&
    typeof value.economy?.coins === 'number'
  );
}

function normalizeSave(save: MiniPlanetSaveData): MiniPlanetSaveData {
  if (save.merge.slots.length >= BOARD_SLOT_COUNT) {
    return save;
  }

  const extraSlots = Array.from({ length: BOARD_SLOT_COUNT - save.merge.slots.length }, (_, offset) => ({
    index: save.merge.slots.length + offset,
  }));

  return {
    ...save,
    merge: {
      ...save.merge,
      slots: [...save.merge.slots, ...extraSlots],
    },
  };
}
