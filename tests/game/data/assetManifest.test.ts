import { APPROVED_ASSETS } from '../../../src/game/data/assetManifest';
import { BIOMES } from '../../../src/game/data/biomes';

describe('approved asset manifest', () => {
  it('contains planets, item sprites, and decoration sprites for every biome', () => {
    const keys = new Set(APPROVED_ASSETS.map((asset) => asset.key));
    for (const biome of BIOMES) {
      expect(keys.has(biome.planetAssetKey), `missing ${biome.planetAssetKey}`).toBe(true);
      for (const item of biome.items) {
        expect(keys.has(item.iconKey), `missing ${item.iconKey}`).toBe(true);
        expect(keys.has(item.decorKey), `missing ${item.decorKey}`).toBe(true);
      }
    }
  });

  it('uses the clean progression-ready green planet', () => {
    const planet = APPROVED_ASSETS.find((asset) => asset.key === 'planet_green');

    expect(planet?.path).toBe('assets/approved/green-v2/planet_green_base.png');
  });

  it('uses the approved portrait background instead of the stretched square source', () => {
    const background = APPROVED_ASSETS.find((asset) => asset.key === 'background_day');

    expect(background?.path).toBe('assets/approved/background_day_v2.png');
  });
});
