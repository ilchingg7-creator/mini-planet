import Phaser from 'phaser';
import { createYandexBridge } from '../systems/yandex';
import { resolveLocale } from '../i18n';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  async create(): Promise<void> {
    this.input.setGlobalTopOnly(false);
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
