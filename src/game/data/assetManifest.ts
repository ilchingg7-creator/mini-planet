import Phaser from 'phaser';
import manifest from '../assets/manifest.json';
import greenV2Manifest from '../assets/green-v2.json';

export type AssetKind = 'background' | 'planet' | 'item' | 'decor' | 'ui' | 'music' | 'sfx';
export type AssetStatus = 'approved';

export interface AssetRecord {
  key: string;
  path: string;
  kind: AssetKind;
  status: AssetStatus;
  source: 'generated' | 'external';
  license: string;
  prompt?: string;
  sourceUrl?: string;
}

const greenV2Assets = greenV2Manifest as AssetRecord[];
const remainingBiomeItems = {
  sweet: ['sugar_crystal', 'candy', 'lollipop', 'cupcake', 'donut', 'cake', 'pastry_cart', 'gingerbread_house', 'bakery', 'chocolate_tower', 'sugar_castle', 'royal_palace'],
  sea: ['shell', 'starfish', 'coral', 'pearl_shrine', 'reef', 'boat', 'lighthouse', 'reef_house', 'harbor', 'underwater_town', 'ocean_palace', 'sea_kingdom'],
  moon: ['stone', 'crystal', 'beacon', 'antenna', 'satellite', 'rover', 'landing_module', 'dome', 'rocket_base', 'star_gate', 'moon_tower', 'cosmic_castle'],
} as const;

const remainingV3Assets: AssetRecord[] = Object.entries(remainingBiomeItems).flatMap(
  ([biome, items]) => [
    {
      key: `planet_${biome}`,
      path: `assets/approved/${biome}-v3/planet_${biome}_base.png`,
      kind: 'planet' as const,
      status: 'approved' as const,
      source: 'generated' as const,
      license: 'project-generated',
      prompt: `Approved ${biome} biome v3 planet base.`,
    },
    ...items.flatMap((item) => (['item', 'decor'] as const).map((kind) => ({
      key: `${kind}_${biome}_${item}`,
      path: `assets/approved/${biome}-v3/${biome}_${item}.png`,
      kind,
      status: 'approved' as const,
      source: 'generated' as const,
      license: 'project-generated',
      prompt: `Approved ${biome} biome v3 progression sheet.`,
    }))),
  ],
);

const replacementAssets = [...greenV2Assets, ...remainingV3Assets];
const replacedKeys = new Set(replacementAssets.map((asset) => asset.key));

export const APPROVED_ASSETS = [
  ...replacementAssets,
  ...(manifest as AssetRecord[]).filter((asset) => !replacedKeys.has(asset.key)),
];

export function loadApprovedAssets(scene: Phaser.Scene): void {
  for (const asset of APPROVED_ASSETS) {
    if (asset.kind === 'music' || asset.kind === 'sfx') {
      scene.load.audio(asset.key, asset.path);
    } else {
      scene.load.image(asset.key, asset.path);
    }
  }
}
