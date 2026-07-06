import { createInitialEconomyState } from './economy';
import { createInitialMergeState } from './merge';
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
    merge: createInitialMergeState(6),
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
    return isVersionOneSave(parsed) ? parsed : createDefaultSave(now);
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
