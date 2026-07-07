import Phaser from 'phaser';
import { SLOT_POSITIONS } from '../data/layout';
import type { MiniPlanetSaveData } from '../systems/types';

export class UIScene extends Phaser.Scene {
  private coinText?: Phaser.GameObjects.Text;
  private levelText?: Phaser.GameObjects.Text;

  constructor() {
    super('UIScene');
  }

  create(): void {
    const topBar = this.add.graphics();
    topBar.fillStyle(0xffffff, 0.82);
    topBar.fillRoundedRect(28, 24, 214, 54, 18);
    topBar.fillRoundedRect(544, 24, 128, 54, 18);

    this.coinText = this.add.text(52, 36, '\u041c\u043e\u043d\u0435\u0442\u044b: 0', {
      fontFamily: 'Arial',
      fontSize: '25px',
      color: '#17442a',
    });
    this.levelText = this.add.text(568, 36, '\u0423\u0440. 1', {
      fontFamily: 'Arial',
      fontSize: '25px',
      color: '#17442a',
    });

    const createButton = this.add.rectangle(328, 755, 330, 92, 0xffd44d).setStrokeStyle(5, 0xd99b1f);
    const createLabel = this.add
      .text(328, 755, '\u0421\u043e\u0437\u0434\u0430\u0442\u044c', {
        fontFamily: 'Arial',
        fontSize: '38px',
        color: '#5b3b00',
      })
      .setOrigin(0.5);

    createButton.setInteractive();
    createButton.on('pointerdown', () => {
      const gameScene = this.scene.get('GameScene') as Phaser.Scene & { createBaseItem(): void };
      gameScene.createBaseItem();
      this.tweens.add({ targets: [createButton, createLabel], scale: 0.96, duration: 60, yoyo: true });
    });

    const adButton = this.add.rectangle(570, 755, 116, 92, 0x7cc7ff).setStrokeStyle(5, 0x3289c9);
    const adLabel = this.add
      .text(570, 755, 'x2', {
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
      this.levelText?.setText(`\u0423\u0440. ${save.economy.planetLevel}`);
    });
  }

  private createSlotHitAreas(): void {
    const gameScene = this.scene.get('GameScene') as Phaser.Scene & { selectSlot(slotIndex: number): void };

    SLOT_POSITIONS.forEach((position, index) => {
      this.add
        .rectangle(position.x, position.y, 104, 104, 0xffffff, 0.001)
        .setInteractive()
        .on('pointerdown', () => gameScene.selectSlot(index));
    });
  }
}
