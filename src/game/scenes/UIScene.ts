import Phaser from 'phaser';
import { SLOT_POSITIONS } from '../data/layout';
import type { MiniPlanetSaveData } from '../systems/types';

export class UIScene extends Phaser.Scene {
  private coinText?: Phaser.GameObjects.Text;

  constructor() {
    super('UIScene');
  }

  create(): void {
    this.coinText = this.add.text(32, 28, '\u041c\u043e\u043d\u0435\u0442\u044b: 0', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#17442a',
      backgroundColor: '#ffffffaa',
      padding: { x: 16, y: 8 },
    });

    const createButton = this.add.rectangle(360, 800, 300, 88, 0xffd44d).setStrokeStyle(4, 0xd99b1f);
    const createLabel = this.add
      .text(360, 800, '\u0421\u043e\u0437\u0434\u0430\u0442\u044c', {
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

    const adButton = this.add.rectangle(600, 800, 110, 88, 0x7cc7ff).setStrokeStyle(4, 0x3289c9);
    const adLabel = this.add
      .text(600, 800, 'x2', {
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

    this.createSlotHitAreas();

    this.scene.get('GameScene').events.on('save-changed', (save: MiniPlanetSaveData) => {
      this.coinText?.setText(`\u041c\u043e\u043d\u0435\u0442\u044b: ${save.economy.coins}`);
    });
  }

  private createSlotHitAreas(): void {
    const gameScene = this.scene.get('GameScene') as Phaser.Scene & { selectSlot(slotIndex: number): void };

    SLOT_POSITIONS.forEach((position, index) => {
      this.add
        .rectangle(position.x, position.y, 100, 100, 0xffffff, 0.001)
        .setInteractive()
        .on('pointerdown', () => gameScene.selectSlot(index));
    });
  }
}
