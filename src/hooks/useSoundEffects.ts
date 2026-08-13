/**
 * useSoundEffects — Synthesized courtroom sound effects via WebAudio.
 * No audio assets required; every cue is generated procedurally.
 * Persisted enable/disable toggle (localStorage: judgebench.soundFx).
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type SoundEffect = 'gavel' | 'objection' | 'verdict' | 'evidence' | 'phase';

const STORAGE_KEY = 'judgebench.soundFx';

function createContext(): AudioContext | null {
  try {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    return Ctor ? new Ctor() : null;
  } catch {
    return null;
  }
}

/** Sharp wooden knock: filtered noise burst + low thump. */
function playGavel(ctx: AudioContext, when = 0, gainScale = 1) {
  const t = ctx.currentTime + when;

  // Low thump
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(180, t);
  osc.frequency.exponentialRampToValueAtTime(50, t + 0.12);
  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(0.9 * gainScale, t);
  oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
  osc.connect(oscGain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.2);

  // Woody crack (bandpassed noise)
  const dur = 0.09;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 2;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1900;
  bp.Q.value = 1.2;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.55 * gainScale, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  noise.connect(bp).connect(noiseGain).connect(ctx.destination);
  noise.start(t);
}

/** Two-note dramatic sting for objections. */
function playObjection(ctx: AudioContext) {
  const t = ctx.currentTime;
  [[440, 0], [311, 0.09]].forEach(([freq, offset]) => {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t + offset);
    g.gain.exponentialRampToValueAtTime(0.28, t + offset + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.35);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2200;
    osc.connect(lp).connect(g).connect(ctx.destination);
    osc.start(t + offset);
    osc.stop(t + offset + 0.4);
  });
}

/** Rising brass-ish fanfare arpeggio for verdicts. */
function playVerdict(ctx: AudioContext) {
  const t = ctx.currentTime;
  const notes = [261.63, 329.63, 392.0, 523.25]; // C E G C
  notes.forEach((freq, i) => {
    const start = t + i * 0.14;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(0.22, start + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, start + (i === notes.length - 1 ? 0.9 : 0.3));
    osc.connect(g).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 1);
  });
  // Final gavel accompanies last note
  playGavel(ctx, notes.length * 0.14 + 0.05, 0.8);
}

/** Soft paper/chime cue when evidence is presented. */
function playEvidence(ctx: AudioContext) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, t);
  osc.frequency.exponentialRampToValueAtTime(1320, t + 0.1);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.15, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
  osc.connect(g).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.5);
}

/** Subtle low woodblock tick for phase changes. */
function playPhase(ctx: AudioContext) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(520, t);
  osc.frequency.exponentialRampToValueAtTime(260, t + 0.07);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.12, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1500;
  osc.connect(lp).connect(g).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.12);
}

export function useSoundEffects() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== 'off';
    } catch {
      return true;
    }
  });
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
    } catch {}
  }, [enabled]);

  const play = useCallback(
    (effect: SoundEffect) => {
      if (!enabled) return;
      if (!ctxRef.current) {
        ctxRef.current = createContext();
      }
      const ctx = ctxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }
      try {
        switch (effect) {
          case 'gavel': playGavel(ctx); break;
          case 'objection': playObjection(ctx); break;
          case 'verdict': playVerdict(ctx); break;
          case 'evidence': playEvidence(ctx); break;
          case 'phase': playPhase(ctx); break;
        }
      } catch {}
    },
    [enabled]
  );

  const toggle = useCallback(() => setEnabled(prev => !prev), []);

  return { enabled, toggle, play };
}

export type SoundEffectsApi = ReturnType<typeof useSoundEffects>;
