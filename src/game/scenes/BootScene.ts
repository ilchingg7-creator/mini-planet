import Phaser from 'phaser';
import { createYandexBridge } from '../systems/yandex';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  async create(): Promise<void> {
    this.input.setGlobalTopOnly(false);
    const bridge = await createYandexBridge();
    await bridge.ready();
    this.registry.set('yandexBridge', bridge);
    this.scene.start('PreloadScene');
  }
}
