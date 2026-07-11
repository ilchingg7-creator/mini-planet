import { describe, expect, it } from 'vitest';
import { AudioManager, type AudioPort } from '../../../src/game/systems/AudioManager';

function createHarness() {
  const events: string[] = [];
  const port: AudioPort = {
    has: () => true,
    playMusic: (key) => ({ key, stop: () => events.push(`stop:${key}`) }),
    playEffect: (key) => events.push(`effect:${key}`),
    fadeOut: (sound, _duration, complete) => { events.push(`fade:${sound.key}`); sound.stop(); complete(); },
    pauseAll: () => events.push('pause'),
    resumeAll: () => events.push('resume'),
  };
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
  return { manager: new AudioManager(port, storage), events, values };
}

describe('AudioManager', () => {
  it('waits for unlock and avoids duplicate biome music', () => {
    const { manager, events } = createHarness();
    manager.setBiome('green');
    expect(events).toEqual([]);
    manager.unlock('green');
    manager.setBiome('green');
    expect(manager.currentMusicKey).toBe('music_green');
    expect(events).toEqual([]);
  });

  it('crossfades when the biome changes', () => {
    const { manager, events } = createHarness();
    manager.unlock('green');
    manager.setBiome('sea');
    expect(events).toEqual(['fade:music_green', 'stop:music_green']);
    expect(manager.currentMusicKey).toBe('music_sea');
  });

  it('persists mute and gates effects', () => {
    const { manager, events, values } = createHarness();
    manager.unlock('green');
    expect(manager.toggle()).toBe(false);
    manager.playEffect('sfx_merge');
    expect(values.get('mini-planet-audio-enabled-v1')).toBe('0');
    expect(events).toContain('stop:music_green');
    expect(events).not.toContain('effect:sfx_merge');
  });

  it('pauses and resumes playback', () => {
    const { manager, events } = createHarness();
    manager.pause();
    manager.resume();
    expect(events).toEqual(['pause', 'resume']);
  });
});
