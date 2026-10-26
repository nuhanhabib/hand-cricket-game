/**
 * main.ts
 * Entry point — apply theme and show the main menu.
 */
import './style.css';
import { applyTheme } from './core/storage';
import { showMenu } from './ui/menu';

applyTheme();
window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);
showMenu();
