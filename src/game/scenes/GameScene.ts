import Phaser from 'phaser';
import { BIOMES, getBiomeById, getItemById } from '../data/biomes';
import { BOARD_SLOT_COUNT, SLOT_POSITIONS } from '../data/layout';
import {
  getInventoryDecorItems,
  getPlanetDecorPlacement,
} from '../data/planetDecor';
import { createBaseItem, selectSlot } from '../systems/merge';
import {
  activateMergeRewardBoost,
  awardMergeCoins,
} from '../systems/economy';
import {
  getHighestReachedTier,
  pickCreateItem,
} from '../systems/generator';
import { advanceBiomeIfComplete } from '../systems/progression';
import { createDefaultSave, loadSave, writeSave } from '../systems/save';
import type { MiniPlanetSaveData } from '../systems/types';
import { AudioManager, PhaserAudioPort } from '../systems/AudioManager';

export class GameScene extends Phaser.Scene {
  private save: MiniPlanetSaveData = createDefaultSave(Date.now());
  private slotSprites: Phaser.GameObjects.Container[] = [];
  private planet?: Phaser.GameObjects.Image;
  private background?: Phaser.GameObjects.Image;
  private planetMask?: Phaser.GameObjects.Graphics;
  private decorSprites: Phaser.GameObjects.Image[] = [];

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.save = loadSave(window.localStorage, Date.now());
    const audio = new AudioManager(new PhaserAudioPort(this), window.localStorage);
    this.registry.set('audioManager', audio);
    const onVisibilityChange = () => document.hidden ? audio.pause() : audio.resume();
    document.addEventListener('visibilitychange', onVisibilityChange);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      audio.destroy();
    });

    const biome = this.getCurrentBiome();
    this.cameras.main.setBackgroundColor('#2bbaf3');
    this.background = this.add.image(360, 640, biome.backgroundAssetKey).setDisplaySize(800, 1420);
    this.drawPlanetShadow();
    this.drawTray();

    this.planet = this.add.image(315, 500, biome.planetAssetKey).setDisplaySize(610, 610);
    this.planetMask = this.add.graphics();
    this.planetMask.fillStyle(0xffffff);
    this.planetMask.fillCircle(315, 500, 282);
    this.planet.setMask(this.planetMask.createGeometryMask());
    this.planetMask.setVisible(false);

    this.drawDecorations();
    this.drawSlots();
    this.events.emit('save-changed', this.save);
  }

  getSaveData(): MiniPlanetSaveData {
    return this.save;
  }

  activateMergeBoost(durationMs: number): void {
    this.save = {
      ...this.save,
      economy: activateMergeRewardBoost(this.save.economy, Date.now(), durationMs),
    };
    writeSave(window.localStorage, this.save);
    this.events.emit('save-changed', this.save);
  }

  createBaseItem(): boolean {
    const audio = this.getAudio();
    audio?.unlock(this.save.economy.currentBiomeId);
    const biome = this.getCurrentBiome();
    const highestReachedTier = getHighestReachedTier(biome, this.save.discoveredItemIds);
    const generatedItem = pickCreateItem(biome, highestReachedTier);
    const previousSlots = this.save.merge.slots;
    const nextMerge = createBaseItem(this.save.merge, generatedItem.id);
    const created = nextMerge !== this.save.merge;

    if (!created) {
      audio?.playEffect('sfx_invalid');
      return false;
    }

    this.save = {
      ...this.save,
      merge: nextMerge,
    };
    this.persistAndRedraw();

    const createdIndex = this.save.merge.slots.findIndex(
      (slot, index) => slot.itemId !== previousSlots[index]?.itemId,
    );
    this.pulseSlot(createdIndex);
    audio?.playEffect('sfx_create');
    return true;
  }

  selectSlot(slotIndex: number): void {
    const audio = this.getAudio();
    audio?.unlock(this.save.economy.currentBiomeId);
    const previousLevel = this.save.economy.planetLevel;
    const slot = this.save.merge.slots[slotIndex];
    const item = slot.itemId ? getItemById(slot.itemId) : undefined;
    const biome = item ? BIOMES.find((candidate) => candidate.id === item.biomeId) : undefined;
    const nextItem = item ? biome?.items[item.tier + 1] : undefined;
    const nextMerge = selectSlot(this.save.merge, slotIndex, nextItem?.id);
    const mergedItemId = nextMerge.lastDiscoveryItemId;
    const discoveredItemIds =
      mergedItemId && !this.save.discoveredItemIds.includes(mergedItemId)
        ? [...this.save.discoveredItemIds, mergedItemId]
        : this.save.discoveredItemIds;
    const mergeReward = mergedItemId ? (getItemById(mergedItemId)?.baseIncome ?? 0) : 0;

    this.save = {
      ...this.save,
      economy: awardMergeCoins(this.save.economy, mergeReward, Date.now()),
      merge: { ...nextMerge, lastDiscoveryItemId: undefined },
      discoveredItemIds,
    };
    this.save = advanceBiomeIfComplete(this.save, BIOMES, BOARD_SLOT_COUNT);
    audio?.setBiome(this.save.economy.currentBiomeId);

    this.persistAndRedraw();
    if (this.save.economy.planetLevel > previousLevel) {
      audio?.playEffect('sfx_level');
      this.events.emit('level-advanced', this.save.economy.planetLevel);
    }
    if (mergedItemId) {
      audio?.playEffect('sfx_merge');
      audio?.playEffect('sfx_coin');
      this.events.emit('item-merged');
    } else if (slot.itemId) {
      audio?.playEffect('sfx_select');
    }
  }

  private getAudio(): AudioManager | undefined {
    return this.registry.get('audioManager') as AudioManager | undefined;
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

    if (this.background && this.textures.exists(biome.backgroundAssetKey)) {
      this.background.setTexture(biome.backgroundAssetKey);
    }

    if (this.planet && this.textures.exists(biome.planetAssetKey)) {
      this.planet.setTexture(biome.planetAssetKey);
    }
  }

  private drawPlanetShadow(): void {
    const shadow = this.add.graphics();
    shadow.fillStyle(0x087ab3, 0.24);
    shadow.fillEllipse(315, 790, 430, 62);
  }

  private drawTray(): void {
    const tray = this.add.graphics();
    tray.fillStyle(0x0875a8, 0.2);
    tray.fillRoundedRect(35, 966, 650, 250, 34);
    tray.fillStyle(0xfffbef, 0.98);
    tray.fillRoundedRect(28, 956, 650, 250, 34);
    tray.lineStyle(5, 0xffffff, 0.9);
    tray.strokeRoundedRect(28, 956, 650, 250, 34);
  }

  private drawSlots(): void {
    this.slotSprites.forEach((slot) => slot.destroy());
    this.slotSprites = [];

    this.save.merge.slots.forEach((slot) => {
      const position = SLOT_POSITIONS[slot.index];
      const container = this.add.container(position.x, position.y);
      const selected = this.save.merge.selectedSlotIndex === slot.index;
      const frame = this.add.graphics();
      frame.fillStyle(selected ? 0xfff1a8 : 0xfff9e9, 1);
      frame.fillRoundedRect(-43, -43, 86, 86, 17);
      frame.lineStyle(selected ? 5 : 3, selected ? 0xffb900 : 0xe9dcc1, 1);
      frame.strokeRoundedRect(-43, -43, 86, 86, 17);
      container.add(frame);

      if (slot.itemId) {
        const item = getItemById(slot.itemId);
        if (item && this.textures.exists(item.iconKey)) {
          container.add(this.add.image(0, -3, item.iconKey).setDisplaySize(72, 72));

          const badge = this.add.graphics();
          badge.fillStyle(0x72cb21, 1);
          badge.fillCircle(33, 33, 14);
          badge.lineStyle(2, 0xffffff, 1);
          badge.strokeCircle(33, 33, 14);
          container.add(badge);
          container.add(
            this.add
              .text(33, 33, String(item.tier + 1), {
                fontFamily: 'Arial',
                fontSize: '15px',
                fontStyle: 'bold',
                color: '#ffffff',
              })
              .setOrigin(0.5),
          );
        }
      }

      container.setSize(90, 90);
      container.setInteractive(new Phaser.Geom.Rectangle(-45, -45, 90, 90), Phaser.Geom.Rectangle.Contains);
      container.on('pointerdown', () => this.selectSlot(slot.index));
      this.slotSprites.push(container);
    });
  }

  private drawDecorations(): void {
    this.decorSprites.forEach((decor) => decor.destroy());
    this.decorSprites = [];

    getInventoryDecorItems(this.save.merge.slots).forEach(({ item, slotIndex }) => {
      if (!this.textures.exists(item.decorKey)) {
        return;
      }

      const placement = getPlanetDecorPlacement(item, slotIndex);
      const decor = this.add
        .image(placement.x, placement.y, item.decorKey)
        .setDisplaySize(placement.size, placement.size)
        .setDepth(1 + placement.y / 1000);
      this.decorSprites.push(decor);
      this.tweens.add({
        targets: decor,
        scale: { from: 0, to: decor.scale },
        duration: 260,
        ease: 'Back.out',
      });
    });
  }

  private pulseSlot(index: number): void {
    const slot = this.slotSprites[index];
    if (!slot) {
      return;
    }

    this.tweens.add({
      targets: slot,
      scale: { from: 0.78, to: 1 },
      duration: 220,
      ease: 'Back.out',
    });
  }
}
