/**
 * keypad.ts
 * The 6 finger buttons. In 2-player mode the pick is hidden ("Locked ✓")
 * so the friend across the bench can't peek.
 */
import { html, $ } from './dom';
import { handSvg } from './hand';
import { play, buzz } from '../audio/sound';

export interface Keypad {
  el: HTMLElement;
  setEnabled(on: boolean): void;
  reset(): void;
  setLabel(text: string): void;
  /** Handle a keyboard key; returns true if consumed. */
  key(k: string): boolean;
}

export function createKeypad(opts: {
  label: string;
  sleeve: string;
  hidden: boolean;
  keys: string[]; // 6 keyboard keys
  flipped?: boolean;
  onPick: (n: number) => void;
}): Keypad {
  const el = html(`
    <div class="keypad ${opts.flipped ? 'flipped' : ''}">
      <div class="keypad-label"></div>
      <div class="keypad-grid">
        ${[1, 2, 3, 4, 5, 6]
          .map(
            (n, i) => `
          <button class="num-btn" data-n="${n}" aria-label="Show ${n}">
            <span class="num">${n}</span>
            <span class="mini-hand">${handSvg(n, opts.sleeve)}</span>
            <span class="key-hint">${opts.keys[i].toUpperCase()}</span>
          </button>`,
          )
          .join('')}
      </div>
      <div class="keypad-lock"><span>🔒 Locked in!</span><small>Waiting for the other hand…</small></div>
    </div>`);

  let enabled = true;
  let picked = false;
  const label = $(el, '.keypad-label');
  label.textContent = opts.label;

  const choose = (n: number): void => {
    if (!enabled || picked) return;
    picked = true;
    play('tap');
    buzz(15);
    const btn = el.querySelector(`[data-n="${n}"]`);
    btn?.classList.add('chosen');
    if (opts.hidden) el.classList.add('locked');
    opts.onPick(n);
  };

  el.querySelectorAll<HTMLButtonElement>('.num-btn').forEach((b) => {
    b.addEventListener('click', () => choose(Number(b.dataset.n)));
  });

  return {
    el,
    setEnabled(on) {
      enabled = on;
      el.classList.toggle('disabled', !on);
    },
    reset() {
      picked = false;
      el.classList.remove('locked');
      el.querySelectorAll('.chosen').forEach((b) => b.classList.remove('chosen'));
    },
    setLabel(text) {
      label.textContent = text;
    },
    key(k) {
      const i = opts.keys.indexOf(k.toLowerCase());
      if (i < 0) return false;
      choose(i + 1);
      return true;
    },
  };
}

export const P1_KEYS = ['1', '2', '3', '4', '5', '6'];
export const P2_KEYS = ['z', 'x', 'c', 'v', 'b', 'n'];
