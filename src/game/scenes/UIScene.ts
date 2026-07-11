import Phaser from 'phaser';
import { SLOT_POSITIONS } from '../data/layout';
import type { MiniPlanetSaveData } from '../systems/types';
import { translate, type Locale, type MessageKey } from '../i18n';

export class UIScene extends Phaser.Scene {
  private coinText?: Phaser.GameObjects.Text;
  private levelText?: Phaser.GameObjects.Text;
  private boostTimerText?: Phaser.GameObjects.Text;
  private boostEndsAt?: number;
  private locale: Locale = 'en';
  private tutorialText?: Phaser.GameObjects.Text;
  private tutorialContainer?: Phaser.GameObjects.Container;
  private tutorialCreates = 0;
  private tutorialStage: 'create' | 'merge' | 'done' = 'done';

  constructor() {
    super('UIScene');
  }

  create(): void {
    this.locale = this.registry.get('locale') ?? 'en';
    this.drawLogo();
    this.drawTopPills();
    this.createUtilityButtons();
    this.createActionButtons();
    this.createSlotHitAreas();

    const gameScene = this.scene.get('GameScene') as Phaser.Scene & {
      getSaveData(): MiniPlanetSaveData;
    };
    const updateCounters = (save: MiniPlanetSaveData) => {
      this.coinText?.setText(String(save.economy.coins));
      this.levelText?.setText(this.t('level') + ' ' + save.economy.planetLevel);
      this.boostEndsAt = save.economy.rewardedBoostEndsAt;
      this.updateBoostCountdown();
    };

    gameScene.events.on('save-changed', updateCounters);
    const showLevelTransition = (level: number) => this.showLevelTransition(level);
    gameScene.events.on('level-advanced', showLevelTransition);
    const finishTutorial = () => this.finishTutorial();
    gameScene.events.on('item-merged', finishTutorial);
    updateCounters(gameScene.getSaveData());
    this.time.addEvent({
      delay: 250,
      loop: true,
      callback: () => this.updateBoostCountdown(),
    });

    this.startTutorial();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      gameScene.events.off('save-changed', updateCounters);
      gameScene.events.off('level-advanced', showLevelTransition);
      gameScene.events.off('item-merged', finishTutorial);
    });

    if (!this.registry.get('gameReadyReported')) {
      this.registry.set('gameReadyReported', true);
      const bridge = this.registry.get('yandexBridge');
      void bridge?.markReady();
    }
  }

  private drawLogo(): void {
    this.add
      .text(360, 42, this.t('logoTop'), {
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
      .text(360, 92, this.t('logoBottom'), {
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
      .text(112, 179, this.t('level') + ' 1', {
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
      this.t('create'),
      'item_green_sprout',
    );
    const createHitArea = this.add.zone(642, 430, 132, 124).setInteractive({ useHandCursor: true });
    createHitArea.on('pointerdown', () => {
      const gameScene = this.scene.get('GameScene') as Phaser.Scene & { createBaseItem(): boolean };
      const created = gameScene.createBaseItem();
      this.tweens.add({ targets: createButton, scale: 0.92, duration: 70, yoyo: true });

      if (!created) {
        this.tweens.add({
          targets: createButton,
          x: createButton.x + 7,
          duration: 45,
          yoyo: true,
          repeat: 2,
        });
      } else {
        this.recordTutorialCreate();
      }
    });

    const boostButton = this.createActionButton(642, 565, 0x32aef1, 0x147bc4, this.t('adBoostShort'));
    this.boostTimerText = this.add
      .text(642, 600, '', {
        fontFamily: 'Arial',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#0864a5',
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    const boostHitArea = this.add.zone(642, 565, 132, 124).setInteractive({ useHandCursor: true });
    boostHitArea.on('pointerdown', () => {
      this.tweens.add({ targets: boostButton, scale: 0.92, duration: 70, yoyo: true });
      this.showRewardConfirmation();
    });
  }

  private createUtilityButtons(): void {
    this.createUtilityButton(310, this.locale.toUpperCase(), () => {
      const nextLocale: Locale = this.locale === 'ru' ? 'en' : 'ru';
      this.registry.set('locale', nextLocale);
      document.documentElement.lang = nextLocale;
      this.scene.restart();
    });
    this.createUtilityButton(410, '?', () => this.showSupport());
  }

  private createUtilityButton(x: number, label: string, onClick: () => void): void {
    const background = this.add.graphics();
    background.fillStyle(0x168bc9, 0.92);
    background.fillRoundedRect(x - 42, 151, 84, 56, 22);
    background.lineStyle(3, 0xffffff, 0.9);
    background.strokeRoundedRect(x - 42, 151, 84, 56, 22);
    this.add.text(x, 179, label, { fontFamily: 'Arial', fontSize: '22px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
    this.add.zone(x, 179, 84, 56).setInteractive({ useHandCursor: true }).on('pointerdown', onClick);
  }

  private updateBoostCountdown(): void {
    if (!this.boostTimerText) {
      return;
    }

    const remainingSeconds = Math.max(
      0,
      Math.ceil(((this.boostEndsAt ?? 0) - Date.now()) / 1000),
    );

    if (remainingSeconds === 0) {
      this.boostTimerText.setText('');
      return;
    }

    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = String(remainingSeconds % 60).padStart(2, '0');
    this.boostTimerText.setText(String(minutes) + ':' + seconds);
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
          fontSize: iconKey ? '18px' : label.includes('\n') ? '19px' : '38px',
          fontStyle: 'bold',
          color: '#ffffff',
          align: 'center',
          stroke: stroke === 0x48a913 ? '#277c0b' : '#0864a5',
          strokeThickness: 3,
        })
        .setOrigin(0.5),
    );

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

  private showRewardConfirmation(): void {
    const modal = this.createModal(this.t('adTitle'), this.t('adDescription'));
    this.createModalButton(modal, -105, 110, this.t('watchAd'), 0x70c92b, () => {
      modal.destroy();
      void this.runRewardedAd();
    });
    this.createModalButton(modal, 105, 110, this.t('cancel'), 0x168bc9, () => modal.destroy());
  }

  private async runRewardedAd(): Promise<void> {
    const bridge = this.registry.get('yandexBridge');
    const gameScene = this.scene.get('GameScene') as Phaser.Scene & {
      activateMergeBoost(durationMs: number): void;
    };
    const rewarded = await bridge?.showRewardedAd('mergeBoost', {
      onOpen: () => {
        this.scene.pause('GameScene');
        this.sound.pauseAll();
      },
      onClose: () => {
        this.scene.resume('GameScene');
        this.sound.resumeAll();
      },
    });
    if (rewarded) gameScene.activateMergeBoost(120_000);
  }

  private showSupport(): void {
    const modal = this.createModal(this.t('support'), this.t('supportEmail'));
    this.createModalButton(modal, 0, 110, this.t('close'), 0x168bc9, () => modal.destroy());
  }

  private createModal(title: string, body: string): Phaser.GameObjects.Container {
    const modal = this.add.container(360, 610).setDepth(200);
    const blocker = this.add.rectangle(0, 30, 720, 1280, 0x0875a8, 0.72).setInteractive();
    const panel = this.add.graphics();
    panel.fillStyle(0xfffbef, 1);
    panel.fillRoundedRect(-285, -155, 570, 340, 28);
    panel.lineStyle(6, 0xffffff, 1);
    panel.strokeRoundedRect(-285, -155, 570, 340, 28);
    const titleText = this.add.text(0, -105, title, {
      fontFamily: 'Arial Black, Arial', fontSize: '34px', fontStyle: 'bold', color: '#168bc9', align: 'center',
    }).setOrigin(0.5);
    const bodyText = this.add.text(0, -15, body, {
      fontFamily: 'Arial', fontSize: '24px', fontStyle: 'bold', color: '#31556b', align: 'center',
      wordWrap: { width: 490 },
    }).setOrigin(0.5);
    modal.add([blocker, panel, titleText, bodyText]);
    return modal;
  }

  private createModalButton(
    modal: Phaser.GameObjects.Container,
    x: number,
    y: number,
    label: string,
    color: number,
    onClick: () => void,
  ): void {
    const button = this.add.rectangle(x, y, 180, 62, color, 1).setStrokeStyle(4, 0xffffff).setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, { fontFamily: 'Arial', fontSize: '22px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
    button.on('pointerdown', onClick);
    modal.add([button, text]);
  }

  private startTutorial(): void {
    if (window.localStorage.getItem('mini-planet-tutorial-complete') === '1') return;
    this.tutorialStage = 'create';
    const panel = this.add.rectangle(360, 875, 600, 84, 0x168bc9, 0.96).setStrokeStyle(4, 0xffffff);
    this.tutorialText = this.add.text(360, 875, this.t('tutorialCreate'), {
      fontFamily: 'Arial', fontSize: '25px', fontStyle: 'bold', color: '#ffffff', align: 'center',
      wordWrap: { width: 540 },
    }).setOrigin(0.5);
    this.tutorialContainer = this.add.container(0, 0, [panel, this.tutorialText]).setDepth(50);
  }

  private recordTutorialCreate(): void {
    if (this.tutorialStage !== 'create') return;
    this.tutorialCreates += 1;
    if (this.tutorialCreates >= 2) {
      this.tutorialStage = 'merge';
      this.tutorialText?.setText(this.t('tutorialMerge'));
    }
  }

  private finishTutorial(): void {
    if (this.tutorialStage !== 'merge') return;
    this.tutorialStage = 'done';
    window.localStorage.setItem('mini-planet-tutorial-complete', '1');
    this.tweens.add({
      targets: this.tutorialContainer,
      alpha: 0,
      duration: 250,
      onComplete: () => this.tutorialContainer?.destroy(),
    });
  }

  private showLevelTransition(level: number): void {
    const shade = this.add.rectangle(360, 640, 720, 1280, 0x0875a8, 0.72).setDepth(100);
    const title = this.add.text(360, 555, this.t('levelComplete'), {
      fontFamily: 'Arial Black, Arial', fontSize: '42px', fontStyle: 'bold', color: '#ffd126',
      stroke: '#ffffff', strokeThickness: 8, align: 'center',
    }).setOrigin(0.5).setDepth(101);
    const subtitle = this.add.text(360, 635, this.t('nextLevel', { level }), {
      fontFamily: 'Arial', fontSize: '34px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5).setDepth(101);

    this.time.delayedCall(1400, () => {
      this.tweens.add({
        targets: [shade, title, subtitle], alpha: 0, duration: 350,
        onComplete: () => { shade.destroy(); title.destroy(); subtitle.destroy(); },
      });
    });
  }

  private t(key: MessageKey, values?: Record<string, string | number>): string {
    return translate(this.locale, key, values);
  }
}
