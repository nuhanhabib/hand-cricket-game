/**
 * menu.ts
 * Home screen: title, VS Computer / 2 Players, and the bottom cards.
 */
import { html, mount, onTap, $ } from './dom';
import { handSvg } from './hand';
import { showSetup } from './setup';
import { showHowTo, showSettings, showStats } from './modals';
import { stats } from '../core/storage';

export function showMenu(): void {
  const s = mount(
    html(`
    <main class="screen menu">
      <header class="menu-top">
        <span class="badge">🏏 W ${stats.won} · L ${stats.lost}</span>
        <button class="icon-btn" data-act="help" aria-label="How to play">?</button>
      </header>

      <section class="title-block">
        <div class="title-tape">THE SCHOOL BENCH SERIES</div>
        <h1 class="title">Hand<br/><span>Cricket</span></h1>
      </section>

      <section class="menu-art" aria-hidden="true">
        <div class="burst"></div>
        <div class="art-hand left">${handSvg(6, 'var(--p1)')}</div>
        <div class="art-ball"></div>
        <div class="art-hand right">${handSvg(2, 'var(--p2)')}</div>
      </section>

      <section class="menu-actions">
        <button class="btn btn-yellow btn-xl" data-act="cpu">
          <span class="btn-ico">🤖</span> VS Computer
        </button>
        <button class="btn btn-blue btn-lg" data-act="2p">
          <span class="btn-ico">👫</span> 2 Players <small>same phone</small>
        </button>
      </section>

      <nav class="menu-cards">
        <button class="card-btn" data-act="howto"><span>📖</span>How to Play</button>
        <button class="card-btn" data-act="stats"><span>🏆</span>Stats</button>
        <button class="card-btn" data-act="settings"><span>⚙️</span>Settings</button>
      </nav>
      <p class="tagline">"Odd or Even?" — every school recess, ever.</p>
    </main>`),
  );

  onTap($(s, '[data-act="cpu"]'), () => showSetup('cpu'));
  onTap($(s, '[data-act="2p"]'), () => showSetup('2p'));
  onTap($(s, '[data-act="help"]'), showHowTo);
  onTap($(s, '[data-act="howto"]'), showHowTo);
  onTap($(s, '[data-act="stats"]'), showStats);
  onTap($(s, '[data-act="settings"]'), showSettings);
}
