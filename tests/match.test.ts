import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Match } from '../src/core/match.ts';
import { CpuBrain } from '../src/core/ai.ts';

test('batter scores own number, same number is out', () => {
  const m = new Match({ overs: 1, wickets: 2 }, 0);
  m.play(4, 2);
  m.play(6, 1);
  assert.equal(m.current.runs, 10);
  assert.equal(m.current.fours, 1);
  assert.equal(m.current.sixes, 1);
  const { ball, end } = m.play(3, 3);
  assert.equal(ball.out, true);
  assert.equal(m.current.wickets, 1);
  assert.equal(end, null);
  assert.equal(m.current.batterRuns, 0);
  assert.equal(m.current.topScore, 10);
});

test('innings ends on all out and overs', () => {
  const a = new Match({ overs: 1, wickets: 1 }, 0);
  assert.equal(a.play(2, 2).end, 'all-out');
  const b = new Match({ overs: 1, wickets: 5 }, 0);
  for (let i = 0; i < 5; i++) assert.equal(b.play(1, 2).end, null);
  assert.equal(b.play(1, 2).end, 'overs');
});

test('chase: win by wickets with balls left', () => {
  const m = new Match({ overs: 1, wickets: 2 }, 0);
  m.play(5, 1); m.play(5, 5); m.play(3, 3); // 5/2 all out
  m.startSecondInnings();
  assert.equal(m.target, 6);
  m.play(4, 1);
  assert.equal(m.runsNeeded, 2);
  assert.equal(m.play(2, 1).end, 'target');
  assert.deepEqual(m.result(), { winner: 1, byWickets: 2, ballsLeft: 4 });
});

test('defend: win by runs, and tie', () => {
  const m = new Match({ overs: 1, wickets: 1 }, 1);
  m.play(6, 1); m.play(1, 1); // side 1: 6
  m.startSecondInnings();
  m.play(2, 1); m.play(2, 2);
  assert.deepEqual(m.result(), { winner: 1, byRuns: 4 });

  const t = new Match({ overs: null, wickets: 1 }, 0);
  t.play(3, 1); t.play(3, 3);
  t.startSecondInnings();
  t.play(3, 1); t.play(4, 4);
  assert.deepEqual(t.result(), { winner: null });
});

test('hard CPU learns a predictable batter', () => {
  const brain = new CpuBrain('hard');
  for (let i = 0; i < 30; i++) brain.observe('bat', 6);
  let sixes = 0;
  for (let i = 0; i < 200; i++) if (brain.pick('bowl') === 6) sixes++;
  assert.ok(sixes > 140, `expected CPU to bowl 6 mostly, got ${sixes}/200`);
});
