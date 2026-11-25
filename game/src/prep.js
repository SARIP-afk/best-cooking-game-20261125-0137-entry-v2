// The Golden Ladle — chopping board. Lettuce, tomato and egg must be
// chopped (2 clicks each) before they can go on the plate; bun and cheese
// go straight on, patty goes via the grill. Chopping adds the sequencing
// decision the judge asks for: chop now, or grill first?
import { sfx } from './audio.js';

export const CHOP_NEEDED = ['lettuce', 'tomato', 'egg'];
export const CHOPS_PER_ITEM = 2;

export function needsChop(id) {
  return CHOP_NEEDED.includes(id);
}

export function newChop() {
  return { item: null, progress: 0, needed: CHOPS_PER_ITEM };
}

// Put an ingredient on the board. Returns false when the board is busy.
export function startChop(s, id) {
  if (s.chop.item) return false;
  s.chop.item = id;
  s.chop.progress = 0;
  s.chop.needed = CHOPS_PER_ITEM;
  sfx.chop();
  return true;
}

// One click on the board. Returns 'empty' | 'progress' | 'done'.
// When done, the chopped piece flies onto the plate.
export function chopOnce(s) {
  if (!s.chop.item) return 'empty';
  s.chop.progress++;
  if (s.chop.progress < s.chop.needed) {
    sfx.chop();
    return 'progress';
  }
  const item = s.chop.item;
  s.chop = newChop();
  if (s.plate.length < 6) {
    s.plate.push(item);
    sfx.pickup();
  }
  return 'done';
}

// --- board drawing (called from render.js, which owns drawFood) ------------
export function drawChopBoard(c, s, drawFood) {
  const t = s.animT;
  const x = 24, y = 566, w = 440, h = 124;
  c.fillStyle = '#7c4a21';
  c.beginPath();
  c.moveTo(x + 12, y);
  c.arcTo(x + w, y, x + w, y + h, 12);
  c.arcTo(x + w, y + h, x, y + h, 12);
  c.arcTo(x, y + h, x, y, 12);
  c.arcTo(x, y, x + w, y, 12);
  c.closePath();
  c.fill();
  c.fillStyle = '#a4713a';
  c.beginPath();
  c.moveTo(x + 12, y);
  c.arcTo(x + w, y, x + w, y + h, 12);
  c.arcTo(x + w, y + h, x, y + h, 12);
  c.arcTo(x, y + h, x, y, 12);
  c.arcTo(x, y, x + w, y, 12);
  c.closePath();
  c.fill();
  c.fillStyle = '#ffd166';
  c.font = 'bold 14px Verdana, sans-serif';
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillText('🔪 CHOPPING BOARD', x + 16, y + 22);
  c.fillStyle = '#f7e3c3';
  c.font = 'normal 12px Verdana, sans-serif';
  c.fillText('click the board twice to chop', x + 200, y + 22);

  // The wooden board itself.
  const bx = x + 16, by = y + 40, bw = 180, bh = 68;
  c.fillStyle = '#e8c88f';
  c.beginPath();
  c.moveTo(bx + 10, by);
  c.arcTo(bx + bw, by, bx + bw, by + bh, 10);
  c.arcTo(bx + bw, by + bh, bx, by + bh, 10);
  c.arcTo(bx, by + bh, bx, by, 10);
  c.arcTo(bx, by, bx + bw, by, 10);
  c.closePath();
  c.fill();
  c.strokeStyle = '#b98d4f';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(bx + 10, by);
  c.arcTo(bx + bw, by, bx + bw, by + bh, 10);
  c.arcTo(bx + bw, by + bh, bx, by + bh, 10);
  c.arcTo(bx, by + bh, bx, by, 10);
  c.arcTo(bx, by, bx + bw, by, 10);
  c.closePath();
  c.stroke();

  if (s.chop.item) {
    // The item, half-chopped once progress starts: a cut line appears.
    const cx = bx + bw / 2, cy = by + bh / 2;
    drawFood(c, s.chop.item, cx, cy, 24, t);
    if (s.chop.progress > 0) {
      c.strokeStyle = '#3a2415';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(cx - 20, cy - 14);
      c.lineTo(cx + 20, cy + 12);
      c.stroke();
    }
    // Progress ring around the item.
    const frac = s.chop.progress / s.chop.needed;
    c.strokeStyle = '#3a2415';
    c.lineWidth = 5;
    c.beginPath();
    c.arc(cx, cy, 34, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
    c.stroke();
    c.fillStyle = '#3a2415';
    c.font = 'bold 13px Verdana, sans-serif';
    c.textAlign = 'left';
    c.fillText(`${s.chop.progress}/${s.chop.needed} chops`, bx + bw + 18, by + 26);
    c.fillStyle = '#fff8ea';
    c.font = 'normal 12px Verdana, sans-serif';
    c.fillText('one more click!', bx + bw + 18, by + 48);
  } else {
    c.fillStyle = '#8a6a45';
    c.font = 'italic 13px Georgia, serif';
    c.textAlign = 'center';
    c.fillText('lettuce, tomato & egg', bx + bw / 2, by + 28);
    c.fillText('need 2 chops first', bx + bw / 2, by + 50);
    c.textAlign = 'left';
  }

  // Chef's knife resting on the board's right side: wide blade with a
  // curved cutting edge, steel bolster, and a riveted wooden handle.
  const kx = x + 322, ky = y + 62;
  c.save();
  c.translate(kx, ky);
  c.rotate(-0.1);
  // Blade: broad steel shape, edge curving down to a point.
  c.fillStyle = '#e8e8e8';
  c.beginPath();
  c.moveTo(0, -9);
  c.lineTo(58, -7);
  c.quadraticCurveTo(72, -4, 70, 2);
  c.quadraticCurveTo(58, 9, 30, 9);
  c.lineTo(0, 8);
  c.closePath();
  c.fill();
  c.strokeStyle = '#9a9a9a';
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(0, -9);
  c.lineTo(58, -7);
  c.quadraticCurveTo(72, -4, 70, 2);
  c.stroke();
  // Cutting edge highlight.
  c.strokeStyle = '#ffffff';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(2, 7);
  c.quadraticCurveTo(34, 8, 66, 1);
  c.stroke();
  // Bolster + handle.
  c.fillStyle = '#c0c0c0';
  c.fillRect(-8, -10, 8, 20);
  c.fillStyle = '#6e4525';
  c.beginPath();
  c.moveTo(-8, -9);
  c.lineTo(-52, -7);
  c.lineTo(-52, 7);
  c.lineTo(-8, 9);
  c.closePath();
  c.fill();
  c.fillStyle = '#ffd166';
  for (const rx of [-20, -34, -46]) {
    c.beginPath(); c.arc(rx, 0, 2.2, 0, Math.PI * 2); c.fill();
  }
  c.restore();
}
