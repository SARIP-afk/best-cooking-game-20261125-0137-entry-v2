// The Golden Ladle — game state: orders, grill, plate, chopping, events,
// score, levels. v2: 3 grill slots, chopping board, Rush Hour, golden VIP.
import {
  CUSTOMERS, GRILL_BURN_SECONDS, GRILL_COOK_SECONDS, GRILL_SLOTS,
  LEVEL_SERVES, MAX_ORDERS, RECIPES, SHIFT_SECONDS, COMBO_MAX,
  patienceForLevel, spawnIntervalForLevel, unlockedRecipes, mulberry32,
} from './config.js';
import { needsChop, startChop, chopOnce, newChop } from './prep.js';
import { newEvents, tickRush, tickGolden, rushMultiplier } from './events.js';
import { sfx, setSizzle } from './audio.js';

let nextOrderId = 1;

export function newState(seed) {
  const ev = newEvents();
  return {
    screen: 'title', // title | play | end
    paused: false,
    seed: seed || 1,
    rng: mulberry32(seed || 1),
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    score: 0,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    lost: 0,
    level: 1,
    servedThisLevel: 0,
    orders: [],
    selectedOrderId: null,
    plate: [], // ingredient ids, bottom to top
    grill: Array.from({ length: GRILL_SLOTS }, () => ({ state: 'empty', t: 0 })),
    chop: newChop(),
    rush: ev.rush,
    goldenTimer: ev.goldenTimer,
    spawnTimer: 3,
    particles: [],
    floats: [], // floating score texts
    toasts: [],
    message: '',
    messageT: 0,
    finalBannerT: 0,
    finalBannerShown: false,
    stats: { wrongServes: 0, burnt: 0, chopped: 0, rushServes: 0, vipServes: 0 },
    endStats: null,
    animT: 0,
  };
}

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

function multisetOf(list) {
  const m = {};
  for (const x of list) m[x] = (m[x] || 0) + 1;
  return m;
}
export function plateMatchesRecipe(plate, recipe) {
  const a = multisetOf(plate);
  const b = multisetOf(recipe.needs);
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) if ((a[k] || 0) !== (b[k] || 0)) return false;
  return true;
}

export function spawnOrder(s, golden = false) {
  if (s.orders.length >= MAX_ORDERS) return false;
  const pool = unlockedRecipes(s.level);
  const recipe = pool[Math.floor(s.rng() * pool.length)];
  const customer = CUSTOMERS[Math.floor(s.rng() * CUSTOMERS.length)];
  const patience = patienceForLevel(s.level);
  const order = {
    id: nextOrderId++,
    recipeId: recipe.id,
    customer,
    patience,
    maxPatience: patience,
    bornAt: s.elapsed,
    angry: false,
    golden: !!golden,
  };
  s.orders.push(order);
  if (s.selectedOrderId === null) s.selectedOrderId = order.id;
  return true;
}

export function selectedOrder(s) {
  return s.orders.find((o) => o.id === s.selectedOrderId) || null;
}

// --- player actions -------------------------------------------------------
export function addIngredient(s, id) {
  if (s.screen !== 'play' || s.paused) return;
  if (id === 'patty') {
    const slot = s.grill.find((g) => g.state === 'empty');
    if (!slot) { toast(s, 'Grill is full!'); sfx.wrong(); return; }
    slot.state = 'cooking'; slot.t = 0;
    sfx.grill();
    burst(s, 640, 330, '#ffb703', 6);
    return;
  }
  if (needsChop(id)) {
    if (s.chop.item) { toast(s, 'Finish chopping first!'); sfx.wrong(); return; }
    startChop(s, id);
    burst(s, 130, 620, '#7ed957', 5);
    return;
  }
  if (s.plate.length >= 6) { toast(s, 'Plate is full — serve or trash it!'); sfx.wrong(); return; }
  s.plate.push(id);
  sfx.pickup();
  burst(s, 880, 420, '#ffd166', 5);
}

export function chopBoard(s) {
  if (s.screen !== 'play' || s.paused) return;
  const result = chopOnce(s);
  if (result === 'done') {
    s.stats.chopped++;
    burst(s, 130, 620, '#7ed957', 10);
    toast(s, 'Chopped — straight onto the plate!');
  } else if (result === 'progress') {
    burst(s, 130, 620, '#c9e39a', 4);
  }
}

export function takeGrillPatty(s, index) {
  if (s.screen !== 'play' || s.paused) return;
  const slot = s.grill[index];
  if (!slot) return;
  if (slot.state === 'cooked') {
    if (s.plate.length >= 6) { toast(s, 'Plate is full — serve or trash it!'); sfx.wrong(); return; }
    s.plate.push('patty');
    slot.state = 'empty'; slot.t = 0;
    sfx.pickup();
    burst(s, 880, 420, '#ffd166', 5);
  } else if (slot.state === 'burnt') {
    slot.state = 'empty'; slot.t = 0;
    s.stats.burnt++;
    toast(s, 'Burnt patty tossed.');
    sfx.wrong();
  } else if (slot.state === 'cooking') {
    toast(s, 'Still sizzling…');
    sfx.tick();
  }
}

export function trashPlate(s) {
  if (s.screen !== 'play' || s.paused) return;
  if (s.plate.length === 0 && !s.chop.item) return;
  s.plate = [];
  if (s.chop.item) s.chop = newChop();
  s.combo = 0;
  sfx.wrong();
  toast(s, 'Plate cleared.');
}

export function servePlate(s) {
  if (s.screen !== 'play' || s.paused) return;
  if (s.plate.length === 0) { toast(s, 'Nothing on the plate yet!'); return; }
  const target = selectedOrder(s);
  const match = s.orders.find((o) => plateMatchesRecipe(s.plate, recipeById(o.recipeId)));
  if (!match) {
    s.stats.wrongServes++;
    s.combo = 0;
    if (target) target.patience = Math.max(4, target.patience - 8);
    sfx.wrong();
    toast(s, 'No order wants that dish!');
    shakePlate(s);
    return;
  }
  const recipe = recipeById(match.recipeId);
  const patienceBonus = Math.round((match.patience / match.maxPatience) * 6);
  const mult = (match.golden ? 2 : 1) * rushMultiplier(s);
  s.combo = Math.min(COMBO_MAX, s.combo + 1);
  s.bestCombo = Math.max(s.bestCombo, s.combo);
  const gained = (recipe.coins + patienceBonus) * s.combo * mult;
  s.score += gained;
  s.coins += (recipe.coins + patienceBonus) * mult;
  s.served++;
  s.servedThisLevel++;
  if (match.golden) s.stats.vipServes++;
  if (s.rush.active) s.stats.rushServes++;
  s.orders = s.orders.filter((o) => o.id !== match.id);
  if (s.selectedOrderId === match.id) {
    s.selectedOrderId = s.orders.length ? s.orders[0].id : null;
  }
  s.plate = [];
  sfx.serve();
  burst(s, 1010, 300, '#ffd166', 22);
  burst(s, 1010, 300, '#ff8fa3', 12);
  const tag = `${match.golden ? '★ VIP ' : ''}${s.rush.active ? '⚡ RUSH ' : ''}${s.combo > 1 ? 'COMBO x' + s.combo : ''}`;
  addFloat(s, 1010, 260, `+${gained}  ${tag}`, '#ffb703');
  toast(s, `${match.customer.name} loved the ${recipe.name}!${mult > 1 ? ` (x${mult}!)` : ''}`);
  if (s.servedThisLevel >= LEVEL_SERVES) {
    s.level++;
    s.servedThisLevel = 0;
    sfx.levelup();
    toast(s, `Level ${s.level}! Faster orders, new recipes!`);
    burst(s, 640, 200, '#ffd166', 30);
  }
}

export function startGame(s) {
  const fresh = newState(s.seed);
  Object.assign(s, fresh, { screen: 'play' });
  spawnOrder(s); spawnOrder(s);
  sfx.start();
}

export function endShift(s) {
  s.screen = 'end';
  setSizzle(false);
  const grade = s.score >= 800 ? 'S' : s.score >= 550 ? 'A' : s.score >= 350 ? 'B' : s.score >= 180 ? 'C' : 'D';
  s.endStats = {
    score: s.score, coins: s.coins, served: s.served, lost: s.lost,
    bestCombo: s.bestCombo, level: s.level, grade,
  };
  if (s.score >= 350) sfx.levelup(); else sfx.lost();
}

function toast(s, text) {
  s.toasts.push({ text, t: 0 });
  if (s.toasts.length > 3) s.toasts.shift();
}

function addFloat(s, x, y, text, color) {
  s.floats.push({ x, y, text, color, t: 0 });
}

function burst(s, x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = s.rng() * Math.PI * 2;
    const sp = 40 + s.rng() * 140;
    s.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, t: 0, life: 0.7 + s.rng() * 0.5, color, r: 2 + s.rng() * 3 });
  }
}

function shakePlate(s) {
  s.plateShake = 0.35;
}

// --- per-frame update ------------------------------------------------------
export function update(s, dt) {
  s.animT += dt;
  if (s.plateShake > 0) s.plateShake = Math.max(0, s.plateShake - dt);
  for (const p of s.particles) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; }
  s.particles = s.particles.filter((p) => p.t < p.life);
  for (const f of s.floats) { f.t += dt; f.y -= 42 * dt; }
  s.floats = s.floats.filter((f) => f.t < 1.4);
  for (const t of s.toasts) t.t += dt;
  s.toasts = s.toasts.filter((t) => t.t < 2.6);
  if (s.messageT > 0) s.messageT -= dt;
  if (s.finalBannerT > 0) s.finalBannerT -= dt;

  if (s.screen !== 'play' || s.paused) { setSizzle(false); return; }

  s.elapsed += dt;
  s.timeLeft = Math.max(0, SHIFT_SECONDS - s.elapsed);
  if (s.timeLeft <= 0) { endShift(s); return; }

  // Rush Hour + golden VIP clocks.
  const rushEvent = tickRush(s, dt);
  if (rushEvent === 'rush-start') {
    sfx.rush();
    toast(s, '⚡ RUSH HOUR! Everything pays double for 15s!');
    burst(s, 640, 100, '#ffb703', 30);
  } else if (rushEvent === 'rush-end') {
    toast(s, 'Rush Hour over — back to the usual pace.');
  }
  if (tickGolden(s, dt)) {
    if (spawnOrder(s, true)) {
      sfx.levelup();
      toast(s, '★ A golden VIP order just arrived — worth double!');
    }
  }

  // Final-30-seconds banner (once) + tick every second.
  if (!s.finalBannerShown && s.timeLeft <= 30) {
    s.finalBannerShown = true;
    s.finalBannerT = 2.5;
    sfx.tick();
    toast(s, '⏰ FINAL 30 SECONDS!');
  }
  if (s.timeLeft <= 30.5 && Math.floor(s.timeLeft) !== Math.floor(s.timeLeft + dt)) sfx.tick();

  // Grill progress.
  let anyCooking = false;
  for (const slot of s.grill) {
    if (slot.state === 'cooking' || slot.state === 'cooked' || slot.state === 'burnt') {
      slot.t += dt;
      if (slot.state === 'cooking') {
        anyCooking = true;
        if (slot.t >= GRILL_COOK_SECONDS) { slot.state = 'cooked'; sfx.cooked(); toast(s, 'Patty is ready!'); }
      } else if (slot.state === 'cooked' && slot.t >= GRILL_BURN_SECONDS) {
        slot.state = 'burnt';
        toast(s, 'A patty burnt! Click it to toss it.');
        sfx.wrong();
      }
    }
  }
  setSizzle(anyCooking);

  // Order spawning (twice as fast during Rush Hour).
  s.spawnTimer -= dt;
  if (s.spawnTimer <= 0) {
    spawnOrder(s);
    s.spawnTimer = spawnIntervalForLevel(s.level) * (s.rush.active ? 0.5 : 1);
  }

  // Patience drains; expired orders walk out.
  for (const o of s.orders) {
    o.patience -= dt;
    o.angry = o.patience < o.maxPatience * 0.3;
  }
  const expired = s.orders.filter((o) => o.patience <= 0);
  for (const o of expired) {
    s.lost++;
    s.combo = 0;
    sfx.lost();
    toast(s, `${o.customer.name} left hungry…`);
  }
  if (expired.length) {
    s.orders = s.orders.filter((o) => o.patience > 0);
    if (!s.orders.find((o) => o.id === s.selectedOrderId)) {
      s.selectedOrderId = s.orders.length ? s.orders[0].id : null;
    }
  }
}

export function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const r = Math.floor(sec % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
}
