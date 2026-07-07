import Phaser from 'phaser';
import { BIOMES, getBiomeById, getItemById } from '../data/biomes';
import { BOARD_SLOT_COUNT, SLOT_POSITIONS } from '../data/layout';
import { createBaseItem, selectSlot } from '../systems/merge';
import { advanceBiomeIfComplete } from '../systems/progression';
import { createDefaultSave, loadSave, writeSave } from '../systems/save';
import type { MiniPlanetSaveData } from '../systems/types';

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
  private background?: Phaser.GameObjects.Image;
  private decorSprites: Phaser.GameObjects.Image[] = [];

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.save = loadSave(window.localStorage, Date.now());

    const biome = this.getCurrentBiome();
    this.background = this.add.image(360, 640, biome.backgroundAssetKey).setDisplaySize(720, 1280);
    this.planet = this.add.image(360, 510, biome.planetAssetKey).setDisplaySize(360, 360);
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
    const baseItemId = this.getCurrentBiome().items[0].id;
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
    this.save = advanceBiomeIfComplete(this.save, BIOMES, BOARD_SLOT_COUNT);

    this.persistAndRedraw();
  }

  private persistAndRedraw(): void {
    writeSave(window.localStorage, this.save);
    this.drawBiome();
    this.drawSlots();
    this.drawDecorations();
    this.events.emit('save-changed', this.save);
  }

  private getCurrentBiome() {
    return getBiomeById(this.save.economy.currentBiomeId) ?? BIOMES[0];
  }

  private drawBiome(): void {
    const biome = this.getCurrentBiome();

    this.background?.setTexture(biome.backgroundAssetKey);
    this.planet?.setTexture(biome.planetAssetKey);
  }

  private drawSlots(): void {
    this.slotSprites.forEach((slot) => slot.destroy());
    this.slotSprites = [];

    this.save.merge.slots.forEach((slot) => {
      const position = SLOT_POSITIONS[slot.index];
      const container = this.add.container(position.x, position.y);
      const bg = this.add
        .rectangle(0, 0, 92, 92, 0xffffff, 0.9)
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

      container.setSize(92, 92);
      container.setInteractive(new Phaser.Geom.Rectangle(-46, -46, 92, 92), Phaser.Geom.Rectangle.Contains);
      container.on('pointerdown', () => this.selectSlot(slot.index));
      this.slotSprites.push(container);
    });
  }

  private drawDecorations(): void {
    this.decorSprites.forEach((decor) => decor.destroy());
    this.decorSprites = [];

    const currentBiomeId = this.save.economy.currentBiomeId;
    this.save.discoveredItemIds
      .filter((itemId) => getItemById(itemId)?.biomeId === currentBiomeId)
      .slice(0, DECOR_POSITIONS.length)
      .forEach((itemId, index) => {
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
