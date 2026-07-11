import { describe, expect, it } from 'vitest';
import {
  getBiomeMusicKey,
  readAudioEnabled,
  writeAudioEnabled,
} from '../../../src/game/systems/audioState';

describe('audio state', () => {
  it('defaults to enabled and persists both values', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };

    expect(readAudioEnabled(storage)).toBe(true);
    writeAudioEnabled(storage, false);
    expect(readAudioEnabled(storage)).toBe(false);
    writeAudioEnabled(storage, true);
    expect(readAudioEnabled(storage)).toBe(true);
  });

  it.each([
    ['green', 'music_green'],
    ['sweet', 'music_sweet'],
    ['sea', 'music_sea'],
    ['moon', 'music_moon'],
  ])('maps %s to %s', (biome, key) => {
    expect(getBiomeMusicKey(biome)).toBe(key);
  });

  it('tolerates unavailable storage and unknown biomes', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };

    expect(readAudioEnabled(broken)).toBe(true);
    expect(() => writeAudioEnabled(broken, false)).not.toThrow();
    expect(getBiomeMusicKey('unknown')).toBeUndefined();
  });
});
