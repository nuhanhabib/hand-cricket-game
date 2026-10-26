/**
 * dom.ts
 * Small DOM helpers shared by all screens.
 */
import { play } from '../audio/sound';
import { settings } from '../core/storage';

export const root = (): HTMLElement => document.getElementById('app')!;

export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export function html(markup: string): HTMLElement {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstElementChild as HTMLElement;
}

/** Replace the whole screen. Clears any key handlers from the previous screen. */
export function mount(screen: HTMLElement): HTMLElement {
  setKeyHandler(null);
  const r = root();
  r.replaceChildren(screen);
  return screen;
}

export function $<T extends HTMLElement = HTMLElement>(parent: ParentNode, sel: string): T {
  return parent.querySelector(sel) as T;
}

/** Click handler with the standard tap sound. */
export function onTap(el: Element | null, fn: (e: Event) => void, sound = true): void {
  el?.addEventListener('click', (e) => {
    if (sound) play('tap');
    fn(e);
  });
}

let keyHandler: ((e: KeyboardEvent) => void) | null = null;
export function setKeyHandler(fn: ((e: KeyboardEvent) => void) | null): void {
  if (keyHandler) window.removeEventListener('keydown', keyHandler);
  keyHandler = fn;
  if (fn) window.addEventListener('keydown', fn);
}

/** Animation-speed-aware sleep. */
export function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, settings.fast ? ms * 0.55 : ms));
}

export function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export interface ModalButton {
  label: string;
  cls?: string;
  onClick?: () => void;
  keepOpen?: boolean;
}

/** Show a modal card. Returns a close function. */
export function modal(title: string, body: string | HTMLElement, buttons: ModalButton[] = [], opts: { dismissable?: boolean; cls?: string } = {}): () => void {
  const overlay = html(`
    <div class="overlay">
      <div class="modal ${opts.cls ?? ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="modal-head">
          <h2>${esc(title)}</h2>
          ${opts.dismissable !== false ? '<button class="icon-btn modal-x" aria-label="Close">✕</button>' : ''}
        </div>
        <div class="modal-body"></div>
        <div class="modal-actions"></div>
      </div>
    </div>`);
  const bodyEl = $(overlay, '.modal-body');
  if (typeof body === 'string') bodyEl.innerHTML = body;
  else bodyEl.appendChild(body);

  const close = (): void => {
    overlay.classList.add('closing');
    setTimeout(() => overlay.remove(), 160);
  };
  const actions = $(overlay, '.modal-actions');
  for (const b of buttons) {
    const btn = html(`<button class="btn ${b.cls ?? 'btn-yellow'}">${b.label}</button>`);
    onTap(btn, () => {
      if (!b.keepOpen) close();
      b.onClick?.();
    });
    actions.appendChild(btn);
  }
  if (!buttons.length) actions.remove();
  if (opts.dismissable !== false) {
    onTap($(overlay, '.modal-x'), close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
  }
  document.body.appendChild(overlay);
  return close;
}

export function confetti(): void {
  const colors = ['#f3cd57', '#9ec5e8', '#f8a170', '#a7cc8d', '#e63946', '#c4a7e7'];
  const layer = html('<div class="confetti" aria-hidden="true"></div>');
  for (let i = 0; i < 70; i++) {
    const p = document.createElement('i');
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = pickOne(colors);
    p.style.animationDelay = `${Math.random() * 0.6}s`;
    p.style.animationDuration = `${1.8 + Math.random() * 1.6}s`;
    p.style.setProperty('--drift', `${(Math.random() - 0.5) * 160}px`);
    p.style.setProperty('--spin', `${Math.random() * 900}deg`);
    layer.appendChild(p);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 4000);
}
