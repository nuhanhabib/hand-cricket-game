/**
 * toss.ts
 * The authentic toss: call ODD or EVEN, both throw fingers, add them up.
 * Winner chooses to bat or bowl.
 */
import { html, mount, onTap, $, esc, wait, setKeyHandler, pickOne } from './dom';
import { createArena } from './arena';
import { createKeypad, P1_KEYS, P2_KEYS, type Keypad } from './keypad';
import { showMenu } from './menu';
import { startGame } from './game';
import type { Session } from './session';
import type { Side } from '../core/match';
import { play, buzz } from '../audio/sound';

export function showToss(session: Session): void {
  const cpu = session.mode === 'cpu';
  const [n1, n2] = session.names;

  const s = mount(
    html(`
    <main class="screen toss ${cpu ? '' : 'two-p'}">
      <div class="top-pad"></div>
      <header class="bar">
        <button class="icon-btn" data-act="back" aria-label="Back">←</button>
        <h2>The Toss</h2>
        <span class="bar-spacer"></span>
      </header>
      <div class="toss-msg card"></div>
      <div class="arena-holder"></div>
      <div class="toss-actions"></div>
      <div class="bottom-pad"></div>
    </main>`),
  );
  onTap($(s, '[data-act="back"]'), showMenu);

  const msg = $(s, '.toss-msg');
  const actions = $(s, '.toss-actions');
  const arena = createArena([n1, n2]);
  $(s, '.arena-holder').appendChild(arena.el);

  // Step 1 — call odd/even
  msg.innerHTML = `<b>${esc(n1)}</b>, call it!`;
  actions.innerHTML = `
    <div class="call-row">
      <button class="btn btn-yellow btn-lg" data-call="odd">ODD</button>
      <button class="btn btn-blue btn-lg" data-call="even">EVEN</button>
    </div>`;
  actions.querySelectorAll<HTMLButtonElement>('[data-call]').forEach((b) =>
    onTap(b, () => throwHands(b.dataset.call as 'odd' | 'even')),
  );

  // Step 2 — both throw fingers
  function throwHands(call: 'odd' | 'even'): void {
    arena.setTags(call.toUpperCase(), call === 'odd' ? 'EVEN' : 'ODD');
    msg.innerHTML = `<b>${esc(n1)}</b> called <b>${call.toUpperCase()}</b>. Show your fingers!`;
    actions.innerHTML = '';
    const picks: (number | null)[] = [null, null];
    const pads: Keypad[] = [];

    const tryReveal = async (): Promise<void> => {
      if (picks[0] === null || picks[1] === null) return;
      setKeyHandler(null);
      pads.forEach((p) => p.setEnabled(false));
      await arena.showdown(picks[0], picks[1]);
      const sum = picks[0] + picks[1];
      const isOdd = sum % 2 === 1;
      const winner: Side = (call === 'odd') === isOdd ? 0 : 1;
      play('whistle');
      buzz(40);
      arena.pop(`${sum} = ${isOdd ? 'ODD' : 'EVEN'}`, 'toss');
      await wait(900);
      pads.forEach((p) => p.el.remove());
      $(s, '.top-pad').innerHTML = '';
      choose(winner, `${picks[0]} + ${picks[1]} = <b>${sum}</b> (${isOdd ? 'odd' : 'even'})`);
    };

    const p1 = createKeypad({
      label: `${n1}: show 1–6`,
      sleeve: 'var(--p1)',
      hidden: !cpu,
      keys: P1_KEYS,
      onPick: (n) => {
        picks[0] = n;
        if (cpu) picks[1] = 1 + Math.floor(Math.random() * 6);
        tryReveal();
      },
    });
    pads.push(p1);
    $(s, '.bottom-pad').appendChild(p1.el);
    if (!cpu) {
      const p2 = createKeypad({
        label: `${n2}: show 1–6`,
        sleeve: 'var(--p2)',
        hidden: true,
        keys: P2_KEYS,
        flipped: true,
        onPick: (n) => {
          picks[1] = n;
          tryReveal();
        },
      });
      pads.push(p2);
      $(s, '.top-pad').appendChild(p2.el);
    }
    setKeyHandler((e) => pads.some((p) => p.key(e.key)));
  }

  // Step 3 — winner chooses bat/bowl
  function choose(winner: Side, sumText: string): void {
    const wName = session.names[winner];
    const start = (battingFirst: Side): void => startGame(session, battingFirst);

    if (cpu && winner === 1) {
      const bat = Math.random() < 0.5;
      msg.innerHTML = `${sumText}<br/><b>CPU</b> won the toss and chose to <b>${bat ? 'BAT' : 'BOWL'}</b> first.`;
      actions.innerHTML = `<button class="btn btn-yellow btn-xl" data-act="start">Start Match 🏏</button>`;
      onTap($(actions, '[data-act="start"]'), () => start(bat ? 1 : 0));
      return;
    }
    msg.innerHTML = `${sumText}<br/>${pickOne(['🎉', '🥳', '🙌'])} <b>${esc(wName)}</b> won the toss! Bat or bowl?`;
    actions.innerHTML = `
      <div class="call-row">
        <button class="btn btn-yellow btn-lg" data-c="bat">🏏 BAT</button>
        <button class="btn btn-orange btn-lg" data-c="bowl">🎯 BOWL</button>
      </div>`;
    onTap($(actions, '[data-c="bat"]'), () => start(winner));
    onTap($(actions, '[data-c="bowl"]'), () => start(winner === 0 ? 1 : 0));
  }
}
