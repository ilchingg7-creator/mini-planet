import Phaser from 'phaser';
import { BIOMES, getItemById } from '../data/biomes';
import { createBaseItem, selectSlot } from '../systems/merge';
import { createDefaultSave, loadSave, writeSave } from '../systems/save';
import type { MiniPlanetSaveData } from '../systems/types';

const SLOT_POSITIONS = [
  { x: 150, y: 1040 },
  { x: 270, y: 1040 },
  { x: 390, y: 1040 },
  { x: 510, y: 1040 },
  { x: 210, y: 1160 },
  { x: 330, y: 1160 },
];

const DECOR_POSITIONS = [
  { x: 290, y: 450 },
  { x: 405, y: 440 },
  { x: 250, y: 535 },
  { x: 470, y: 535 },
  { x: 360, y: 390 },
  { x: 355, y: 600 },
  { x: 295, y: 600 },
  { x: 430, y: 600 },
];

export class GameScene extends Phaser.Scene {
  private save: MiniPlanetSaveData = createDefaultSave(Date.now());
  private slotSprites: Phaser.GameObjects.Container[] = [];
  private planet?: Phaser.GameObjects.Image;
  private decorSprites: Phaser.GameObjects.Image[] = [];

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.save = loadSave(window.localStorage, Date.now());

    this.add.image(360, 640, 'background_day').setDisplaySize(720, 1280);
    this.planet = this.add.image(360, 510, 'planet_green').setDisplaySize(360, 360);
    this.tweens.add({
      targets: this.planet,
      y: 525,
      duration: 1700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });

    this.drawDecorations();
    this.drawSlots();
    this.events.emit('save-changed', this.save);
  }

  createBaseItem(): void {
    const baseItemId = BIOMES[0].items[0].id;
    this.save = {
      ...this.save,
      merge: createBaseItem(this.save.merge, baseItemId),
    };
    this.persistAndRedraw();
  }

  selectSlot(slotIndex: number): void {
    const slot = this.save.merge.slots[slotIndex];
    const item = slot.itemId ? getItemById(slot.itemId) : undefined;
    const biome = item ? BIOMES.find((candidate) => candidate.id === item.biomeId) : undefined;
    const nextItem = item ? biome?.items[item.tier + 1] : undefined;
    const nextMerge = selectSlot(this.save.merge, slotIndex, nextItem?.id);
    const discovered = nextMerge.lastDiscoveryItemId;
    const discoveredItemIds =
      discovered && !this.save.discoveredItemIds.includes(discovered)
        ? [...this.save.discoveredItemIds, discovered]
        : this.save.discoveredItemIds;

    this.save = {
      ...this.save,
      merge: { ...nextMerge, lastDiscoveryItemId: undefined },
      discoveredItemIds,
    };

    this.persistAndRedraw();
  }

  private persistAndRedraw(): void {
    writeSave(window.localStorage, this.save);
    this.drawSlots();
    this.drawDecorations();
    this.events.emit('save-changed', this.save);
  }

  private drawSlots(): void {
    this.slotSprites.forEach((slot) => slot.destroy());
    this.slotSprites = [];

    this.save.merge.slots.forEach((slot) => {
      const position = SLOT_POSITIONS[slot.index];
      const container = this.add.container(position.x, position.y);
      const bg = this.add
        .rectangle(0, 0, 100, 100, 0xffffff, 0.9)
        .setStrokeStyle(4, this.save.merge.selectedSlotIndex === slot.index ? 0xffcc33 : 0x6bbf59);
      container.add(bg);

      if (slot.itemId) {
        const item = getItemById(slot.itemId);
        if (item && this.textures.exists(item.iconKey)) {
          container.add(this.add.image(0, -4, item.iconKey).setDisplaySize(72, 72));
        } else {
          container.add(
            this.add
              .text(0, -4, item?.title.slice(0, 2) ?? '?', {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#17442a',
              })
              .setOrigin(0.5),
          );
        }
      }

      container.setSize(100, 100);
      container.setInteractive(new Phaser.Geom.Rectangle(-50, -50, 100, 100), Phaser.Geom.Rectangle.Contains);
      container.on('pointerdown', () => this.selectSlot(slot.index));
      this.slotSprites.push(container);
    });
  }

  private drawDecorations(): void {
    this.decorSprites.forEach((decor) => decor.destroy());
    this.decorSprites = [];

    this.save.discoveredItemIds.slice(0, DECOR_POSITIONS.length).forEach((itemId, index) => {
      const item = getItemById(itemId);
      const position = DECOR_POSITIONS[index];

      if (!item || !position || !this.textures.exists(item.decorKey)) {
        return;
      }

      const decor = this.add.image(position.x, position.y, item.decorKey).setDisplaySize(72, 72);
      this.decorSprites.push(decor);
      this.tweens.add({
        targets: decor,
        scale: { from: 0, to: decor.scale },
        duration: 220,
        ease: 'Back.out',
      });
    });
  }
}
