import Phaser from 'phaser';
import type { MiniPlanetSaveData } from '../systems/types';

export class UIScene extends Phaser.Scene {
  private coinText?: Phaser.GameObjects.Text;

  constructor() {
    super('UIScene');
  }

  create(): void {
    this.coinText = this.add.text(32, 28, 'Монеты: 0', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#17442a',
      backgroundColor: '#ffffffaa',
      padding: { x: 16, y: 8 },
    });

    const createButton = this.add.rectangle(360, 900, 300, 88, 0xffd44d).setStrokeStyle(4, 0xd99b1f);
    const createLabel = this.add
      .text(360, 900, 'Создать', {
        fontFamily: 'Arial',
        fontSize: '36px',
        color: '#5b3b00',
      })
      .setOrigin(0.5);

    createButton.setInteractive();
    createButton.on('pointerdown', () => {
      const gameScene = this.scene.get('GameScene') as Phaser.Scene & { createBaseItem(): void };
      gameScene.createBaseItem();
      this.tweens.add({ targets: [createButton, createLabel], scale: 0.96, duration: 60, yoyo: true });
    });

    const adButton = this.add.rectangle(600, 900, 110, 88, 0x7cc7ff).setStrokeStyle(4, 0x3289c9);
    const adLabel = this.add
      .text(600, 900, 'x2', {
        fontFamily: 'Arial',
        fontSize: '30px',
        color: '#07324f',
      })
      .setOrigin(0.5);

    adButton.setInteractive();
    adButton.on('pointerdown', async () => {
      const bridge = this.registry.get('yandexBridge');
      await bridge?.showRewardedAd('incomeBoost');
      this.tweens.add({ targets: [adButton, adLabel], scale: 0.96, duration: 60, yoyo: true });
    });

    this.scene.get('GameScene').events.on('save-changed', (save: MiniPlanetSaveData) => {
      this.coinText?.setText(`Монеты: ${save.economy.coins}`);
    });
  }
}
