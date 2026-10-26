/**
 * hand.ts
 * Cartoon hand SVG. 0 = fist (shaking), 1–5 = that many fingers, 6 = thumbs up.
 */

const INK = 'var(--ink)';
const SKIN = 'var(--skin)';
const SKIN_DARK = 'var(--skin-dark)';

// index, middle, ring, pinky
const FINGERS = [
  { x: 25, top: 20 },
  { x: 43, top: 10 },
  { x: 61, top: 16 },
  { x: 79, top: 32 },
];

export function handSvg(n: number, sleeve = 'var(--p1)'): string {
  const raised = n >= 1 && n <= 5 ? Math.min(n, 4) : 0;
  const thumbUp = n === 5 || n === 6;
  const parts: string[] = [];

  // Raised fingers sit behind the palm.
  FINGERS.forEach((f, i) => {
    if (i < raised) {
      parts.push(
        `<rect x="${f.x}" y="${f.top}" width="17" height="${96 - f.top}" rx="8.5" fill="${SKIN}" stroke="${INK}" stroke-width="4"/>`,
        `<rect x="${f.x + 4}" y="${f.top + 4}" width="9" height="8" rx="4" fill="#fff" opacity=".55"/>`,
      );
    }
  });

  // Raised thumb, behind palm on the left.
  if (thumbUp) {
    const tall = n === 6;
    parts.push(
      `<rect x="2" y="${tall ? 30 : 56}" width="19" height="${tall ? 80 : 54}" rx="9.5" fill="${SKIN}" stroke="${INK}" stroke-width="4" transform="rotate(${tall ? -4 : -22} 12 104)"/>`,
    );
  }

  // Palm
  parts.push(`<rect x="18" y="68" width="82" height="64" rx="22" fill="${SKIN}" stroke="${INK}" stroke-width="4"/>`);

  // Folded fingers = knuckles on top of the palm.
  FINGERS.forEach((f, i) => {
    if (i >= raised) {
      parts.push(`<rect x="${f.x}" y="62" width="17" height="30" rx="8.5" fill="${SKIN}" stroke="${INK}" stroke-width="4"/>`);
      parts.push(`<path d="M${f.x + 4} 82 h9" stroke="${SKIN_DARK}" stroke-width="3" stroke-linecap="round"/>`);
    }
  });

  // Folded thumb across the palm.
  if (!thumbUp) {
    parts.push(`<rect x="14" y="96" width="50" height="19" rx="9.5" fill="${SKIN}" stroke="${INK}" stroke-width="4"/>`);
  }

  // Sleeve cuff
  parts.push(
    `<rect x="24" y="128" width="70" height="32" rx="6" fill="${sleeve}" stroke="${INK}" stroke-width="4"/>`,
    `<path d="M30 140 h58" stroke="${INK}" stroke-width="3" opacity=".25"/>`,
  );

  return `<svg viewBox="-14 0 134 164" class="hand-svg" aria-hidden="true">${parts.join('')}</svg>`;
}
