// The Golden Ladle — Hearth Rush v2. Game configuration: ingredients,
// recipes, timings and the warm kitchen palette. All original content.
export const W = 1280;
export const H = 800;

export const SHIFT_SECONDS = 180;

export const INGREDIENTS = {
  bun:     { name: 'Bun',     key: '1', color: '#e8a94e', price: 0 },
  patty:   { name: 'Patty',   key: '2', color: '#8a5a33', price: 0 },
  cheese:  { name: 'Cheese',  key: '3', color: '#ffc93c', price: 0 },
  lettuce: { name: 'Lettuce', key: '4', color: '#5fbf4a', price: 0 },
  tomato:  { name: 'Tomato',  key: '5', color: '#e5484d', price: 0 },
  egg:     { name: 'Egg',     key: '6', color: '#fff3c4', price: 0 },
};
export const BIN_ORDER = ['bun', 'patty', 'cheese', 'lettuce', 'tomato', 'egg'];

// A recipe is a multiset of ingredients. Order on the plate does not matter.
export const RECIPES = [
  { id: 'classic',   name: 'Classic Burger', needs: ['bun', 'patty', 'lettuce', 'tomato'],          coins: 12, unlockLevel: 1 },
  { id: 'sunrise',   name: 'Sunrise Bun',    needs: ['bun', 'egg', 'cheese', 'lettuce'],            coins: 13, unlockLevel: 1 },
  { id: 'melt',      name: 'Cheese Melt',    needs: ['bun', 'patty', 'cheese', 'cheese'],           coins: 14, unlockLevel: 1 },
  { id: 'breakfast', name: 'Breakfast Stack', needs: ['bun', 'egg', 'egg', 'cheese'],               coins: 15, unlockLevel: 1 },
  { id: 'garden',    name: 'Garden Stack',   needs: ['bun', 'lettuce', 'tomato', 'egg', 'cheese'],  coins: 16, unlockLevel: 2 },
  { id: 'spicy',     name: 'Spicy Stack',    needs: ['bun', 'patty', 'tomato', 'tomato', 'cheese'], coins: 18, unlockLevel: 2 },
  { id: 'veggie',    name: 'Veggie Delight', needs: ['bun', 'lettuce', 'lettuce', 'tomato', 'egg'], coins: 19, unlockLevel: 3 },
  { id: 'double',    name: 'Double Trouble', needs: ['bun', 'patty', 'patty', 'cheese', 'tomato'],  coins: 20, unlockLevel: 3 },
  { id: 'triple',    name: 'Triple Crown',   needs: ['bun', 'patty', 'patty', 'patty', 'cheese'],   coins: 24, unlockLevel: 4 },
];

export const CUSTOMERS = [
  { name: 'Mara',  tint: '#f2a65a', hat: '#7a4a21' },
  { name: 'Juno',  tint: '#e8b4b8', hat: '#5b7fa6' },
  { name: 'Pip',   tint: '#c9a86a', hat: '#3f7d4e' },
  { name: 'Sable', tint: '#b08968', hat: '#8e44ad' },
  { name: 'Theo',  tint: '#e0ac69', hat: '#2e6f6a' },
  { name: 'Wren',  tint: '#d9a05b', hat: '#a93226' },
  { name: 'Basil', tint: '#a8d08d', hat: '#6b4226' },
  { name: 'Clover', tint: '#f0c297', hat: '#7d3c98' },
];

export const GRILL_SLOTS = 3;
export const GRILL_COOK_SECONDS = 6;
export const GRILL_BURN_SECONDS = 16;
export const ORDER_PATIENCE_SECONDS = 48;
export const MAX_ORDERS = 4;
export const COMBO_MAX = 5;
export const LEVEL_SERVES = 4; // serves needed to level up (was 5 in v1)

// Rush Hour: every RUSH_EVERY_SECONDS a RUSH_DURATION_SECONDS rush arrives.
export const RUSH_EVERY_SECONDS = 60;
export const RUSH_DURATION_SECONDS = 15;
// A golden VIP order arrives every GOLDEN_EVERY_SECONDS and pays double.
export const GOLDEN_EVERY_SECONDS = 45;

export const PALETTE = {
  wall: '#f7e3c3',
  wallShadow: '#eed3a8',
  floor: '#b07a4e',
  floorDark: '#9a683f',
  counterWood: '#8a5a33',
  counterTop: '#c98d5a',
  counterEdge: '#6e4525',
  boardWood: '#7c4a21',
  boardPaper: '#fff6e0',
  hud: '#3a2415',
  cream: '#fff8ea',
  ink: '#3a2415',
  gold: '#ffb703',
  red: '#e5484d',
  green: '#4caf50',
};

export function spawnIntervalForLevel(level) {
  return Math.max(4.5, 8.5 - level * 0.7);
}
export function patienceForLevel(level) {
  return Math.max(30, ORDER_PATIENCE_SECONDS - (level - 1) * 3);
}
export function unlockedRecipes(level) {
  return RECIPES.filter((r) => r.unlockLevel <= level);
}

// Small deterministic RNG so screenshots are stable.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
