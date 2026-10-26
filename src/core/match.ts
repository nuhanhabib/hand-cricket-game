/**
 * match.ts
 * Pure hand-cricket rules engine (no DOM). Two innings, limited overs/wickets.
 * Batter scores the number they show; if bowler shows the same number → OUT.
 */

export type Side = 0 | 1;

export interface MatchConfig {
  /** null = unlimited overs (classic playground rules) */
  overs: number | null;
  wickets: number;
}

export interface Ball {
  bat: number;
  bowl: number;
  out: boolean;
  runs: number;
}

export interface Innings {
  batting: Side;
  runs: number;
  wickets: number;
  balls: number;
  fours: number;
  sixes: number;
  /** runs of the batter currently at the crease */
  batterRuns: number;
  /** best individual score this innings */
  topScore: number;
  log: Ball[];
}

export type InningsEnd = 'all-out' | 'overs' | 'target' | null;

export interface MatchResult {
  winner: Side | null;
  byRuns?: number;
  byWickets?: number;
  ballsLeft?: number;
}

function newInnings(batting: Side): Innings {
  return { batting, runs: 0, wickets: 0, balls: 0, fours: 0, sixes: 0, batterRuns: 0, topScore: 0, log: [] };
}

export const other = (s: Side): Side => (s === 0 ? 1 : 0);

export function oversText(balls: number): string {
  return `${Math.floor(balls / 6)}.${balls % 6}`;
}

export class Match {
  readonly innings: Innings[];
  readonly config: MatchConfig;
  readonly firstBatting: Side;
  readonly superOver: boolean;

  constructor(config: MatchConfig, firstBatting: Side, superOver = false) {
    this.config = config;
    this.firstBatting = firstBatting;
    this.superOver = superOver;
    this.innings = [newInnings(firstBatting)];
  }

  get current(): Innings {
    return this.innings[this.innings.length - 1];
  }

  get inningsNo(): 1 | 2 {
    return this.innings.length as 1 | 2;
  }

  get ballLimit(): number | null {
    return this.config.overs === null ? null : this.config.overs * 6;
  }

  get target(): number | null {
    return this.innings.length === 2 ? this.innings[0].runs + 1 : null;
  }

  get ballsLeft(): number | null {
    const lim = this.ballLimit;
    return lim === null ? null : lim - this.current.balls;
  }

  get runsNeeded(): number | null {
    const t = this.target;
    return t === null ? null : Math.max(0, t - this.current.runs);
  }

  endReason(): InningsEnd {
    const inn = this.current;
    const t = this.target;
    if (t !== null && inn.runs >= t) return 'target';
    if (inn.wickets >= this.config.wickets) return 'all-out';
    const lim = this.ballLimit;
    if (lim !== null && inn.balls >= lim) return 'overs';
    return null;
  }

  get finished(): boolean {
    return this.innings.length === 2 && this.endReason() !== null;
  }

  play(bat: number, bowl: number): { ball: Ball; end: InningsEnd } {
    if (this.endReason() !== null) throw new Error('Innings already over');
    const inn = this.current;
    const out = bat === bowl;
    const ball: Ball = { bat, bowl, out, runs: out ? 0 : bat };
    inn.balls++;
    inn.log.push(ball);
    if (out) {
      inn.wickets++;
      inn.batterRuns = 0;
    } else {
      inn.runs += bat;
      inn.batterRuns += bat;
      inn.topScore = Math.max(inn.topScore, inn.batterRuns);
      if (bat === 4) inn.fours++;
      if (bat === 6) inn.sixes++;
    }
    return { ball, end: this.endReason() };
  }

  startSecondInnings(): void {
    if (this.innings.length !== 1 || this.endReason() === null) throw new Error('Cannot start 2nd innings');
    this.innings.push(newInnings(other(this.firstBatting)));
  }

  result(): MatchResult {
    if (!this.finished) throw new Error('Match not finished');
    const [first, second] = this.innings;
    const target = first.runs + 1;
    if (second.runs >= target) {
      const lim = this.ballLimit;
      return {
        winner: second.batting,
        byWickets: this.config.wickets - second.wickets,
        ballsLeft: lim === null ? undefined : lim - second.balls,
      };
    }
    if (second.runs === first.runs) return { winner: null };
    return { winner: first.batting, byRuns: first.runs - second.runs };
  }
}
