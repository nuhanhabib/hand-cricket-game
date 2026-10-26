/**
 * game.ts
 * Ball-by-ball play: both pick a number, hands shake, reveal.
 * Same number = OUT, otherwise the batter scores what they showed.
 */
import { html, mount, onTap, $, esc, wait, setKeyHandler, modal, pickOne, confetti } from './dom';
import { createArena } from './arena';
import { createKeypad, P1_KEYS, P2_KEYS, type Keypad } from './keypad';
import { showMenu } from './menu';
import { showToss } from './toss';
import { showResult } from './result';
import { showHowTo } from './modals';
import { sideColor, type Session } from './session';
import { Match, other, oversText, type Side, type Ball } from '../core/match';
import { CpuBrain } from '../core/ai';
import { play, buzz } from '../audio/sound';

const LINES: Record<string, string[]> = {
  1: ['Quick single by {b}.', 'Pushed into the gap — one run.', 'A gentle nudge, they take one.'],
  2: ['Two runs! Good running between the benches.', 'Placed nicely — they come back for two.'],
  3: ['Three! Excellent placement by {b}.', 'Into the corridor — they run three!'],
  4: ['FOUR! Cracking shot through the covers!', 'FOUR! Straight past the class monitor!', 'FOUR! That raced to the classroom door!'],
  5: ['FIVE! The fielder fumbled — overthrows!', 'FIVE runs! Only in hand cricket!'],
  6: ['SIX! Over the school wall!', "SIX! That's landed in the principal's office!", 'SIX! Ball is lost — someone fetch another one!', 'SIX! Huge! The whole class is cheering!'],
  out: ['OUT! Same number — caught red-handed!', 'OUT! {w} read that perfectly!', "OUT! The fingers matched — {b} has to go!", 'OUT! Clean bowled! Teacher saw nothing.'],
};

function line(key: string, b: string, w: string): string {
  return pickOne(LINES[key]).replace('{b}', b).replace('{w}', w);
}

export interface GameExtras {
  ducks: [number, number];
}

export function startGame(session: Session, battingFirst: Side, superOver = false): void {
  const cpu = session.mode === 'cpu';
  const names = session.names;
  const match = new Match(superOver ? { overs: 1, wickets: 1 } : session.config, battingFirst, superOver);
  const brain = cpu ? new CpuBrain(session.difficulty) : null;
  const extras: GameExtras = { ducks: [0, 0] };

  const s = mount(
    html(`
    <main class="screen game ${cpu ? '' : 'two-p'}">
      <div class="top-pad"></div>
      <header class="bar">
        <button class="icon-btn" data-act="pause" aria-label="Pause">❚❚</button>
        <h2 class="inn-label"></h2>
        <button class="icon-btn" data-act="help" aria-label="How to play">?</button>
      </header>
      <section class="scoreboard">
        <div class="sb-row">
          <div class="sb-team"><i class="dot"></i><span class="sb-name"></span></div>
          <div class="sb-overs"></div>
        </div>
        <div class="sb-score"></div>
        <div class="sb-sub"></div>
      </section>
      <div class="arena-holder"></div>
      <p class="commentary" aria-live="polite"></p>
      <div class="over-chips" aria-label="This over"></div>
      <div class="bottom-pad"></div>
    </main>`),
  );

  const arena = createArena(names);
  $(s, '.arena-holder').appendChild(arena.el);

  const picks: (number | null)[] = [null, null];
  const pads: Keypad[] = [];
  let busy = false;

  const onPick = (side: Side) => (n: number) => {
    picks[side] = n;
    if (cpu && side === 0) {
      const cpuBats = match.current.batting === 1;
      picks[1] = brain!.pick(cpuBats ? 'bat' : 'bowl', cpuBats ? match.runsNeeded : null);
      brain!.observe(cpuBats ? 'bowl' : 'bat', n);
    }
    if (picks[0] !== null && picks[1] !== null) resolveBall(picks[0], picks[1]);
  };

  pads.push(createKeypad({ label: '', sleeve: 'var(--p1)', hidden: !cpu, keys: P1_KEYS, onPick: onPick(0) }));
  $(s, '.bottom-pad').appendChild(pads[0].el);
  if (!cpu) {
    pads.push(createKeypad({ label: '', sleeve: 'var(--p2)', hidden: true, keys: P2_KEYS, flipped: true, onPick: onPick(1) }));
    $(s, '.top-pad').appendChild(pads[1].el);
  }

  const bindKeys = (): void =>
    setKeyHandler((e) => {
      if (e.key === 'Escape') return pause();
      if (!busy) pads.some((p) => p.key(e.key));
    });

  function render(): void {
    const inn = match.current;
    const bat = inn.batting;
    $(s, '.inn-label').textContent = superOver ? '⚡ Super Over' : match.inningsNo === 1 ? '1st Innings' : '2nd Innings · Chase';
    $(s, '.dot').style.background = sideColor(bat);
    $(s, '.sb-name').innerHTML = `${esc(names[bat])} <small>batting</small>`;
    const lim = match.ballLimit;
    $(s, '.sb-overs').textContent = `Overs ${oversText(inn.balls)}${lim === null ? '' : ` / ${match.config.overs}`}`;
    $(s, '.sb-score').innerHTML = `${inn.runs}<span>/${inn.wickets}</span>`;

    let sub = `Batter: <b>${inn.batterRuns}*</b> · Wkts left: <b>${match.config.wickets - inn.wickets}</b>`;
    if (match.target !== null) {
      const need = match.runsNeeded!;
      const left = match.ballsLeft;
      sub = `Target <b>${match.target}</b> · Need <b>${need}</b>${left === null ? '' : ` from <b>${left}</b> ball${left === 1 ? '' : 's'}`}`;
    }
    $(s, '.sb-sub').innerHTML = sub;

    arena.setTags(bat === 0 ? '🏏 BAT' : '🎯 BOWL', bat === 1 ? '🏏 BAT' : '🎯 BOWL');

    // This over
    const start = inn.balls === 0 ? 0 : Math.floor((inn.balls - 1) / 6) * 6;
    const balls = inn.log.slice(start, start + 6);
    const chips = balls.map((b: Ball) => `<i class="chip-ball ${b.out ? 'w' : b.runs >= 4 ? 'b' : ''}">${b.out ? 'W' : b.runs}</i>`);
    while (chips.length < 6) chips.push('<i class="chip-ball empty"></i>');
    $(s, '.over-chips').innerHTML = chips.join('');

    // Keypad labels
    if (cpu) {
      pads[0].setLabel(bat === 0 ? '🏏 Your shot — pick runs (1–6)' : '🎯 Your delivery — guess their number!');
    } else {
      pads[0].setLabel(`${names[0]} · ${bat === 0 ? '🏏 BAT' : '🎯 BOWL'}`);
      pads[1].setLabel(`${names[1]} · ${bat === 1 ? '🏏 BAT' : '🎯 BOWL'}`);
    }
  }

  async function resolveBall(p0: number, p1: number): Promise<void> {
    busy = true;
    pads.forEach((p) => p.setEnabled(false));
    const inn = match.current;
    const bat = inn.batting;
    const batN = bat === 0 ? p0 : p1;
    const bowlN = bat === 0 ? p1 : p0;
    const batterBefore = inn.batterRuns;

    await arena.showdown(p0, p1);
    const { ball, end } = match.play(batN, bowlN);
    const bName = names[bat];
    const wName = names[other(bat)];
    let text: string;

    if (ball.out) {
      play('out');
      buzz([80, 60, 120]);
      const log = inn.log;
      const hatTrick = log.length >= 3 && log.slice(-3).every((b) => b.out);
      arena.pop(hatTrick ? 'HAT-TRICK!' : 'OUT!', 'out');
      text = line('out', bName, wName);
      if (batterBefore === 0) {
        extras.ducks[bat]++;
        text += ' 🦆 Gone for a duck!';
      }
      if (hatTrick) text = `🎩 HAT-TRICK for ${wName}! Three in a row!`;
      s.classList.add('flash-out');
      setTimeout(() => s.classList.remove('flash-out'), 500);
    } else {
      const big = ball.runs === 4 || ball.runs === 6;
      play(big ? 'boundary' : 'bat');
      buzz(big ? [30, 40, 30] : 20);
      arena.pop(ball.runs === 6 ? 'SIX!' : ball.runs === 4 ? 'FOUR!' : `+${ball.runs}`, big ? 'big' : 'runs');
      text = line(String(ball.runs), bName, wName);
      for (const m of [50, 100, 150]) {
        if (batterBefore < m && inn.batterRuns >= m) {
          text = `${m === 50 ? '🎉 FIFTY' : m === 100 ? '💯 CENTURY' : '🔥 150'} for ${bName}! Raise the bat!`;
          confetti();
        }
      }
    }
    $(s, '.commentary').textContent = text;
    render();

    if (end) {
      await wait(1200);
      if (match.finished) {
        showResult(session, match, extras);
        return;
      }
      inningsBreak(end);
      return;
    }
    await wait(450);
    nextBall();
  }

  function nextBall(): void {
    picks[0] = picks[1] = null;
    busy = false;
    pads.forEach((p) => {
      p.reset();
      p.setEnabled(true);
    });
  }

  function inningsBreak(reason: string): void {
    const first = match.current;
    const chaser = other(first.batting);
    const lim = match.ballLimit;
    const why = reason === 'all-out' ? 'All out!' : 'Overs finished!';
    play('whistle');
    modal(
      'Innings Break',
      `<p class="big-line">${why}</p>
       <p><b>${esc(names[first.batting])}</b> scored <b>${first.runs}/${first.wickets}</b> (${oversText(first.balls)} ov)</p>
       <p class="target-line"><b>${esc(names[chaser])}</b> need <b>${first.runs + 1}</b> to win${lim === null ? '' : ` from <b>${lim}</b> balls`}</p>`,
      [
        {
          label: 'Start Chase 🏃',
          onClick: () => {
            match.startSecondInnings();
            arena.idle();
            arena.pop('');
            $(s, '.commentary').textContent = `${names[chaser]} walk out to chase ${first.runs + 1}.`;
            render();
            nextBall();
          },
        },
      ],
      { dismissable: false },
    );
  }

  function pause(): void {
    if (document.querySelector('.overlay')) return;
    modal(
      'Paused',
      '<p>Take a breath — the teacher isn\'t looking. 🤫</p>',
      [
        { label: '▶ Resume' },
        { label: '↻ Restart (new toss)', cls: 'btn-blue', onClick: () => showToss(session) },
        { label: '⌂ Quit to Menu', cls: 'btn-plain', onClick: showMenu },
      ],
    );
  }

  onTap($(s, '[data-act="pause"]'), pause);
  onTap($(s, '[data-act="help"]'), showHowTo);
  bindKeys();
  render();
  $(s, '.commentary').textContent = superOver
    ? `Super Over! 1 over, 1 wicket. ${names[battingFirst]} bat first.`
    : `${names[battingFirst]} will bat first. Here we go!`;
  play('whistle');
}
