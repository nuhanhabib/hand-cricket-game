/**
 * setup.ts
 * Match setup: names, overs, wickets, CPU difficulty.
 */
import { html, mount, onTap, $, esc } from './dom';
import { showMenu } from './menu';
import { showToss } from './toss';
import type { Mode } from './session';
import { settings, saveSettings } from '../core/storage';
import type { Difficulty } from '../core/ai';

const OVERS: (number | null)[] = [1, 2, 3, 5, null];
const WICKETS = [1, 2, 3, 5, 10];
const DIFFS: { v: Difficulty; label: string; hint: string }[] = [
  { v: 'easy', label: 'Easy', hint: 'Junior class' },
  { v: 'medium', label: 'Medium', hint: 'Class monitor' },
  { v: 'hard', label: 'Hard', hint: 'Bench champion' },
];

function chips(name: string, items: { v: string; label: string; hint?: string }[], current: string): string {
  return `<div class="chips" role="radiogroup" data-group="${name}">
    ${items
      .map(
        (i) => `<button class="chip ${i.v === current ? 'on' : ''}" role="radio" aria-checked="${i.v === current}" data-v="${i.v}">
          ${i.label}${i.hint ? `<small>${i.hint}</small>` : ''}</button>`,
      )
      .join('')}
  </div>`;
}

export function showSetup(mode: Mode): void {
  const cpu = mode === 'cpu';
  const p1Default = cpu ? settings.p1Name : settings.p1Name === 'You' ? 'Player 1' : settings.p1Name;
  const s = mount(
    html(`
    <main class="screen setup">
      <header class="bar">
        <button class="icon-btn" data-act="back" aria-label="Back">←</button>
        <h2>${cpu ? 'VS Computer' : '2 Players'}</h2>
        <span class="bar-spacer"></span>
      </header>

      <section class="card">
        <label class="field">
          <span>${cpu ? 'Your name' : 'Player 1 (bottom)'}</span>
          <input id="p1" maxlength="12" value="${esc(p1Default)}" autocomplete="off" />
        </label>
        ${
          cpu
            ? ''
            : `<label class="field"><span>Player 2 (top)</span><input id="p2" maxlength="12" value="${esc(settings.p2Name)}" autocomplete="off" /></label>`
        }
      </section>

      <section class="card">
        <h3>Overs</h3>
        ${chips('overs', OVERS.map((o) => ({ v: String(o), label: o === null ? '∞' : String(o), hint: o === null ? 'classic' : undefined })), String(settings.overs))}
        <h3>Wickets</h3>
        ${chips('wickets', WICKETS.map((w) => ({ v: String(w), label: String(w) })), String(settings.wickets))}
        ${cpu ? `<h3>Opponent</h3>${chips('diff', DIFFS, settings.difficulty)}` : ''}
      </section>

      ${cpu ? '' : '<p class="note">Sit face to face and put the phone between you — Player 2 plays from the top. Your picks stay hidden until both hands are in!</p>'}

      <button class="btn btn-yellow btn-xl" data-act="go">Go to Toss 🪙</button>
    </main>`),
  );

  s.querySelectorAll<HTMLElement>('.chips').forEach((group) => {
    group.querySelectorAll<HTMLButtonElement>('.chip').forEach((chip) => {
      onTap(chip, () => {
        group.querySelectorAll('.chip').forEach((c) => {
          c.classList.remove('on');
          c.setAttribute('aria-checked', 'false');
        });
        chip.classList.add('on');
        chip.setAttribute('aria-checked', 'true');
      });
    });
  });

  const val = (g: string): string => $(s, `[data-group="${g}"] .chip.on`).dataset.v!;

  onTap($(s, '[data-act="back"]'), showMenu);
  onTap($(s, '[data-act="go"]'), () => {
    const overs = val('overs') === 'null' ? null : Number(val('overs'));
    const wickets = Number(val('wickets'));
    const p1 = $<HTMLInputElement>(s, '#p1').value.trim() || (cpu ? 'You' : 'Player 1');
    const p2 = cpu ? 'CPU' : $<HTMLInputElement>(s, '#p2').value.trim() || 'Player 2';
    settings.overs = overs;
    settings.wickets = wickets;
    settings.p1Name = p1;
    if (!cpu) settings.p2Name = p2;
    if (cpu) settings.difficulty = val('diff') as Difficulty;
    saveSettings();
    showToss({ mode, names: [p1, p2], config: { overs, wickets }, difficulty: settings.difficulty });
  });
}
