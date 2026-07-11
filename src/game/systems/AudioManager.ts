import Phaser from 'phaser';
import {
  getBiomeMusicKey,
  readAudioEnabled,
  writeAudioEnabled,
  type MusicKey,
} from './audioState';

export type EffectKey =
  | 'sfx_button' | 'sfx_create' | 'sfx_select' | 'sfx_merge'
  | 'sfx_coin' | 'sfx_invalid' | 'sfx_level' | 'sfx_reward';

export interface MusicHandle {
  key: MusicKey;
  stop(): void;
}

export interface AudioPort {
  has(key: string): boolean;
  playMusic(key: MusicKey): MusicHandle;
  playEffect(key: EffectKey): void;
  fadeOut(sound: MusicHandle, duration: number, complete: () => void): void;
  pauseAll(): void;
  resumeAll(): void;
}

interface AudioStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): unknown;
}

export class AudioManager {
  private enabled: boolean;
  private unlocked = false;
  private activeMusic?: MusicHandle;
  private biomeId = 'green';

  constructor(private readonly port: AudioPort, private readonly storage: AudioStorage) {
    this.enabled = readAudioEnabled(storage);
  }

  get currentMusicKey(): MusicKey | undefined { return this.activeMusic?.key; }
  isEnabled(): boolean { return this.enabled; }

  unlock(biomeId: string): void {
    this.unlocked = true;
    this.biomeId = biomeId;
    this.startBiomeMusic();
  }

  setBiome(biomeId: string): void {
    this.biomeId = biomeId;
    this.startBiomeMusic();
  }

  playEffect(key: EffectKey): void {
    if (this.enabled && this.unlocked && this.port.has(key)) this.port.playEffect(key);
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    writeAudioEnabled(this.storage, this.enabled);
    if (this.enabled) this.startBiomeMusic();
    else this.stopMusic();
    return this.enabled;
  }

  pause(): void { this.port.pauseAll(); }
  resume(): void { if (this.enabled) this.port.resumeAll(); }
  destroy(): void { this.stopMusic(); }

  private startBiomeMusic(): void {
    if (!this.enabled || !this.unlocked) return;
    const key = getBiomeMusicKey(this.biomeId);
    if (!key || !this.port.has(key) || this.activeMusic?.key === key) return;
    const previous = this.activeMusic;
    this.activeMusic = this.port.playMusic(key);
    if (previous) this.port.fadeOut(previous, 600, () => undefined);
  }

  private stopMusic(): void {
    this.activeMusic?.stop();
    this.activeMusic = undefined;
  }
}

export class PhaserAudioPort implements AudioPort {
  constructor(private readonly scene: Phaser.Scene) {}
  has(key: string): boolean { return this.scene.cache.audio.exists(key); }
  playMusic(key: MusicKey): MusicHandle {
    const sound = this.scene.sound.add(key, { loop: true, volume: 0.32 });
    sound.play();
    return { key, stop: () => sound.stop() };
  }
  playEffect(key: EffectKey): void { this.scene.sound.play(key, { volume: 0.55 }); }
  fadeOut(sound: MusicHandle, duration: number, complete: () => void): void {
    this.scene.time.delayedCall(duration, () => { sound.stop(); complete(); });
  }
  pauseAll(): void { this.scene.sound.pauseAll(); }
  resumeAll(): void { this.scene.sound.resumeAll(); }
}
