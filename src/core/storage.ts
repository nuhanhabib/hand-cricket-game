/**
 * storage.ts
 * Settings + career stats persisted in localStorage (safe if storage is blocked).
 */
import type { Difficulty } from './ai';

export type ThemeMode = 'auto' | 'light' | 'dark';

export interface Settings {
  sound: boolean;
  vibration: boolean;
  theme: ThemeMode;
  fast: boolean;
  // last used match setup
  overs: number | null;
  wickets: number;
  difficulty: Difficulty;
  p1Name: string;
  p2Name: string;
}

export interface Stats {
  played: number;
  won: number;
  lost: number;
  tied: number;
  streak: number;
  bestStreak: number;
  highScore: number;
  totalRuns: number;
  fours: number;
  sixes: number;
  ducks: number;
  bestBowling: number;
}

const SETTINGS_KEY = 'hand_cricket_settings_v1';
const STATS_KEY = 'hand_cricket_stats_v1';

const DEFAULT_SETTINGS: Settings = {
  sound: true,
  vibration: true,
  theme: 'auto',
  fast: false,
  overs: 2,
  wickets: 2,
  difficulty: 'medium',
  p1Name: 'You',
  p2Name: 'Player 2',
};

export const EMPTY_STATS: Stats = {
  played: 0, won: 0, lost: 0, tied: 0, streak: 0, bestStreak: 0,
  highScore: 0, totalRuns: 0, fours: 0, sixes: 0, ducks: 0, bestBowling: 0,
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : { ...fallback };
  } catch {
    return { ...fallback };
  }
}

function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — keep in memory only */
  }
}

export const settings: Settings = load(SETTINGS_KEY, DEFAULT_SETTINGS);
export const stats: Stats = load(STATS_KEY, EMPTY_STATS);

export const saveSettings = (): void => save(SETTINGS_KEY, settings);
export const saveStats = (): void => save(STATS_KEY, stats);

export function resetStats(): void {
  Object.assign(stats, EMPTY_STATS);
  saveStats();
}

export function applyTheme(): void {
  const dark =
    settings.theme === 'dark' ||
    (settings.theme === 'auto' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#1c212d' : '#f5f2e9');
}
