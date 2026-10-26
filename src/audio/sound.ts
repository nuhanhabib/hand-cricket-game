/**
 * sound.ts
 * Tiny Web Audio synthesizer (no audio files) + vibration.
 */
import { settings } from '../core/storage';

export type Sfx = 'tap' | 'shake' | 'bat' | 'boundary' | 'out' | 'win' | 'lose' | 'whistle';

let ctx: AudioContext | null = null;
let noiseBuf: AudioBuffer | null = null;

function ac(): AudioContext | null {
  try {
    if (!ctx) {
      const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

function noise(c: AudioContext): AudioBuffer {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

function tone(c: AudioContext, freq: number, endFreq: number, t: number, dur: number, vol: number, type: OscillatorType = 'sine'): void {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function burst(c: AudioContext, t: number, dur: number, vol: number, freq: number, q = 1, attack = 0.005): void {
  const s = c.createBufferSource();
  s.buffer = noise(c);
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(c.destination);
  s.start(t, Math.random());
  s.stop(t + dur + 0.05);
}

export function play(sfx: Sfx): void {
  if (!settings.sound) return;
  const c = ac();
  if (!c) return;
  const t = c.currentTime + 0.01;
  switch (sfx) {
    case 'tap':
      tone(c, 900, 500, t, 0.06, 0.15, 'triangle');
      break;
    case 'shake':
      burst(c, t, 0.09, 0.25, 1800, 0.8);
      tone(c, 240, 140, t, 0.08, 0.2);
      break;
    case 'bat': // willow "thock"
      burst(c, t, 0.06, 0.6, 2400, 2);
      tone(c, 320, 120, t, 0.14, 0.5);
      break;
    case 'boundary':
      burst(c, t, 0.06, 0.6, 2400, 2);
      tone(c, 320, 120, t, 0.14, 0.5);
      burst(c, t + 0.1, 1.6, 0.35, 1200, 0.5, 0.35); // crowd roar
      [523, 659, 784, 1047].forEach((f, i) => tone(c, f, f, t + 0.15 + i * 0.08, 0.18, 0.12, 'square'));
      break;
    case 'out': // stumps clatter + sad slide
      burst(c, t, 0.05, 0.6, 3200, 3);
      burst(c, t + 0.06, 0.05, 0.45, 2600, 3);
      burst(c, t + 0.13, 0.05, 0.3, 2900, 3);
      tone(c, 440, 110, t + 0.15, 0.6, 0.18, 'sawtooth');
      break;
    case 'win':
      [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(c, f, f, t + i * 0.12, 0.22, 0.14, 'square'));
      burst(c, t, 2.0, 0.25, 1200, 0.5, 0.4);
      break;
    case 'lose':
      [392, 349, 311, 262].forEach((f, i) => tone(c, f, f * 0.98, t + i * 0.2, 0.3, 0.14, 'triangle'));
      break;
    case 'whistle':
      tone(c, 2100, 2300, t, 0.25, 0.12, 'sine');
      tone(c, 2100, 2300, t + 0.3, 0.45, 0.12, 'sine');
      break;
  }
}

export function buzz(pattern: number | number[]): void {
  if (!settings.vibration) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}
