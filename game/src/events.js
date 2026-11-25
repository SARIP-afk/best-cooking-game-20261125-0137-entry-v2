// The Golden Ladle — kitchen events: Rush Hour and golden VIP orders.
// Rush Hour arrives every RUSH_EVERY_SECONDS and lasts RUSH_DURATION_SECONDS:
// orders spawn twice as fast and every serve pays double. A golden VIP order
// arrives every GOLDEN_EVERY_SECONDS and pays double on its own. Both force
// the player to prioritise: serve the VIP first, or the order about to
// expire? These functions only mutate the event timers and report what
// happened; state.js turns the reports into toasts, sounds and spawns.
import {
  RUSH_EVERY_SECONDS, RUSH_DURATION_SECONDS, GOLDEN_EVERY_SECONDS,
} from './config.js';

export function newEvents() {
  return {
    rush: { active: false, t: 0, next: RUSH_EVERY_SECONDS },
    goldenTimer: GOLDEN_EVERY_SECONDS,
  };
}

// Advance the rush clock. Returns 'rush-start' | 'rush-end' | null.
export function tickRush(s, dt) {
  const r = s.rush;
  if (!r.active) {
    r.next -= dt;
    if (r.next <= 0) {
      r.active = true;
      r.t = RUSH_DURATION_SECONDS;
      return 'rush-start';
    }
    return null;
  }
  r.t -= dt;
  if (r.t <= 0) {
    r.active = false;
    r.next = RUSH_EVERY_SECONDS;
    return 'rush-end';
  }
  return null;
}

// Advance the golden-order clock. Returns true when one is due.
export function tickGolden(s, dt) {
  s.goldenTimer -= dt;
  if (s.goldenTimer <= 0) {
    s.goldenTimer = GOLDEN_EVERY_SECONDS;
    return true;
  }
  return false;
}

export function isRush(s) {
  return s.rush.active;
}

// Coins (and the score built from them) pay double during a rush.
export function rushMultiplier(s) {
  return s.rush.active ? 2 : 1;
}
