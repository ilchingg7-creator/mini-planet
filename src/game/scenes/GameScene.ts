import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create(): void {
    this.add.rectangle(360, 640, 720, 1280, 0xaee8ff);
    this.add.circle(360, 520, 170, 0x7bdc6f);
    this.add
      .text(360, 520, 'Mini Planet', {
        fontFamily: 'Arial',
        fontSize: '42px',
        color: '#17442a',
      })
      .setOrigin(0.5);
  }
}
