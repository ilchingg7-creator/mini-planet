import Phaser from 'phaser';
import { loadApprovedAssets } from '../data/assetManifest';

export class PreloadScene extends Phaser.Scene {
  private progressBar?: Phaser.GameObjects.Graphics;
  private progressText?: Phaser.GameObjects.Text;
  private failedAssets: string[] = [];

  constructor() {
    super('PreloadScene');
  }

  preload(): void {
    const { width, height } = this.scale;

    // Centered progress bar so the user sees the game is loading 12+ MB of
    // assets (4 music loops + 8 SFX + ~50 PNGs). Without this, on slow
    // Yandex iframe connections the user sees the BootScene's "Loading…"
    // forever and assumes the game crashed.
    const barW = 480;
    const barH = 28;
    const barX = (width - barW) / 2;
    const barY = height / 2;

    // Track outline
    const outline = this.add.graphics();
    outline.lineStyle(3, 0xffffff, 0.85);
    outline.strokeRoundedRect(barX - 2, barY - 2, barW + 4, barH + 4, 14);

    this.progressBar = this.add.graphics();

    this.add
      .text(width / 2, barY - 50, 'Loading game…', {
        fontFamily: 'Arial Black, Arial',
        fontSize: '34px',
        color: '#ffffff',
        stroke: '#168bc9',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.progressText = this.add
      .text(width / 2, barY + barH + 26, '0%', {
        fontFamily: 'Arial',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#168bc9',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      this.progressBar?.clear();
      this.progressBar?.fillStyle(0x2baef0, 1);
      this.progressBar?.fillRoundedRect(barX, barY, barW * value, barH, 12);
      this.progressText?.setText(Math.round(value * 100) + '%');
    });

    // Don't let a single 404 / decode error hang the loader forever.
    // Phaser emits 'loaderror' per asset; collect names, keep going.
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      this.failedAssets.push(file.key);
      // Keep loading other assets instead of failing the whole scene.
    });

    this.load.on('complete', () => {
      if (this.failedAssets.length > 0) {
        // eslint-disable-next-line no-console
        console.warn('[PreloadScene] Some assets failed to load:', this.failedAssets);
      }
    });

    loadApprovedAssets(this);
  }

  create(): void {
    this.scene.start('GameScene');
    this.scene.launch('UIScene');
  }
}
