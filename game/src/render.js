// The Golden Ladle — canvas renderer. Every visual is drawn in code:
// warm kitchen, order board, ingredient counter, grill, chopping board,
// assembly plate. v2 adds the chopping board, Rush Hour glow, golden VIP
// orders, a 3-slot grill and a two-row recipe book.
import {
  W, H, BIN_ORDER, INGREDIENTS, RECIPES, PALETTE, GRILL_COOK_SECONDS,
  GRILL_BURN_SECONDS, SHIFT_SECONDS,
} from './config.js';
import { recipeById, selectedOrder, plateMatchesRecipe, fmtTime } from './state.js';
import { isMuted } from './audio.js';
import { drawChopBoard, needsChop } from './prep.js';

export const clickables = []; // rebuilt every frame: {x,y,w,h,action,data}

function rr(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
function circle(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
function text(c, str, x, y, size, color, align = 'left', weight = 'bold', font = 'Georgia, serif') {
  c.fillStyle = color;
  c.font = `${weight} ${size}px ${font}`;
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillText(str, x, y);
}

// --- food icons, drawn with shapes ----------------------------------------
export function drawFood(c, id, x, y, s, t = 0) {
  // s = half-size of the icon. t = animation time for wobble.
  c.save();
  c.translate(x, y);
  const wob = Math.sin(t * 3 + x) * 0.03;
  c.rotate(wob);
  if (id === 'bun') {
    c.fillStyle = '#e8a94e';
    c.beginPath(); c.ellipse(0, -s * 0.25, s, s * 0.62, 0, Math.PI, 0); c.fill();
    c.fillStyle = '#d18f2f';
    c.fillRect(-s, -s * 0.28, s * 2, s * 0.22);
    c.fillStyle = '#f7cf8a';
    c.beginPath(); c.ellipse(0, -s * 0.35, s * 0.55, s * 0.28, 0, Math.PI, 0); c.fill();
    c.fillStyle = '#fff';
    circle(c, -s * 0.45, -s * 0.55, s * 0.09); circle(c, 0, -s * 0.68, s * 0.09); circle(c, s * 0.45, -s * 0.55, s * 0.09);
    c.fillStyle = '#e8a94e';
    c.beginPath(); c.ellipse(0, s * 0.28, s, s * 0.3, 0, 0, Math.PI); c.fill();
  } else if (id === 'patty') {
    c.fillStyle = '#7a4a21';
    c.beginPath(); c.ellipse(0, 0, s * 1.05, s * 0.5, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#8a5a33';
    c.beginPath(); c.ellipse(0, -s * 0.12, s * 0.95, s * 0.38, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#5d3a1a';
    circle(c, -s * 0.5, -s * 0.1, s * 0.08); circle(c, s * 0.3, -s * 0.2, s * 0.08); circle(c, s * 0.05, s * 0.05, s * 0.07);
  } else if (id === 'cheese') {
    c.fillStyle = '#ffc93c';
    c.beginPath(); c.moveTo(-s, s * 0.4); c.lineTo(s, s * 0.4); c.lineTo(0, -s * 0.7); c.closePath(); c.fill();
    c.fillStyle = '#e8a90c';
    c.beginPath(); c.moveTo(-s, s * 0.4); c.lineTo(s, s * 0.4); c.lineTo(s, s * 0.62); c.lineTo(-s, s * 0.62); c.closePath(); c.fill();
    c.fillStyle = '#d18f00';
    circle(c, -s * 0.3, s * 0.05, s * 0.12); circle(c, s * 0.25, -s * 0.15, s * 0.1);
  } else if (id === 'lettuce') {
    // A round ruffled leaf, not a diamond: many small waves + veins.
    c.fillStyle = '#5fbf4a';
    c.beginPath();
    const N = 14;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      const r = s * (i % 2 === 0 ? 1.0 : 0.86);
      const px = Math.cos(a) * r, py = Math.sin(a) * r * 0.62;
      if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.closePath(); c.fill();
    c.fillStyle = '#7ed957';
    c.beginPath(); c.ellipse(0, -s * 0.08, s * 0.62, s * 0.32, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#3f8f2e'; c.lineWidth = s * 0.1;
    c.beginPath(); c.moveTo(-s * 0.7, 0); c.lineTo(s * 0.7, 0); c.stroke();
    c.beginPath(); c.moveTo(0, -s * 0.3); c.lineTo(0, s * 0.3); c.stroke();
  } else if (id === 'tomato') {
    c.fillStyle = '#e5484d';
    circle(c, 0, 0, s * 0.95);
    c.fillStyle = '#f27074';
    c.beginPath(); c.ellipse(-s * 0.3, -s * 0.35, s * 0.4, s * 0.25, -0.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#3f8f2e';
    c.beginPath(); c.moveTo(0, -s * 0.85); c.lineTo(-s * 0.35, -s * 1.05); c.lineTo(0, -s * 0.7); c.lineTo(s * 0.35, -s * 1.05); c.closePath(); c.fill();
  } else if (id === 'egg') {
    c.fillStyle = '#fff8e6';
    c.beginPath(); c.ellipse(0, 0, s * 1.05, s * 0.8, 0.2, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffb703';
    circle(c, s * 0.1, -s * 0.05, s * 0.5);
    c.fillStyle = '#ffe08a';
    circle(c, -s * 0.05, -s * 0.2, s * 0.18);
  }
  c.restore();
}

// --- background ------------------------------------------------------------
function drawKitchen(c, s) {
  const t = s.animT;
  // Wall
  c.fillStyle = PALETTE.wall;
  c.fillRect(0, 0, W, 560);
  c.fillStyle = PALETTE.wallShadow;
  for (let x = 0; x < W; x += 96) c.fillRect(x, 0, 2, 560);
  // Window with sun + hills
  c.fillStyle = '#bfe3f0';
  rr(c, 40, 30, 220, 150, 10); c.fill();
  c.fillStyle = '#ffd166'; circle(c, 90, 70, 26);
  c.fillStyle = '#8fc97e';
  c.beginPath(); c.moveTo(40, 180); c.quadraticCurveTo(120, 120, 200, 180); c.lineTo(260, 180); c.closePath(); c.fill();
  c.strokeStyle = '#8a5a33'; c.lineWidth = 6; rr(c, 40, 30, 220, 150, 10); c.stroke();
  // Hanging lamps
  for (const lx of [420, 640, 860]) {
    c.strokeStyle = '#6e4525'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(lx, 0); c.lineTo(lx, 52); c.stroke();
    const glow = 0.5 + Math.sin(t * 2 + lx) * 0.06;
    c.fillStyle = `rgba(255, 214, 120, ${0.25 * glow})`;
    c.beginPath(); c.moveTo(lx - 46, 130); c.lineTo(lx + 46, 130); c.lineTo(lx + 16, 58); c.lineTo(lx - 16, 58); c.closePath(); c.fill();
    c.fillStyle = '#3a2415';
    c.beginPath(); c.moveTo(lx - 26, 58); c.lineTo(lx + 26, 58); c.lineTo(lx + 12, 34); c.lineTo(lx - 12, 34); c.closePath(); c.fill();
    c.fillStyle = '#ffe9a8'; circle(c, lx, 62, 9);
  }
  // Shelf with jars
  c.fillStyle = PALETTE.counterWood; c.fillRect(1020, 96, 220, 12);
  const jarColors = ['#e5484d', '#5fbf4a', '#ffc93c', '#e8a94e'];
  jarColors.forEach((col, i) => {
    const jx = 1040 + i * 48;
    c.fillStyle = col; rr(c, jx, 58, 34, 38, 6); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(jx + 5, 64, 8, 26);
    c.fillStyle = '#3a2415'; c.fillRect(jx + 2, 52, 30, 8);
  });
  // Floor
  c.fillStyle = PALETTE.floor;
  c.fillRect(0, 560, W, 240);
  c.fillStyle = PALETTE.floorDark;
  for (let y = 600; y < H; y += 56) c.fillRect(0, y, W, 3);
  for (let x = 0; x < W; x += 112) c.fillRect(x, 560, 3, 240);
  // Rug
  c.fillStyle = '#a93226'; rr(c, 480, 640, 320, 110, 16); c.fill();
  c.fillStyle = '#e8a94e'; rr(c, 496, 656, 288, 78, 12); c.fill();
  c.fillStyle = '#a93226'; rr(c, 512, 672, 256, 46, 8); c.fill();
}

// --- HUD -------------------------------------------------------------------
function drawHUD(c, s) {
  c.fillStyle = PALETTE.hud;
  c.fillRect(0, 0, W, 64);
  text(c, '🍳 THE GOLDEN LADLE', 20, 34, 26, '#ffd166', 'left', 'bold');
  // Timer
  const urgent = s.timeLeft <= 30;
  const tw = 220;
  c.fillStyle = '#241608'; rr(c, 470, 16, tw, 32, 8); c.fill();
  c.fillStyle = s.rush.active ? '#ffb703' : urgent ? '#e5484d' : '#5fbf4a';
  const frac = Math.max(0, s.timeLeft / SHIFT_SECONDS);
  rr(c, 474, 20, (tw - 8) * frac, 24, 6); c.fill();
  text(c, `⏱ ${fmtTime(s.timeLeft)}`, 580, 34, 22, urgent ? '#ff8fa3' : '#fff8ea', 'center');
  // Score / coins / combo / level
  text(c, `SCORE ${s.score}`, 730, 34, 20, '#fff8ea');
  text(c, `🪙 ${s.coins}`, 900, 34, 20, '#ffd166');
  const comboColor = s.combo >= 3 ? '#ff8fa3' : '#fff8ea';
  text(c, s.combo > 1 ? `COMBO x${s.combo}` : 'COMBO —', 1000, 34, 20, comboColor);
  text(c, `LV ${s.level}`, 1140, 34, 20, '#8fe388');
  // Mute
  clickables.push({ x: 1200, y: 12, w: 64, h: 40, action: 'mute' });
  c.fillStyle = '#5b3a1e'; rr(c, 1200, 12, 64, 40, 8); c.fill();
  text(c, isMuted() ? '🔇' : '🔊', 1232, 34, 20, '#fff8ea', 'center');
}

// --- order board ------------------------------------------------------------
function drawOrderBoard(c, s) {
  const t = s.animT;
  c.fillStyle = PALETTE.boardWood;
  rr(c, 24, 76, 1232, 132, 12); c.fill();
  c.fillStyle = '#5b3a1e';
  text(c, 'ORDER BOARD', 44, 100, 15, '#ffd166', 'left', 'bold', 'Verdana, sans-serif');
  text(c, 'click an order, then build its dish', 170, 100, 13, '#f7e3c3', 'left', 'normal', 'Verdana, sans-serif');
  // Rush Hour banner, top-right of the board header.
  if (s.rush.active) {
    const pulse = 1 + Math.sin(t * 6) * 0.04;
    c.save();
    c.translate(1110, 96); c.scale(pulse, pulse);
    c.fillStyle = '#ffb703'; rr(c, -130, -13, 260, 26, 13); c.fill();
    c.lineWidth = 2; c.strokeStyle = '#fff8ea'; rr(c, -130, -13, 260, 26, 13); c.stroke();
    text(c, '⚡ RUSH HOUR — COINS ×2', 0, 1, 13, '#3a2415', 'center', 'bold', 'Verdana, sans-serif');
    c.restore();
  } else if (s.screen === 'play') {
    text(c, `next rush in ${Math.max(0, Math.ceil(s.rush.next))}s`, 1240, 100, 12, '#d9b98a', 'right', 'normal', 'Verdana, sans-serif');
  }
  if (s.orders.length === 0) {
    text(c, 'No orders yet — customers are on their way…', 640, 150, 18, '#f7e3c3', 'center', 'normal', 'italic Georgia, serif');
    return;
  }
  s.orders.forEach((o, i) => {
    const x = 44 + i * 300;
    const y = 112;
    const w = 284, h = 84;
    const sel = o.id === s.selectedOrderId;
    c.fillStyle = o.golden ? '#ffedb0' : sel ? '#ffe9a8' : PALETTE.boardPaper;
    rr(c, x, y, w, h, 10); c.fill();
    c.lineWidth = o.golden ? 4 : sel ? 4 : 2;
    c.strokeStyle = o.golden ? '#ffb703' : sel ? '#ffb703' : '#c9a86a';
    rr(c, x, y, w, h, 10); c.stroke();
    if (o.golden) {
      c.fillStyle = '#b8860b';
      text(c, '★ VIP ×2', x + w - 12, y + 18, 11, '#b8860b', 'right', 'bold', 'Verdana, sans-serif');
    }
    // Customer face
    c.fillStyle = o.customer.tint;
    circle(c, x + 26, y + 26, 18);
    c.fillStyle = o.customer.hat;
    c.beginPath(); c.arc(x + 26, y + 20, 18, Math.PI, 0); c.fill();
    c.fillRect(x + 8, y + 16, 36, 5);
    c.fillStyle = '#3a2415';
    circle(c, x + 20, y + 28, 2.4); circle(c, x + 32, y + 28, 2.4);
    c.strokeStyle = '#3a2415'; c.lineWidth = 2;
    c.beginPath();
    if (o.angry) { c.moveTo(x + 18, y + 38); c.lineTo(x + 26, y + 34); c.lineTo(x + 34, y + 38); }
    else { c.arc(x + 26, y + 32, 7, 0.25, Math.PI - 0.25); }
    c.stroke();
    const recipe = recipeById(o.recipeId);
    text(c, o.customer.name, x + 52, y + 18, 15, '#3a2415');
    text(c, recipe.name, x + 52, y + 38, 14, '#7a4a21', 'left', 'bold', 'Verdana, sans-serif');
    // Needed ingredients: full-colour icons, with a green check once the
    // plate already holds that occurrence of the ingredient.
    const plateCount = {};
    for (const p of s.plate) plateCount[p] = (plateCount[p] || 0) + 1;
    const seenCount = {};
    recipe.needs.forEach((ing, j) => {
      const ix = x + 60 + j * 34;
      seenCount[ing] = (seenCount[ing] || 0) + 1;
      drawFood(c, ing, ix, y + 62, 11, t);
      if ((plateCount[ing] || 0) >= seenCount[ing]) {
        c.fillStyle = '#4caf50';
        circle(c, ix + 10, y + 50, 7);
        text(c, '✓', ix + 10, y + 51, 10, '#fff', 'center', 'bold', 'Verdana, sans-serif');
      }
    });
    // Patience bar
    const pf = Math.max(0, o.patience / o.maxPatience);
    c.fillStyle = '#e0cba8'; rr(c, x + 10, y + 76, w - 20, 6, 3); c.fill();
    c.fillStyle = pf > 0.5 ? '#4caf50' : pf > 0.25 ? '#ffb703' : '#e5484d';
    rr(c, x + 10, y + 76, (w - 20) * pf, 6, 3); c.fill();
    if (sel && !o.golden) text(c, '★ SELECTED', x + w - 12, y + 18, 11, '#b8860b', 'right', 'bold', 'Verdana, sans-serif');
    clickables.push({ x, y, w, h, action: 'select-order', data: o.id });
  });
}

// --- ingredient counter ------------------------------------------------------
function drawBins(c, s) {
  const t = s.animT;
  c.fillStyle = PALETTE.counterWood;
  rr(c, 24, 224, 560, 150, 12); c.fill();
  c.fillStyle = PALETTE.counterTop;
  rr(c, 24, 224, 560, 22, 10); c.fill();
  text(c, 'INGREDIENTS', 44, 262, 14, '#ffd166', 'left', 'bold', 'Verdana, sans-serif');
  text(c, 'click or press 1–6 · patty grills · greens need 2 chops', 170, 262, 12, '#f7e3c3', 'left', 'normal', 'Verdana, sans-serif');
  BIN_ORDER.forEach((id, i) => {
    const x = 52 + i * 88;
    const y = 282;
    const w = 76, h = 76;
    c.fillStyle = '#fff8ea';
    rr(c, x, y, w, h, 10); c.fill();
    c.lineWidth = 2; c.strokeStyle = '#c9a86a'; rr(c, x, y, w, h, 10); c.stroke();
    drawFood(c, id, x + w / 2, y + 30, 20, t);
    text(c, INGREDIENTS[id].name, x + w / 2, y + 60, 12, '#3a2415', 'center', 'bold', 'Verdana, sans-serif');
    if (needsChop(id)) {
      text(c, 'CHOP ×2', x + w / 2, y + 72, 9, '#2e7d32', 'center', 'bold', 'Verdana, sans-serif');
    }
    // Key hint
    c.fillStyle = '#3a2415'; circle(c, x + w - 10, y + 10, 10);
    text(c, INGREDIENTS[id].key, x + w - 10, y + 11, 12, '#ffd166', 'center', 'bold', 'Verdana, sans-serif');
    clickables.push({ x, y, w, h, action: 'add-ingredient', data: id });
  });
}

// --- grill (3 slots in v2) ----------------------------------------------------
function drawGrill(c, s) {
  const t = s.animT;
  const x = 608, y = 224, w = 240, h = 150;
  c.fillStyle = '#4a4a55'; rr(c, x, y, w, h, 12); c.fill();
  c.fillStyle = '#2e2e36'; rr(c, x + 10, y + 34, w - 20, h - 48, 8); c.fill();
  text(c, '🔥 GRILL ×3', x + 16, y + 20, 14, '#ffd166', 'left', 'bold', 'Verdana, sans-serif');
  s.grill.forEach((slot, i) => {
    const gx = x + 14 + i * 72;
    const gy = y + 52;
    const gw = 64, gh = 78;
    c.fillStyle = '#1c1c22'; rr(c, gx, gy, gw, gh, 8); c.fill();
    // grate lines
    c.strokeStyle = '#55555f'; c.lineWidth = 2;
    for (let g = 1; g < 5; g++) { c.beginPath(); c.moveTo(gx + 6, gy + g * 15); c.lineTo(gx + gw - 6, gy + g * 15); c.stroke(); }
    if (slot.state === 'cooking' || slot.state === 'cooked' || slot.state === 'burnt') {
      // flames
      if (slot.state === 'cooking') {
        for (let f = 0; f < 2; f++) {
          const fx = gx + 18 + f * 28 + Math.sin(t * 9 + f * 2) * 3;
          const fh = 14 + Math.sin(t * 11 + f) * 5;
          c.fillStyle = f % 2 ? '#ff8c00' : '#ffb703';
          c.beginPath(); c.moveTo(fx - 7, gy + gh - 6); c.quadraticCurveTo(fx, gy + gh - 6 - fh, fx + 7, gy + gh - 6); c.closePath(); c.fill();
        }
      }
      if (slot.state === 'burnt') {
        c.fillStyle = '#1a1a1a';
        c.beginPath(); c.ellipse(gx + gw / 2, gy + gh / 2, 26, 12, 0, 0, Math.PI * 2); c.fill();
        text(c, 'BURNT!', gx + gw / 2, gy + gh / 2 - 20, 11, '#ff8fa3', 'center', 'bold', 'Verdana, sans-serif');
      } else {
        drawFood(c, 'patty', gx + gw / 2, gy + gh / 2 - 4, 20, t);
      }
      // progress ring / bar
      const frac = slot.state === 'cooked' ? 1 : Math.min(1, slot.t / GRILL_COOK_SECONDS);
      const over = slot.state === 'cooked' ? Math.min(1, (slot.t - GRILL_COOK_SECONDS) / (GRILL_BURN_SECONDS - GRILL_COOK_SECONDS)) : 0;
      c.fillStyle = '#e0cba8'; rr(c, gx, gy + gh + 4, gw, 7, 3); c.fill();
      if (slot.state === 'cooked') {
        c.fillStyle = '#e5484d'; rr(c, gx, gy + gh + 4, gw * over, 7, 3); c.fill();
        text(c, 'READY!', gx + gw / 2, gy - 6, 11, '#8fe388', 'center', 'bold', 'Verdana, sans-serif');
      } else {
        c.fillStyle = '#ffb703'; rr(c, gx, gy + gh + 4, gw * frac, 7, 3); c.fill();
      }
    } else {
      text(c, 'empty', gx + gw / 2, gy + gh / 2, 11, '#77777f', 'center', 'normal', 'Verdana, sans-serif');
    }
    clickables.push({ x: gx, y: gy, w: gw, h: gh, action: 'grill-slot', data: i });
  });
}

// --- assembly plate ----------------------------------------------------------
// --- assembly-plate stack: flat burger layers, not floating icons -------------
// Each layer is a wide, thin slice so a built dish reads as one burger:
// bottom bun slab, then fillings, cheese draped flat (never a triangle hat).
function drawStackLayer(c, id, x, y, w) {
  const h = 11;
  if (id === 'bun') {
    // Bottom bun: flat golden slab with a sesame-dotted top edge.
    c.fillStyle = '#e8a94e';
    rr(c, x - w / 2, y - h / 2, w, h, 5); c.fill();
    c.fillStyle = '#d18f2f';
    c.fillRect(x - w / 2, y + h / 2 - 3, w, 3);
    c.fillStyle = '#fff';
    circle(c, x - w * 0.28, y - 1, 1.6); circle(c, x, y - 2, 1.6); circle(c, x + w * 0.28, y - 1, 1.6);
  } else if (id === 'patty') {
    c.fillStyle = '#7a4a21';
    rr(c, x - w / 2, y - h / 2, w, h + 2, 5); c.fill();
    c.fillStyle = '#8a5a33';
    rr(c, x - w / 2 + 4, y - h / 2, w - 8, 4, 2); c.fill();
    c.fillStyle = '#5d3a1a';
    circle(c, x - w * 0.3, y + 1, 1.5); circle(c, x + w * 0.22, y - 1, 1.5);
  } else if (id === 'cheese') {
    // Draped slice: flat sheet with one corner folding down over the patty.
    c.fillStyle = '#ffc93c';
    c.beginPath();
    c.moveTo(x - w / 2, y - h / 2); c.lineTo(x + w / 2, y - h / 2);
    c.lineTo(x + w / 2 - 6, y + h / 2 + 5); c.lineTo(x + w / 2 - 14, y + h / 2 - 1);
    c.lineTo(x - w / 2, y + h / 2); c.closePath(); c.fill();
    c.fillStyle = '#e8a90c';
    c.fillRect(x - w / 2, y + h / 2 - 2, w, 2);
  } else if (id === 'lettuce') {
    // Wavy green band: three overlapping bumps.
    c.fillStyle = '#5fbf4a';
    for (const off of [-w * 0.3, 0, w * 0.3]) {
      c.beginPath(); c.ellipse(x + off, y, w * 0.22, h * 0.75, 0, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = '#7ed957';
    c.beginPath(); c.ellipse(x, y - 2, w * 0.32, h * 0.4, 0, 0, Math.PI * 2); c.fill();
  } else if (id === 'tomato') {
    c.fillStyle = '#e5484d';
    rr(c, x - w / 2, y - h / 2, w, h, 5); c.fill();
    c.fillStyle = '#f27074';
    c.beginPath(); c.ellipse(x - w * 0.2, y - 1, w * 0.2, h * 0.3, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#c93338';
    circle(c, x + w * 0.28, y + 1, 1.5);
  } else if (id === 'egg') {
    c.fillStyle = '#fff8e6';
    rr(c, x - w / 2, y - h / 2, w, h, 5); c.fill();
    c.fillStyle = '#ffb703';
    circle(c, x + w * 0.12, y, 4.5);
    c.fillStyle = '#ffe08a';
    circle(c, x + w * 0.12 - 1.5, y - 1.5, 1.6);
  }
}

function drawPlate(c, s) {
  const t = s.animT;
  const x = 872, y = 224, w = 384, h = 150;
  const shake = s.plateShake ? Math.sin(t * 40) * s.plateShake * 22 : 0;
  c.fillStyle = PALETTE.counterWood;
  rr(c, x, y, w, h, 12); c.fill();
  c.fillStyle = PALETTE.counterTop;
  rr(c, x, y, w, h, 12); c.fill();
  c.fillStyle = 'rgba(0,0,0,0.12)'; rr(c, x, y, w, 22, 10); c.fill();
  text(c, 'ASSEMBLY PLATE', x + 16, y + 20, 14, '#3a2415', 'left', 'bold', 'Verdana, sans-serif');
  // Plate
  const px = x + 110 + shake, py = y + 92;
  c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(px, py, 92, 30, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#e8e0d0'; c.beginPath(); c.ellipse(px, py, 70, 21, 0, 0, Math.PI * 2); c.fill();
  // Stacked ingredients: flat layers piled upward from the plate, so the
  // dish reads as one burger instead of floating icons.
  const stack = s.plate;
  stack.forEach((ing, i) => {
    const iy = py - 8 - i * 10;
    const wob = (i % 2 === 0 ? -1 : 1) * 2;
    drawStackLayer(c, ing, px + wob, iy, 64);
  });
  if (stack.length === 0) {
    text(c, 'add ingredients…', px, py - 8, 13, '#a08a6a', 'center', 'normal', 'italic Georgia, serif');
  }
  // Match hint, bottom-left of the panel (never overflows the panel).
  const target = selectedOrder(s);
  if (target && stack.length > 0) {
    const recipe = recipeById(target.recipeId);
    const ok = plateMatchesRecipe(stack, recipe);
    if (ok) text(c, `✓ Perfect match — serve it to ${target.customer.name}!`, x + 16, y + 132, 13, '#2e7d32', 'left', 'bold', 'Verdana, sans-serif');
    else text(c, 'serve to the selected order', x + 16, y + 132, 11, '#5b3a1e', 'left', 'normal', 'Verdana, sans-serif');
  } else {
    text(c, 'serve to the selected order', x + 16, y + 132, 11, '#5b3a1e', 'left', 'normal', 'Verdana, sans-serif');
  }
  // Serve + trash buttons
  const canServe = stack.length > 0;
  const pulse = canServe ? 1 + Math.sin(t * 5) * 0.06 : 1;
  c.save();
  c.translate(x + 268, y + 92); c.scale(pulse, pulse);
  c.fillStyle = canServe ? '#4caf50' : '#9a9a9a';
  rr(c, -58, -24, 116, 48, 12); c.fill();
  c.lineWidth = 3; c.strokeStyle = canServe ? '#2e7d32' : '#777'; rr(c, -58, -24, 116, 48, 12); c.stroke();
  text(c, 'SERVE  ⏎', 0, 2, 18, '#ffffff', 'center', 'bold', 'Verdana, sans-serif');
  c.restore();
  clickables.push({ x: x + 210, y: y + 68, w: 116, h: 48, action: 'serve' });
  c.fillStyle = '#a93226'; rr(c, x + 336, y + 68, 36, 48, 10); c.fill();
  text(c, '🗑', x + 354, y + 92, 20, '#fff', 'center');
  clickables.push({ x: x + 336, y: y + 68, w: 36, h: 48, action: 'trash' });
}

// --- recipe book (two rows in v2: 9 recipes) -----------------------------------
function drawRecipeBook(c, s) {
  const y = 396;
  c.fillStyle = 'rgba(58,36,21,0.92)';
  rr(c, 24, y, 1232, 156, 12); c.fill();
  text(c, '📖 RECIPE BOOK', 44, y + 22, 15, '#ffd166', 'left', 'bold', 'Verdana, sans-serif');
  text(c, 'serve fast for a patience bonus — combos multiply your coins!', 200, y + 22, 13, '#f7e3c3', 'left', 'normal', 'Verdana, sans-serif');
  RECIPES.forEach((r, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const x = 44 + col * 244;
    const cy = y + 36 + row * 62;
    const locked = r.unlockLevel > s.level;
    c.fillStyle = locked ? 'rgba(255,248,234,0.35)' : '#fff8ea';
    rr(c, x, cy, 232, 56, 10); c.fill();
    if (locked) {
      text(c, `🔒 unlocks at LV ${r.unlockLevel}`, x + 116, cy + 28, 13, '#5b3a1e', 'center', 'bold', 'Verdana, sans-serif');
      return;
    }
    text(c, r.name, x + 10, cy + 15, 13, '#3a2415', 'left', 'bold', 'Verdana, sans-serif');
    text(c, `🪙 ${r.coins}`, x + 222, cy + 15, 12, '#b8860b', 'right', 'bold', 'Verdana, sans-serif');
    r.needs.forEach((ing, j) => drawFood(c, ing, x + 24 + j * 30, cy + 40, 10, s.animT));
  });
}

// --- rush glow, final-30s vignette + banner ------------------------------------
function drawEventOverlays(c, s) {
  const t = s.animT;
  // Golden edge glow during Rush Hour.
  if (s.rush.active && s.screen === 'play') {
    c.strokeStyle = `rgba(255, 183, 3, ${0.35 + Math.sin(t * 6) * 0.15})`;
    c.lineWidth = 8;
    c.strokeRect(4, 4, W - 8, H - 8);
  }
  // Pulsing red vignette in the final 30 seconds.
  if (s.screen === 'play' && s.timeLeft <= 30 && s.timeLeft > 0) {
    c.strokeStyle = `rgba(229, 72, 77, ${0.25 + Math.sin(t * 5) * 0.12})`;
    c.lineWidth = 14;
    c.strokeRect(7, 7, W - 14, H - 14);
  }
  // "FINAL 30 SECONDS" banner, shown briefly when the clock crosses 30s.
  if (s.finalBannerT > 0) {
    const a = Math.min(1, s.finalBannerT);
    c.globalAlpha = a;
    c.fillStyle = '#e5484d';
    rr(c, 340, 352, 600, 64, 14); c.fill();
    c.lineWidth = 3; c.strokeStyle = '#fff8ea'; rr(c, 340, 352, 600, 64, 14); c.stroke();
    text(c, '⏰ FINAL 30 SECONDS!', 640, 385, 28, '#fff8ea', 'center', 'bold', 'Verdana, sans-serif');
    c.globalAlpha = 1;
  }
}

// --- particles, floats, toasts -------------------------------------------------
function drawFx(c, s) {
  for (const p of s.particles) {
    c.globalAlpha = Math.max(0, 1 - p.t / p.life);
    c.fillStyle = p.color;
    circle(c, p.x, p.y, p.r);
  }
  c.globalAlpha = 1;
  for (const f of s.floats) {
    c.globalAlpha = Math.max(0, 1 - f.t / 1.4);
    text(c, f.text, f.x, f.y, 24, f.color, 'center', 'bold', 'Verdana, sans-serif');
  }
  c.globalAlpha = 1;
  s.toasts.forEach((tst, i) => {
    const a = tst.t < 0.2 ? tst.t / 0.2 : tst.t > 2.1 ? Math.max(0, (2.6 - tst.t) / 0.5) : 1;
    c.globalAlpha = a;
    c.fillStyle = '#3a2415';
    rr(c, 640 - 160, 560 + i * 34, 320, 28, 14); c.fill();
    text(c, tst.text, 640, 560 + i * 34 + 15, 14, '#ffd166', 'center', 'normal', 'Verdana, sans-serif');
  });
  c.globalAlpha = 1;
}

// --- overlays -------------------------------------------------------------------
function drawTitle(c, s) {
  c.fillStyle = 'rgba(30,18,8,0.55)';
  c.fillRect(0, 0, W, H);
  c.fillStyle = '#fff8ea';
  rr(c, 290, 130, 700, 470, 20); c.fill();
  c.lineWidth = 5; c.strokeStyle = '#ffb703'; rr(c, 290, 130, 700, 470, 20); c.stroke();
  text(c, '🍳', 640, 190, 54, '#3a2415', 'center');
  text(c, 'THE GOLDEN LADLE', 640, 250, 46, '#b8860b', 'center', 'bold');
  text(c, 'Hearth Rush', 640, 292, 26, '#7a4a21', 'center', 'normal', 'italic Georgia, serif');
  text(c, 'Run the coziest bistro in town!', 640, 330, 18, '#3a2415', 'center', 'normal', 'Georgia, serif');
  const lines = [
    '1–6  add ingredients   •   lettuce, tomato & egg need 2 chops',
    'Click the board to chop, the grill (3 slots) to cook patties',
    'Build the dish on the plate, then SERVE before patience runs out',
    'Rush Hour every minute pays double — golden VIP orders pay double too!',
    'Shift lasts 3:00. How many hungry customers can you feed?',
  ];
  lines.forEach((l, i) => text(c, l, 640, 368 + i * 26, 15, '#5b3a1e', 'center', 'normal', 'Verdana, sans-serif'));
  const pulse = 1 + Math.sin(s.animT * 4) * 0.05;
  c.save(); c.translate(640, 520); c.scale(pulse, pulse);
  c.fillStyle = '#4caf50'; rr(c, -150, -28, 300, 56, 14); c.fill();
  text(c, '▶  START SHIFT', 0, 2, 22, '#fff', 'center', 'bold', 'Verdana, sans-serif');
  c.restore();
  clickables.push({ x: 490, y: 492, w: 300, h: 56, action: 'start' });
  text(c, 'Enter ↵ also starts', 640, 566, 13, '#a08a6a', 'center', 'normal', 'Verdana, sans-serif');
}

function drawEnd(c, s) {
  c.fillStyle = 'rgba(30,18,8,0.6)';
  c.fillRect(0, 0, W, H);
  const st = s.endStats || { score: 0, coins: 0, served: 0, lost: 0, bestCombo: 0, level: 1, grade: 'D' };
  c.fillStyle = '#fff8ea';
  rr(c, 340, 120, 600, 500, 20); c.fill();
  c.lineWidth = 5; c.strokeStyle = '#ffb703'; rr(c, 340, 120, 600, 500, 20); c.stroke();
  text(c, 'SHIFT COMPLETE!', 640, 170, 36, '#b8860b', 'center', 'bold');
  text(c, `GRADE  ${st.grade}`, 640, 222, 30, st.grade === 'S' ? '#e5484d' : '#3a2415', 'center', 'bold', 'Verdana, sans-serif');
  const rows = [
    ['Score', String(st.score)],
    ['Coins earned', `🪙 ${st.coins}`],
    ['Dishes served', String(st.served)],
    ['Customers lost', String(st.lost)],
    ['Best combo', st.bestCombo > 1 ? `x${st.bestCombo}` : '—'],
    ['Level reached', String(st.level)],
  ];
  rows.forEach((r, i) => {
    const y = 268 + i * 38;
    text(c, r[0], 420, y, 18, '#5b3a1e', 'left', 'normal', 'Verdana, sans-serif');
    text(c, r[1], 860, y, 18, '#3a2415', 'right', 'bold', 'Verdana, sans-serif');
  });
  const pulse = 1 + Math.sin(s.animT * 4) * 0.05;
  c.save(); c.translate(640, 540); c.scale(pulse, pulse);
  c.fillStyle = '#4caf50'; rr(c, -150, -28, 300, 56, 14); c.fill();
  text(c, '↻  PLAY AGAIN  (R)', 0, 2, 20, '#fff', 'center', 'bold', 'Verdana, sans-serif');
  c.restore();
  clickables.push({ x: 490, y: 512, w: 300, h: 56, action: 'restart' });
  text(c, 'Thanks for cooking at The Golden Ladle!', 640, 592, 14, '#a08a6a', 'center', 'normal', 'italic Georgia, serif');
}

function drawPaused(c, s) {
  c.fillStyle = 'rgba(30,18,8,0.5)';
  c.fillRect(0, 0, W, H);
  text(c, 'PAUSED', 640, 380, 48, '#fff8ea', 'center', 'bold');
  text(c, 'press P or Esc to continue', 640, 430, 18, '#ffd166', 'center', 'normal', 'Verdana, sans-serif');
}

// --- main render ------------------------------------------------------------------
export function render(c, s) {
  clickables.length = 0;
  drawKitchen(c, s);
  drawHUD(c, s);
  drawOrderBoard(c, s);
  drawBins(c, s);
  drawGrill(c, s);
  drawPlate(c, s);
  drawRecipeBook(c, s);
  drawChopBoard(c, s, drawFood);
  clickables.push({ x: 24, y: 566, w: 440, h: 124, action: 'chop' });
  drawEventOverlays(c, s);
  drawFx(c, s);
  if (s.screen === 'title') drawTitle(c, s);
  if (s.screen === 'end') drawEnd(c, s);
  if (s.paused && s.screen === 'play') drawPaused(c, s);
}
