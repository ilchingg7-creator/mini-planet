import { getItemById } from './biomes';
import type { GameSlot, ItemDefinition } from '../systems/types';

const GREEN_DECOR_SIZES: Record<string, number> = {
  green_sprout: 36,
  green_flower: 44,
  green_mushroom: 50,
  green_tree: 88,
  green_house: 98,
  green_pond: 92,
  green_mill: 104,
  green_rainbow: 92,
  green_garden_bench: 72,
  green_bird_house: 64,
  green_sun_tower: 110,
  green_rainbow_palace: 124,
};

const DECOR_ANCHORS = [
  { x: 230, y: 350 },
  { x: 355, y: 340 },
  { x: 175, y: 445 },
  { x: 435, y: 450 },
  { x: 300, y: 315 },
  { x: 320, y: 545 },
  { x: 205, y: 570 },
  { x: 420, y: 575 },
  { x: 155, y: 510 },
  { x: 470, y: 380 },
  { x: 270, y: 625 },
  { x: 370, y: 610 },
];

export interface PlanetDecorPlacement {
  x: number;
  y: number;
  size: number;
}

export interface InventoryDecorItem {
  item: ItemDefinition;
  slotIndex: number;
}

export function getInventoryDecorItems(slots: GameSlot[]): InventoryDecorItem[] {
  return slots.flatMap((slot) => {
    const item = slot.itemId ? getItemById(slot.itemId) : undefined;
    return item ? [{ item, slotIndex: slot.index }] : [];
  });
}

export function getPlanetDecorPlacement(
  item: ItemDefinition,
  discoveryIndex: number,
): PlanetDecorPlacement {
  const anchor = DECOR_ANCHORS[discoveryIndex % DECOR_ANCHORS.length];
  const hash = hashString(item.id);
  const jitterX = (hash % 21) - 10;
  const jitterY = ((hash >>> 5) % 15) - 7;

  return {
    x: anchor.x + jitterX,
    y: anchor.y + jitterY,
    size: GREEN_DECOR_SIZES[item.id] ?? Math.min(108, 44 + item.tier * 6),
  };
}

function hashString(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}
