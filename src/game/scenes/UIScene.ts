import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create(): void {
    this.add.text(32, 28, 'Монеты: 0', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#17442a',
    });
  }
}
