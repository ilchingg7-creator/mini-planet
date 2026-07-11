#!/usr/bin/env python3
"""Regenerate the 12 game audio WAV files with actual audio content.

This replaces the buggy PowerShell `scripts/generate-audio.ps1`. The original
PS script used scriptblocks with variables defined in the surrounding foreach
loop scope. PowerShell scriptblocks use dynamic scoping, so the variables were
NOT captured and resolved to $null inside Write-Wave, producing all-zero WAV
data with correct headers.

This Python generator produces the same kind of audio the PS script intended:
- 22050 Hz, 16-bit mono PCM
- Additive sine voices with biome-specific note sequences
- Short attack/release envelopes to avoid clicks
- Peak normalization capped at 0.75
- Music loops: 64 beats at biome-specific BPM, 45-60 seconds
- SFX: short sine sweeps with fade envelopes

Usage:
    python3 scripts/generate-audio.py [--output-dir public/assets/audio]
"""
from __future__ import annotations

import argparse
import math
import os
import struct
import wave
from typing import Callable

SAMPLE_RATE = 22050
NORMALIZATION_CEILING = 0.75  # cap peak after generation to leave headroom


# ---------------------------------------------------------------------------
# WAV writer
# ---------------------------------------------------------------------------

def write_wav(path: str, samples: list[float]) -> None:
    """Write 16-bit mono PCM WAV at SAMPLE_RATE.

    `samples` are floats in [-1, 1] (will be clamped). Peak is normalized to
    NORMALIZATION_CEILING before writing so the audio isn't accidentally quiet
    or clipping.
    """
    peak = max((abs(s) for s in samples), default=0.0)
    if peak > 0:
        scale = NORMALIZATION_CEILING / peak if peak > NORMALIZATION_CEILING else 1.0
    else:
        scale = 0.0

    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        # Clamping to [-1, 1] then scaling to int16 range.
        # Use 24575 (not 32767) to match the original PS script's intent and
        # leave comfortable headroom even after normalization.
        frames = bytearray()
        for s in samples:
            v = max(-1.0, min(1.0, s * scale))
            frames += struct.pack("<h", int(v * 24575))
        w.writeframes(bytes(frames))


# ---------------------------------------------------------------------------
# Sample generators (mirror the PowerShell scriptblock intent)
# ---------------------------------------------------------------------------

def generate_music(
    bpm: float,
    notes: list[float],
    duration: float,
) -> list[float]:
    """Generate a music loop: 64 beats at `bpm`, cycling through `notes`.

    Each beat: short attack (25 ms) + exponential decay envelope, layered with
    a sub-octave pad and a 2nd-harmonic triangle voice.
    """
    beat = 60.0 / bpm
    n_samples = int(SAMPLE_RATE * duration)
    samples: list[float] = []
    n_notes = len(notes)

    for i in range(n_samples):
        t = i / SAMPLE_RATE
        index = int(math.floor(t / beat)) % n_notes
        local = t % beat
        # Attack (25 ms linear) × decay (exp, relative to beat length)
        attack = min(1.0, local / 0.025)
        decay = math.exp(-2.8 * local / beat)
        envelope = attack * decay

        freq = notes[index]
        # Sub-octave pad (sine at freq/4, low amplitude)
        pad = 0.07 * math.sin(2 * math.pi * (freq / 4) * t)
        # Fundamental + 2nd harmonic
        tone = (
            0.22 * math.sin(2 * math.pi * freq * t)
            + 0.06 * math.sin(4 * math.pi * freq * t)
        )
        # Global fade-in/out at loop boundaries (20 ms)
        boundary = min(1.0, min(t, duration - t) / 0.02)
        sample = (pad + tone * envelope) * boundary
        samples.append(sample)

    return samples


def generate_sfx(
    frequency: float,
    duration: float,
) -> list[float]:
    """Generate a short SFX: upward sweep + bell-shaped amplitude envelope."""
    n_samples = int(SAMPLE_RATE * duration)
    samples: list[float] = []
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        sweep = frequency * (1 + 0.22 * t / duration)
        envelope = math.sin(math.pi * t / duration)  # bell envelope, 0 at ends
        sample = 0.38 * math.sin(2 * math.pi * sweep * t) * envelope
        samples.append(sample)
    return samples


# ---------------------------------------------------------------------------
# Track definitions (mirror the PowerShell $tracks / $effects tables)
# ---------------------------------------------------------------------------

TRACKS: dict[str, dict] = {
    "music_green": {
        "bpm": 84,
        "notes": [261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 293.66, 349.23],
    },
    "music_sweet": {
        "bpm": 92,
        "notes": [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880.00, 698.46],
    },
    "music_sea": {
        "bpm": 80,
        "notes": [220.00, 277.18, 329.63, 415.30, 329.63, 277.18, 246.94, 311.13],
    },
    "music_moon": {
        "bpm": 76,
        "notes": [196.00, 246.94, 293.66, 369.99, 440.00, 369.99, 293.66, 246.94],
    },
}

EFFECTS: dict[str, tuple[float, float]] = {
    "sfx_button":  (440.00, 0.10),
    "sfx_create":  (587.33, 0.24),
    "sfx_select":  (659.25, 0.12),
    "sfx_merge":   (783.99, 0.42),
    "sfx_coin":    (1046.50, 0.28),
    "sfx_invalid": (196.00, 0.22),
    "sfx_level":   (880.00, 0.65),
    "sfx_reward":  (987.77, 0.48),
}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output-dir",
        default="public/assets/audio",
        help="Output directory (default: public/assets/audio)",
    )
    parser.add_argument(
        "--repo-root",
        default="/home/z/my-project/mini-planet",
        help="Repo root (default: /home/z/my-project/mini-planet)",
    )
    args = parser.parse_args()

    out_dir = args.output_dir
    if not os.path.isabs(out_dir):
        out_dir = os.path.join(args.repo_root, out_dir)
    os.makedirs(out_dir, exist_ok=True)

    print(f"Generating audio into: {out_dir}")
    print(f"Sample rate: {SAMPLE_RATE} Hz, 16-bit mono PCM")
    print(f"Normalization ceiling: {NORMALIZATION_CEILING}")
    print()

    # Music tracks
    print("Music tracks:")
    for name, spec in TRACKS.items():
        bpm = spec["bpm"]
        notes = spec["notes"]
        beat = 60.0 / bpm
        duration = beat * 64  # 64 beats = 8 bars of 8 notes
        samples = generate_music(bpm, notes, duration)
        path = os.path.join(out_dir, f"{name}.wav")
        write_wav(path, samples)
        peak = max(abs(s) for s in samples)
        print(
            f"  {name:<14} bpm={bpm:>3}  duration={duration:>6.2f}s  "
            f"samples={len(samples):>7}  pre-norm-peak={peak:.4f}  -> {path}"
        )

    print()
    print("SFX:")
    for name, (freq, duration) in EFFECTS.items():
        samples = generate_sfx(freq, duration)
        path = os.path.join(out_dir, f"{name}.wav")
        write_wav(path, samples)
        peak = max(abs(s) for s in samples)
        print(
            f"  {name:<14} freq={freq:>7.2f}Hz  duration={duration:>5.2f}s  "
            f"samples={len(samples):>6}  pre-norm-peak={peak:.4f}  -> {path}"
        )

    print()
    print(f"Done. {len(TRACKS) + len(EFFECTS)} files written.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
