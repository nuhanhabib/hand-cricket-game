/**
 * ai.ts
 * Computer opponent. Learns the human's habits (favourite numbers and
 * "what they show after X") and uses them to bowl at, or bat around, them.
 */

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Role = 'bat' | 'bowl';

const NUMS = [1, 2, 3, 4, 5, 6];

interface Habit {
  freq: number[]; // index 1..6, recency-weighted counts
  next: number[][]; // next[prev][n]
  last: number;
}

function newHabit(): Habit {
  return {
    freq: Array(7).fill(1),
    next: Array.from({ length: 7 }, () => Array(7).fill(0.5)),
    last: 0,
  };
}

function weightedPick(weights: number[]): number {
  const total = NUMS.reduce((s, n) => s + weights[n], 0);
  let r = Math.random() * total;
  for (const n of NUMS) {
    r -= weights[n];
    if (r <= 0) return n;
  }
  return 6;
}

const randomNum = (): number => 1 + Math.floor(Math.random() * 6);

export class CpuBrain {
  private habits: Record<Role, Habit> = { bat: newHabit(), bowl: newHabit() };

  difficulty: Difficulty;

  constructor(difficulty: Difficulty) {
    this.difficulty = difficulty;
  }

  /** Record what the human showed while playing `role`. */
  observe(role: Role, n: number): void {
    const h = this.habits[role];
    for (const k of NUMS) h.freq[k] *= 0.92;
    h.freq[n] += 1;
    if (h.last) h.next[h.last][n] += 1;
    h.last = n;
  }

  /** Probability the human shows each number next while playing `role`. */
  private predict(role: Role): number[] {
    const h = this.habits[role];
    const p = Array(7).fill(0);
    const fSum = NUMS.reduce((s, n) => s + h.freq[n], 0);
    const row = h.last ? h.next[h.last] : null;
    const tSum = row ? NUMS.reduce((s, n) => s + row[n], 0) : 0;
    for (const n of NUMS) {
      const f = h.freq[n] / fSum;
      p[n] = row ? 0.55 * f + 0.45 * (row[n] / tSum) : f;
    }
    return p;
  }

  /**
   * CPU picks a number. `cpuRole` is what the CPU is doing this ball.
   * `need` = runs still needed when CPU is chasing.
   */
  pick(cpuRole: Role, need: number | null = null): number {
    if (this.difficulty === 'easy') return randomNum();
    const explore = this.difficulty === 'hard' ? 0.12 : 0.4;
    if (Math.random() < explore) return randomNum();

    const sharp = this.difficulty === 'hard' ? 2.2 : 1.2;
    if (cpuRole === 'bowl') {
      // Bowl where the human is likely to bat.
      const p = this.predict('bat');
      return weightedPick(p.map((v) => Math.pow(v, sharp)));
    }

    // Batting: big numbers are worth more, but avoid what the human tends to bowl.
    const p = this.predict('bowl');
    const w = Array(7).fill(0);
    for (const n of NUMS) {
      const value = need !== null && n >= need ? 7 : n + 1; // any winning number is equally good
      w[n] = value * Math.pow(1 - p[n], sharp * 2);
    }
    return weightedPick(w);
  }

  /** Toss: just a random hand. */
  tossPick(): number {
    return randomNum();
  }
}
