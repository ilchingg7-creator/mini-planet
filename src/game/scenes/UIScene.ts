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
    this.drawLogo();
    this.drawTopPills();
    this.createActionButtons();
    this.createSlotHitAreas();

    this.scene.get('GameScene').events.on('save-changed', (save: MiniPlanetSaveData) => {
      this.coinText?.setText(String(save.economy.coins));
      this.levelText?.setText('\u0423\u0440. ' + save.economy.planetLevel);
    });
  }

  private drawLogo(): void {
    this.add
      .text(360, 42, '\u041c\u0418\u041d\u0418-', {
        fontFamily: 'Arial Black, Arial',
        fontSize: '38px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#168bc9',
        strokeThickness: 10,
        shadow: { offsetX: 0, offsetY: 5, color: '#0876ac', blur: 2, fill: true },
      })
      .setOrigin(0.5);

    this.add
      .text(360, 92, '\u041f\u041b\u0410\u041d\u0415\u0422\u0410', {
        fontFamily: 'Arial Black, Arial',
        fontSize: '48px',
        fontStyle: 'bold',
        color: '#ffd126',
        stroke: '#ffffff',
        strokeThickness: 12,
        shadow: { offsetX: 0, offsetY: 6, color: '#0876ac', blur: 2, fill: true },
      })
      .setOrigin(0.5);
  }

  private drawTopPills(): void {
    const pills = this.add.graphics();
    pills.fillStyle(0x0875a8, 0.25);
    pills.fillRoundedRect(16, 154, 178, 62, 30);
    pills.fillRoundedRect(526, 154, 178, 62, 30);
    pills.fillStyle(0x2baef0, 0.98);
    pills.fillRoundedRect(12, 148, 178, 62, 30);
    pills.fillRoundedRect(522, 148, 178, 62, 30);
    pills.lineStyle(4, 0xffffff, 0.9);
    pills.strokeRoundedRect(12, 148, 178, 62, 30);
    pills.strokeRoundedRect(522, 148, 178, 62, 30);

    this.add
      .text(46, 179, '\u2605', {
        fontFamily: 'Arial',
        fontSize: '34px',
        color: '#ffd52a',
        stroke: '#ef9400',
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    this.levelText = this.add
      .text(112, 179, '\u0423\u0440. 1', {
        fontFamily: 'Arial',
        fontSize: '25px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const coin = this.add.graphics();
    coin.fillStyle(0xffcf24, 1);
    coin.fillCircle(558, 179, 22);
    coin.lineStyle(4, 0xf09a00, 1);
    coin.strokeCircle(558, 179, 22);
    this.add
      .text(558, 179, '\u2605', {
        fontFamily: 'Arial',
        fontSize: '21px',
        color: '#fff1a0',
      })
      .setOrigin(0.5);
    this.coinText = this.add
      .text(630, 179, '0', {
        fontFamily: 'Arial',
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);
  }

  private createActionButtons(): void {
    const createButton = this.createActionButton(
      642,
      430,
      0x78d629,
      0x48a913,
      '\u0421\u043e\u0437\u0434\u0430\u0442\u044c',
      'item_green_sprout',
    );
    createButton.on('pointerdown', () => {
      const gameScene = this.scene.get('GameScene') as Phaser.Scene & { createBaseItem(): void };
      gameScene.createBaseItem();
      this.tweens.add({ targets: createButton, scale: 0.92, duration: 70, yoyo: true });
    });

    const boostButton = this.createActionButton(642, 565, 0x32aef1, 0x147bc4, 'x2');
    boostButton.on('pointerdown', async () => {
      const bridge = this.registry.get('yandexBridge');
      await bridge?.showRewardedAd('incomeBoost');
      this.tweens.add({ targets: boostButton, scale: 0.92, duration: 70, yoyo: true });
    });
  }

  private createActionButton(
    x: number,
    y: number,
    fill: number,
    stroke: number,
    label: string,
    iconKey?: string,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const panel = this.add.graphics();
    panel.fillStyle(0x0875a8, 0.22);
    panel.fillRoundedRect(-58, -50, 120, 112, 24);
    panel.fillStyle(fill, 1);
    panel.fillRoundedRect(-62, -56, 120, 112, 24);
    panel.lineStyle(5, 0xffffff, 0.95);
    panel.strokeRoundedRect(-62, -56, 120, 112, 24);
    panel.lineStyle(3, stroke, 1);
    panel.strokeRoundedRect(-57, -51, 110, 102, 20);
    container.add(panel);

    if (iconKey && this.textures.exists(iconKey)) {
      container.add(this.add.image(-2, -15, iconKey).setDisplaySize(58, 58));
    }

    container.add(
      this.add
        .text(-2, iconKey ? 35 : 0, label, {
          fontFamily: 'Arial',
          fontSize: iconKey ? '18px' : '38px',
          fontStyle: 'bold',
          color: '#ffffff',
          stroke: stroke === 0x48a913 ? '#277c0b' : '#0864a5',
          strokeThickness: 3,
        })
        .setOrigin(0.5),
    );

    container.setSize(126, 118);
    container.setInteractive(new Phaser.Geom.Rectangle(-63, -59, 126, 118), Phaser.Geom.Rectangle.Contains);
    return container;
  }

  private createSlotHitAreas(): void {
    const gameScene = this.scene.get('GameScene') as Phaser.Scene & { selectSlot(slotIndex: number): void };

    SLOT_POSITIONS.forEach((position, index) => {
      this.add
        .rectangle(position.x, position.y, 94, 94, 0xffffff, 0.001)
        .setInteractive()
        .on('pointerdown', () => gameScene.selectSlot(index));
    });
  }
}
