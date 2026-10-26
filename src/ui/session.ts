/**
 * session.ts
 * What the players chose on the setup screen; shared by toss/game/result.
 */
import type { MatchConfig, Side } from '../core/match';
import type { Difficulty } from '../core/ai';

export type Mode = 'cpu' | '2p';

export interface Session {
  mode: Mode;
  names: [string, string];
  config: MatchConfig;
  difficulty: Difficulty;
}

export const sideColor = (s: Side): string => (s === 0 ? 'var(--p1)' : 'var(--p2)');
