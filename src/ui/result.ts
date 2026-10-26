/**
 * result.ts
 * Match result + scorecard, updates career stats (VS Computer only).
 */
import { html, mount, onTap, $, esc, confetti } from './dom';
import { showMenu } from './menu';
import { showToss } from './toss';
import { startGame, type GameExtras } from './game';
import { sideColor, type Session } from './session';
import { other, oversText, type Match } from '../core/match';
import { stats, saveStats } from '../core/storage';
import { play, buzz } from '../audio/sound';

function recordStats(match: Match, extras: GameExtras, winner: 0 | 1 | null): void {
  const mine = match.innings.find((i) => i.batting === 0)!;
  const theirs = match.innings.find((i) => i.batting === 1)!;
  stats.highScore = Math.max(stats.highScore, mine.runs);
  stats.totalRuns += mine.runs;
  stats.fours += mine.fours;
  stats.sixes += mine.sixes;
  stats.ducks += extras.ducks[0];
  stats.bestBowling = Math.max(stats.bestBowling, theirs.wickets);
  if (match.superOver) return saveStats(); // the tie was already counted
  stats.played++;
  if (winner === 0) {
    stats.won++;
    stats.streak++;
    stats.bestStreak = Math.max(stats.bestStreak, stats.streak);
  } else {
    stats.streak = 0;
    if (winner === 1) stats.lost++;
    else stats.tied++;
  }
  saveStats();
}

export function showResult(session: Session, match: Match, extras: GameExtras): void {
  const cpu = session.mode === 'cpu';
  const names = session.names;
  const res = match.result();
  if (cpu) recordStats(match, extras, res.winner);

  let title: string;
  let emoji: string;
  if (res.winner === null) {
    title = 'Match Tied!';
    emoji = '🤝';
  } else if (cpu) {
    title = res.winner === 0 ? 'You Won!' : 'CPU Won!';
    emoji = res.winner === 0 ? '🏆' : '😢';
  } else {
    title = `${names[res.winner]} Wins!`;
    emoji = '🏆';
  }

  let margin = 'Scores are level — nobody blinked!';
  if (res.byRuns !== undefined) margin = `by ${res.byRuns} run${res.byRuns === 1 ? '' : 's'}`;
  if (res.byWickets !== undefined) {
    margin = `by ${res.byWickets} wicket${res.byWickets === 1 ? '' : 's'}`;
    if (res.ballsLeft) margin += ` (${res.ballsLeft} ball${res.ballsLeft === 1 ? '' : 's'} left)`;
  }

  const won = res.winner === 0 || (!cpu && res.winner !== null);
  if (won) {
    play('win');
    buzz([60, 50, 60, 50, 120]);
    confetti();
  } else if (res.winner === 1) {
    play('lose');
    buzz(200);
  } else {
    play('whistle');
  }

  const card = match.innings
    .map(
      (inn) => `
      <div class="sc-row">
        <i class="dot" style="background:${sideColor(inn.batting)}"></i>
        <span class="sc-name">${esc(names[inn.batting])}</span>
        <b class="sc-runs">${inn.runs}/${inn.wickets}</b>
        <span class="sc-ov">${oversText(inn.balls)} ov</span>
      </div>
      <div class="sc-detail">4s: ${inn.fours} · 6s: ${inn.sixes} · Top score: ${inn.topScore} · Ducks: ${extras.ducks[inn.batting]}</div>`,
    )
    .join('');

  const s = mount(
    html(`
    <main class="screen result">
      <div class="result-emoji">${emoji}</div>
      <h1 class="result-title">${esc(title)}</h1>
      <p class="result-margin">${match.superOver ? '⚡ Super Over · ' : ''}${margin}</p>
      <section class="card scorecard">${card}</section>
      <div class="result-actions">
        ${res.winner === null ? '<button class="btn btn-orange btn-xl" data-act="super">⚡ Super Over</button>' : ''}
        <button class="btn btn-yellow btn-lg" data-act="again">↻ Rematch</button>
        <button class="btn btn-plain" data-act="menu">⌂ Main Menu</button>
      </div>
    </main>`),
  );

  onTap($(s, '[data-act="again"]'), () => showToss(session));
  onTap($(s, '[data-act="menu"]'), showMenu);
  // Super over: the side that batted second bats first.
  onTap($(s, '[data-act="super"]'), () => startGame(session, other(match.firstBatting), true));
}
