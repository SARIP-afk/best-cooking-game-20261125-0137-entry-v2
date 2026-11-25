// The Golden Ladle — staged screenshot states (?shot=start|play|chop|serve|end).
// These build a fixed, attractive scene from the real game state so the
// screenshots are true renders of the game's own code.
import { newState, spawnOrder, recipeById } from './state.js';
import { RECIPES, CUSTOMERS } from './config.js';

function setOrder(s, slot, recipeId, customerIdx, patienceFrac, golden = false) {
  const recipe = recipeById(recipeId);
  const patience = 48 * patienceFrac;
  const customer = CUSTOMERS[customerIdx % CUSTOMERS.length];
  const order = {
    id: 100 + slot,
    recipeId: recipe.id,
    customer,
    patience,
    maxPatience: 48,
    bornAt: 0,
    angry: patienceFrac < 0.3,
    golden: !!golden,
  };
  s.orders.push(order);
  return order;
}

export function applyShot(s, shot) {
  // Start from a fresh playing state, then stage it.
  const fresh = newState(s.seed);
  Object.assign(s, fresh);
  s.shotMode = shot;
  if (shot === 'start') {
    s.screen = 'title';
    s.timeLeft = 180;
    setOrder(s, 0, 'classic', 0, 0.9);
    setOrder(s, 1, 'sunrise', 1, 0.75);
    s.selectedOrderId = s.orders[0].id;
    return;
  }
  if (shot === 'play') {
    // COVER: Rush Hour in full swing — 4 orders incl. a golden VIP, chopping
    // in progress, a dish mid-assembly, all 3 grill slots busy, combo x5,
    // timer red in the final stretch.
    s.screen = 'play';
    s.elapsed = 152; s.timeLeft = 28;
    s.score = 650; s.coins = 120; s.combo = 5; s.bestCombo = 5; s.level = 3; s.served = 12;
    s.rush = { active: true, t: 8, next: 60 };
    setOrder(s, 0, 'classic', 0, 0.62);
    setOrder(s, 1, 'garden', 1, 0.45);
    setOrder(s, 2, 'spicy', 2, 0.8, true); // golden VIP
    setOrder(s, 3, 'triple', 3, 0.55);
    s.selectedOrderId = s.orders[2].id;
    // Dish mid-assembly: bun + patty + lettuce on the plate.
    s.plate = ['bun', 'patty', 'lettuce'];
    // Chopping in progress: lettuce, one chop done.
    s.chop = { item: 'lettuce', progress: 1, needed: 2 };
    // Grill: all three slots busy.
    s.grill[0] = { state: 'cooking', t: 2.5 };
    s.grill[1] = { state: 'cooked', t: 7.2 };
    s.grill[2] = { state: 'cooking', t: 5.1 };
    s.toasts = [{ text: '⚡ RUSH HOUR! Everything pays double!', t: 0.4 }];
    return;
  }
  if (shot === 'chop') {
    // The chopping board mid-chop: lettuce, one of two chops done.
    s.screen = 'play';
    s.elapsed = 45; s.timeLeft = 135;
    s.score = 180; s.coins = 30; s.combo = 2; s.bestCombo = 2; s.level = 2; s.served = 3;
    setOrder(s, 0, 'classic', 0, 0.7);
    setOrder(s, 1, 'sunrise', 1, 0.5);
    s.selectedOrderId = s.orders[0].id;
    s.plate = ['bun', 'patty'];
    s.chop = { item: 'lettuce', progress: 1, needed: 2 };
    s.grill[0] = { state: 'cooking', t: 3.0 };
    s.grill[1] = { state: 'empty', t: 0 };
    s.grill[2] = { state: 'empty', t: 0 };
    s.toasts = [{ text: 'Chop the lettuce — one more click!', t: 0.3 }];
    return;
  }
  if (shot === 'serve') {
    // A golden VIP order complete on the plate: Spicy Stack, ready to serve.
    s.screen = 'play';
    s.elapsed = 68; s.timeLeft = 112;
    s.score = 520; s.coins = 95; s.combo = 4; s.bestCombo = 4; s.level = 2; s.served = 8;
    setOrder(s, 0, 'spicy', 0, 0.55, true); // golden VIP, selected
    setOrder(s, 1, 'melt', 1, 0.7);
    s.selectedOrderId = s.orders[0].id;
    // Complete Spicy Stack on the plate, matching the selected VIP order.
    s.plate = ['bun', 'patty', 'tomato', 'tomato', 'cheese'];
    s.grill[0] = { state: 'empty', t: 0 };
    s.grill[1] = { state: 'cooking', t: 1.8 };
    s.grill[2] = { state: 'empty', t: 0 };
    s.toasts = [{ text: "Plate matches Mara's Spicy Stack — SERVE!", t: 0.3 }];
    return;
  }
  if (shot === 'end') {
    s.screen = 'end';
    s.elapsed = 180; s.timeLeft = 0;
    s.score = 1240; s.coins = 260; s.served = 18; s.lost = 1; s.bestCombo = 5; s.level = 5;
    setOrder(s, 0, 'triple', 0, 0.4);
    s.endStats = { score: 1240, coins: 260, served: 18, lost: 1, bestCombo: 5, level: 5, grade: 'S' };
    return;
  }
  // Unknown shot: fall back to a plain playing scene.
  s.screen = 'play';
  spawnOrder(s);
}
