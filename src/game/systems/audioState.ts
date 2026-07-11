export const AUDIO_PREFERENCE_KEY = 'mini-planet-audio-enabled-v1';

export type MusicKey =
  | 'music_green'
  | 'music_sweet'
  | 'music_sea'
  | 'music_moon';

interface AudioStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): unknown;
}

const BIOME_MUSIC_KEYS: Readonly<Record<string, MusicKey>> = {
  green: 'music_green',
  sweet: 'music_sweet',
  sea: 'music_sea',
  moon: 'music_moon',
};

export function readAudioEnabled(storage: AudioStorage): boolean {
  try {
    return storage.getItem(AUDIO_PREFERENCE_KEY) !== '0';
  } catch {
    return true;
  }
}

export function writeAudioEnabled(storage: AudioStorage, enabled: boolean): void {
  try {
    storage.setItem(AUDIO_PREFERENCE_KEY, enabled ? '1' : '0');
  } catch {
    // Audio remains usable for this session when persistence is unavailable.
  }
}

export function getBiomeMusicKey(biomeId: string): MusicKey | undefined {
  return BIOME_MUSIC_KEYS[biomeId];
}
