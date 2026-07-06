import Phaser from 'phaser';
import { loadApprovedAssets } from '../data/assetManifest';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload(): void {
    loadApprovedAssets(this);
  }

  create(): void {
    this.scene.start('GameScene');
    this.scene.launch('UIScene');
  }
}
