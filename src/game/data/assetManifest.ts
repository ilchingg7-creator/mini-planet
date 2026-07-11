import Phaser from 'phaser';
import manifest from '../assets/manifest.json';
import greenV2Manifest from '../assets/green-v2.json';

export type AssetKind = 'background' | 'planet' | 'item' | 'decor' | 'ui';
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
const replacedKeys = new Set(greenV2Assets.map((asset) => asset.key));

export const APPROVED_ASSETS = [
  ...greenV2Assets,
  ...(manifest as AssetRecord[]).filter((asset) => !replacedKeys.has(asset.key)),
];

export function loadApprovedAssets(scene: Phaser.Scene): void {
  for (const asset of APPROVED_ASSETS) {
    scene.load.image(asset.key, asset.path);
  }
}
