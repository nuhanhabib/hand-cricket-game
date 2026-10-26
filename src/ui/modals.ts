/**
 * modals.ts
 * How to Play, Stats and Settings popups.
 */
import { html, modal, onTap } from './dom';
import { handSvg } from './hand';
import { stats, settings, saveSettings, resetStats, applyTheme, type ThemeMode } from '../core/storage';
import { play } from '../audio/sound';

export function showHowTo(): void {
  const hands = [1, 2, 3, 4, 5, 6]
    .map((n) => `<div class="howto-hand">${handSvg(n, 'var(--p1)')}<b>${n}</b></div>`)
    .join('');
  modal(
    'How to Play',
    `<div class="howto">
      <div class="howto-hands">${hands}</div>
      <p class="muted center">5 = open palm · 6 = thumbs up 👍</p>
      <ol>
        <li><b>Toss:</b> call <b>ODD</b> or <b>EVEN</b>, both show fingers. Add them up — if it matches your call, you choose to bat or bowl.</li>
        <li><b>Batting:</b> show 1–6. You score that many runs…</li>
        <li><b>…unless</b> the bowler shows the <b>same number</b> — then you're <b>OUT!</b></li>
        <li><b>Bowling:</b> try to guess the batter's number to get them out.</li>
        <li>Innings ends when all wickets fall or overs run out. Then swap and chase the target!</li>
        <li>Scores level? Play a <b>⚡ Super Over</b> (1 over, 1 wicket).</li>
      </ol>
      <p class="tip">💡 The CPU remembers your favourite numbers. Don't be predictable!</p>
      <p class="tip">⌨️ Keyboard: Player 1 uses <kbd>1</kbd>–<kbd>6</kbd>, Player 2 uses <kbd>Z</kbd>–<kbd>N</kbd>. <kbd>Esc</kbd> pauses.</p>
    </div>`,
    [{ label: 'Got it!' }],
    { cls: 'wide' },
  );
}

export function showStats(): void {
  const rate = stats.played ? Math.round((stats.won / stats.played) * 100) : 0;
  const tiles: [string, string | number][] = [
    ['Played', stats.played],
    ['Won', stats.won],
    ['Lost', stats.lost],
    ['Tied', stats.tied],
    ['Win %', `${rate}%`],
    ['Best streak', stats.bestStreak],
    ['High score', stats.highScore],
    ['Total runs', stats.totalRuns],
    ['Sixes', stats.sixes],
    ['Fours', stats.fours],
    ['Ducks 🦆', stats.ducks],
    ['Best bowling', `${stats.bestBowling} wkts`],
  ];
  const body = html(`
    <div>
      <p class="muted center">Your career vs the Computer</p>
      <div class="stat-grid">${tiles.map(([k, v]) => `<div class="stat"><b>${v}</b><span>${k}</span></div>`).join('')}</div>
    </div>`);
  modal('Your Stats', body, [
    {
      label: 'Reset stats',
      cls: 'btn-plain',
      onClick: () =>
        modal('Reset stats?', '<p>This clears your whole career record. No undo!</p>', [
          { label: 'Yes, reset', cls: 'btn-danger', onClick: () => (resetStats(), showStats()) },
          { label: 'Cancel', cls: 'btn-plain' },
        ]),
    },
    { label: 'Close' },
  ]);
}

export function showSettings(): void {
  const toggle = (key: 'sound' | 'vibration' | 'fast', label: string, hint: string): string => `
    <label class="toggle-row">
      <span><b>${label}</b><small>${hint}</small></span>
      <input type="checkbox" data-k="${key}" ${settings[key] ? 'checked' : ''} />
      <i class="switch"></i>
    </label>`;
  const body = html(`
    <div class="settings">
      ${toggle('sound', 'Sound', 'Bat thocks, crowd cheers, stumps')}
      ${toggle('vibration', 'Vibration', 'Buzz on every ball (phones)')}
      ${toggle('fast', 'Fast mode', 'Quicker hand shakes')}
      <div class="toggle-row col">
        <b>Theme</b>
        <div class="chips">
          ${(['auto', 'light', 'dark'] as ThemeMode[])
            .map((t) => `<button class="chip ${settings.theme === t ? 'on' : ''}" data-theme="${t}">${t === 'auto' ? 'Auto' : t === 'light' ? '☀️ Day' : '🌙 Night'}</button>`)
            .join('')}
        </div>
      </div>
    </div>`);

  body.querySelectorAll<HTMLInputElement>('input[data-k]').forEach((inp) => {
    inp.addEventListener('change', () => {
      settings[inp.dataset.k as 'sound' | 'vibration' | 'fast'] = inp.checked;
      saveSettings();
      play('tap');
    });
  });
  body.querySelectorAll<HTMLButtonElement>('[data-theme]').forEach((b) =>
    onTap(b, () => {
      settings.theme = b.dataset.theme as ThemeMode;
      saveSettings();
      applyTheme();
      body.querySelectorAll('[data-theme]').forEach((c) => c.classList.toggle('on', c === b));
    }),
  );
  modal('Settings', body, [{ label: 'Done' }]);
}
