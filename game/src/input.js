// The Golden Ladle — mouse + keyboard input.
import { clickables } from './render.js';
import {
  addIngredient, takeGrillPatty, trashPlate, servePlate, chopBoard,
  startGame, newState,
} from './state.js';
import { toggleMute, sfx } from './audio.js';
import { BIN_ORDER } from './config.js';

export function attachInput(canvas, s, getShotMode) {
  function toCanvas(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }
  function hit(p) {
    for (let i = clickables.length - 1; i >= 0; i--) {
      const b = clickables[i];
      if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return b;
    }
    return null;
  }
  function act(b) {
    if (!b) return;
    switch (b.action) {
      case 'start': startGame(s); break;
      case 'restart': Object.assign(s, newState(s.seed), { screen: 'title' }); break;
      case 'mute': toggleMute(); break;
      case 'select-order': s.selectedOrderId = b.data; sfx.click(); break;
      case 'add-ingredient': addIngredient(s, b.data); break;
      case 'chop': chopBoard(s); break;
      case 'grill-slot': takeGrillPatty(s, b.data); break;
      case 'serve': servePlate(s); break;
      case 'trash': trashPlate(s); break;
      default: break;
    }
  }
  canvas.addEventListener('click', (e) => {
    if (getShotMode()) return; // screenshots are staged, not interactive
    act(hit(toCanvas(e)));
  });
  canvas.addEventListener('mousemove', (e) => {
    const p = toCanvas(e);
    canvas.style.cursor = hit(p) ? 'pointer' : 'default';
  });
  window.addEventListener('keydown', (e) => {
    if (getShotMode()) return;
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    if (s.screen === 'title' && (k === 'enter' || k === ' ')) { startGame(s); e.preventDefault(); return; }
    if (s.screen === 'end' && k === 'r') { Object.assign(s, newState(s.seed), { screen: 'title' }); return; }
    if (s.screen !== 'play') return;
    if (k === 'p' || k === 'escape') { s.paused = !s.paused; sfx.click(); return; }
    if (s.paused) return;
    if (k === 'm') { toggleMute(); return; }
    if (k === ' ' || k === 'enter') { servePlate(s); e.preventDefault(); return; }
    if (k === 't') { trashPlate(s); return; }
    if (k === 'c') { chopBoard(s); return; }
    const idx = BIN_ORDER.findIndex((id, i) => String(i + 1) === k);
    if (idx >= 0) addIngredient(s, BIN_ORDER[idx]);
  });
}
