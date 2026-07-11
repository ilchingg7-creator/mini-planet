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

  return parseSaveRaw(raw, now) ?? createDefaultSave(now);
}

export function writeSave(storage: SaveStorage, data: MiniPlanetSaveData): void {
  storage.setItem(SAVE_KEY, JSON.stringify(data));
}

/**
 * Parse a raw JSON save string into a validated MiniPlanetSaveData, or
 * return null if the JSON is invalid or the structure doesn't match.
 * Used by both loadSave (for localStorage) and the cloud sync path
 * (for Yandex cloud data).
 */
export function parseSaveRaw(raw: string, _now: number): MiniPlanetSaveData | null {
  try {
    const parsed = JSON.parse(raw) as MiniPlanetSaveData;
    return isVersionOneSave(parsed) ? normalizeSave(parsed) : null;
  } catch {
    return null;
  }
}

/**
 * Reconcile a local save with a cloud save using last-write-wins by
 * `lastModified` timestamp. Returns the freshest save. If cloud is null
 * or older, local is returned unchanged. If cloud is fresher, cloud is
 * returned. Saves without `lastModified` are treated as timestamp 0
 * (oldest), so any save with a real timestamp wins over them.
 */
export function mergeSaves(
  local: MiniPlanetSaveData,
  cloud: MiniPlanetSaveData | null,
): MiniPlanetSaveData {
  if (!cloud) return local;
  const localT = local.lastModified ?? 0;
  const cloudT = cloud.lastModified ?? 0;
  return cloudT > localT ? cloud : local;
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
