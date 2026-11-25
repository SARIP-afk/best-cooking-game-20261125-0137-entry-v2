// The Golden Ladle — Hearth Rush v2. Main loop: boot, resize, animation frames.
import { W, H } from './config.js';
import { newState, update } from './state.js';
import { render } from './render.js';
import { attachInput } from './input.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') || 7);
const shot = params.get('shot') || null;

const state = newState(seed);
let shotMode = null;
if (shot) {
  shotMode = shot;
  applyShot(state, shot);
}

// Crisp rendering on hidpi displays.
function fitCanvas() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

attachInput(canvas, state, () => shotMode);

// Test / automation hook (harmless in play): window.__game exposes state.
window.__game = { state, shotMode };

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  // In shot mode the scene is frozen: render the staged frame, no updates.
  if (!shotMode) update(state, dt);
  else state.animT += dt;
  render(ctx, state);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
