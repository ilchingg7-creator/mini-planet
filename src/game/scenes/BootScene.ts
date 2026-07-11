import Phaser from 'phaser';
import { createYandexBridge } from '../systems/yandex';
import { resolveLocale } from '../i18n';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  async create(): Promise<void> {
    this.input.setGlobalTopOnly(false);

    // Show a "Loading…" label immediately so the user never sees a blank
    // blue screen while BootScene awaits createYandexBridge (which can take
    // up to 8s on slow Yandex CDN connections — see loadYandexSdk timeout).
    const loadingText = this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2,
        'Loading…',
        {
          fontFamily: 'Arial Black, Arial',
          fontSize: '42px',
          color: '#ffffff',
          stroke: '#168bc9',
          strokeThickness: 8,
        },
      )
      .setOrigin(0.5);

    // Gentle pulse so the user knows the page is alive (not crashed).
    this.tweens.add({
      targets: loadingText,
      alpha: { from: 0.4, to: 1 },
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    const bridge = await createYandexBridge();
    const locale = resolveLocale(
      bridge.locale,
      navigator.languages?.length ? navigator.languages : [navigator.language],
    );
    document.documentElement.lang = locale;
    this.registry.set('locale', locale);
    this.registry.set('yandexBridge', bridge);
    this.scene.start('PreloadScene');
  }
}
