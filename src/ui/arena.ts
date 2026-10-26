/**
 * arena.ts
 * The two hands facing off: "shake, shake, shake… SHOW!"
 */
import { html, $, esc, wait } from './dom';
import { handSvg } from './hand';
import { play } from '../audio/sound';

export interface Arena {
  el: HTMLElement;
  /** Fist-shake countdown, then reveal both numbers. */
  showdown(left: number, right: number): Promise<void>;
  setNames(left: string, right: string): void;
  setTags(left: string, right: string): void;
  pop(text: string, cls?: string): void;
  idle(): void;
}

export function createArena(names: [string, string], tags: [string, string] = ['', '']): Arena {
  const el = html(`
    <section class="arena">
      <div class="hand-slot left">
        <div class="hand-name"><b></b><em class="tag"></em></div>
        <div class="hand">${handSvg(0, 'var(--p1)')}</div>
        <div class="hand-num"></div>
      </div>
      <div class="arena-mid"><div class="vs">VS</div><div class="pop"></div></div>
      <div class="hand-slot right">
        <div class="hand-name"><b></b><em class="tag"></em></div>
        <div class="hand mirrored">${handSvg(0, 'var(--p2)')}</div>
        <div class="hand-num"></div>
      </div>
    </section>`);

  const slots = [$(el, '.hand-slot.left'), $(el, '.hand-slot.right')];
  const sleeves = ['var(--p1)', 'var(--p2)'];
  const popEl = $(el, '.pop');

  const setHand = (i: number, n: number): void => {
    $(slots[i], '.hand').innerHTML = handSvg(n, sleeves[i]);
    const num = $(slots[i], '.hand-num');
    num.textContent = n ? String(n) : '';
    num.classList.toggle('show', n > 0);
  };

  const api: Arena = {
    el,
    setNames(l, r) {
      $(slots[0], '.hand-name b').innerHTML = esc(l);
      $(slots[1], '.hand-name b').innerHTML = esc(r);
    },
    setTags(l, r) {
      $(slots[0], '.tag').textContent = l;
      $(slots[1], '.tag').textContent = r;
    },
    idle() {
      setHand(0, 0);
      setHand(1, 0);
      el.classList.remove('revealed');
    },
    async showdown(left, right) {
      api.idle();
      popEl.className = 'pop';
      el.classList.add('shaking');
      for (let i = 0; i < 3; i++) {
        play('shake');
        await wait(230);
      }
      el.classList.remove('shaking');
      setHand(0, left);
      setHand(1, right);
      el.classList.add('revealed');
    },
    pop(text, cls = '') {
      popEl.className = 'pop';
      void popEl.offsetWidth; // restart animation
      popEl.textContent = text;
      popEl.className = `pop go ${cls}`;
    },
  };
  api.setNames(...names);
  api.setTags(...tags);
  return api;
}
