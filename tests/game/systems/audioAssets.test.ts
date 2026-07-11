import { describe, expect, it } from 'vitest';
import { APPROVED_ASSETS } from '../../../src/game/data/assetManifest';

const musicKeys = ['music_green', 'music_sweet', 'music_sea', 'music_moon'];
const effectKeys = [
  'sfx_button',
  'sfx_create',
  'sfx_select',
  'sfx_merge',
  'sfx_coin',
  'sfx_invalid',
  'sfx_level',
  'sfx_reward',
];

describe('audio assets', () => {
  it.each(musicKeys)('registers original music asset %s', (key) => {
    const asset = APPROVED_ASSETS.find((candidate) => candidate.key === key);
    expect(asset).toMatchObject({
      key,
      kind: 'music',
      source: 'generated',
      license: 'project-generated',
    });
    expect(asset?.path).toBe(`assets/audio/${key}.wav`);
  });

  it.each(effectKeys)('registers original sound effect %s', (key) => {
    const asset = APPROVED_ASSETS.find((candidate) => candidate.key === key);
    expect(asset).toMatchObject({
      key,
      kind: 'sfx',
      source: 'generated',
      license: 'project-generated',
    });
    expect(asset?.path).toBe(`assets/audio/${key}.wav`);
  });
});
