import Phaser from 'phaser';
import manifest from '../assets/manifest.json';

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

export const APPROVED_ASSETS = manifest as AssetRecord[];

export function loadApprovedAssets(scene: Phaser.Scene): void {
  for (const asset of APPROVED_ASSETS) {
    scene.load.image(asset.key, asset.path);
  }
}
