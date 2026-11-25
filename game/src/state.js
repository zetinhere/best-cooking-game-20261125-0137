// Ember Bistro — game state, orders and recipes.
// One job: what a kitchen is right now, and how orders arrive and end.

import {
  CHOP_SECONDS,
  FIRST_ORDER_AT,
  GRILL_BURNT_AT,
  GRILL_DONE_AT,
  GRILL_SLOTS,
  MAX_ORDERS,
  ORDER_INTERVAL_END,
  ORDER_INTERVAL_START,
  ORDER_PATIENCE_END,
  ORDER_PATIENCE_START,
  PLATE_SLOTS,
  PLAYER_RADIUS,
  RECIPES,
  SHIFT_SECONDS,
  STATIONS,
} from './config.js';
import { mulberry32, pick } from './random.js';

export function newGame(seed = 1) {
  const rng = mulberry32(seed);
  return {
    seed,
    rng,
    screen: 'title', // title | play | over
    phase: 'title',
    now: 0, // milliseconds since the shift started (drives floaters, toast, pulses)
    elapsed: 0,
    shiftLeft: SHIFT_SECONDS,
    player: { x: 640, y: 400, dir: 1, walking: false, target: null },
    hands: null, // null | {kind:'item', id} | {kind:'plate', items:[]}
    orders: [], // {id, recipe, left, total, state:'open'|'done'|'expired'}
    nextOrderId: 1,
    nextOrderAt: FIRST_ORDER_AT,
    grill: Array.from({ length: GRILL_SLOTS }, () => null), // {id:'patty', t} | null
    board: null, // {id, progress} | null — item being chopped
    boardItem: null, // finished chopped item waiting on the board
    counter: Array.from({ length: PLATE_SLOTS }, () => null), // plate | null
    coins: 0,
    served: 0,
    expired: 0,
    burnt: 0,
    combo: 0,
    bestCombo: 0,
    earned: 0,
    floaters: [], // {text, x, y, color, born, life}
    log: [],
    toast: null, // {text, born, life}
    result: null, // {rank, blurb} at shift end
    over: false,
  };
}

export function plateWith(items) {
  return { kind: 'plate', items: items.slice() };
}

export function item(id) {
  return { kind: 'item', id };
}

export function isPlate(held) {
  return held !== null && held.kind === 'plate';
}

export function heldLabel(held) {
  if (!held) return 'empty hands';
  if (held.kind === 'plate') {
    return held.items.length === 0 ? 'empty plate' : `plate (${held.items.length} items)`;
  }
  return held.id;
}

// Spawn one order ticket. Early orders are the easy recipes; the deluxe
// only shows once the shift is warmed up.
export function spawnOrder(state) {
  if (state.orders.filter((o) => o.state === 'open').length >= MAX_ORDERS) return;
  const progress = 1 - state.shiftLeft / SHIFT_SECONDS;
  let pool = RECIPES.slice(0, 2);
  if (progress > 0.25) pool = RECIPES.slice(0, 3);
  if (progress > 0.55) pool = RECIPES;
  const recipe = pick(state.rng, pool);
  const patience = (ORDER_PATIENCE_START + (ORDER_PATIENCE_END - ORDER_PATIENCE_START) * progress)
    * recipe.patience;
  state.orders.push({
    id: state.nextOrderId++,
    recipe,
    left: patience,
    total: patience,
    state: 'open',
  });
  state.log.push(`New order: ${recipe.name}.`);
}

export function nextOrderDelay(state) {
  const progress = 1 - state.shiftLeft / SHIFT_SECONDS;
  return ORDER_INTERVAL_START + (ORDER_INTERVAL_END - ORDER_INTERVAL_START) * progress;
}

// Does this plate hold exactly the recipe's set, in any order?
export function plateMatchesRecipe(plate, recipe) {
  if (!plate || plate.kind !== 'plate') return false;
  if (plate.items.length !== recipe.needs.length) return false;
  const have = plate.items.slice().sort();
  const need = recipe.needs.slice().sort();
  return have.every((v, i) => v === need[i]);
}

export function addFloater(state, text, x, y, color) {
  state.floaters.push({ text, x, y, color, born: state.now, life: 1100 });
  if (state.floaters.length > 12) state.floaters.shift();
}

export function setToast(state, text) {
  state.toast = { text, born: state.now, life: 2200 };
}

export function stationRects() {
  return Object.entries(STATIONS).map(([id, s]) => ({ id, ...s }));
}

export function grillStatus(slot) {
  if (!slot) return 'empty';
  if (slot.t >= GRILL_BURNT_AT) return 'burnt';
  if (slot.t >= GRILL_DONE_AT) return 'done';
  return 'cooking';
}

export function chopProgress(item) {
  return item ? Math.min(1, item.progress / CHOP_SECONDS) : 0;
}

// Player collision: keep the chef inside the floor and out of stations.
export function collidePlayer(state) {
  const p = state.player;
  const r = PLAYER_RADIUS;
  p.x = Math.max(10 + r, Math.min(1270 - r, p.x));
  p.y = Math.max(96 + r, Math.min(710 - r, p.y));
  // Two passes: pushing out of one station can land the chef inside
  // another processed earlier (the crates sit 12px apart, less than the
  // chef's radius), so a single pass can leave an overlap behind.
  for (let pass = 0; pass < 2; pass++) {
    for (const s of stationRects()) {
      const nx = Math.max(s.x, Math.min(p.x, s.x + s.w));
      const ny = Math.max(s.y, Math.min(p.y, s.y + s.h));
      const dx = p.x - nx;
      const dy = p.y - ny;
      const d2 = dx * dx + dy * dy;
      if (d2 < r * r && d2 > 0.0001) {
        const d = Math.sqrt(d2);
        p.x = nx + (dx / d) * r;
        p.y = ny + (dy / d) * r;
      } else if (d2 === 0) {
        // Dead centre of a station: push out through the nearest edge
        // that does not land inside another station (the crates are
        // 12px apart, tighter than the chef is wide).
        const candidates = [
          { x: s.x - r, y: p.y },
          { x: s.x + s.w + r, y: p.y },
          { x: p.x, y: s.y - r },
          { x: p.x, y: s.y + s.h + r },
        ];
        const overlapsAny = (cx, cy) => stationRects().some((o) => {
          const ox = Math.max(o.x, Math.min(cx, o.x + o.w));
          const oy = Math.max(o.y, Math.min(cy, o.y + o.h));
          return (cx - ox) ** 2 + (cy - oy) ** 2 < r * r;
        });
        const free = candidates.find((c) => !overlapsAny(c.x, c.y));
        const pick = free || candidates[0];
        p.x = pick.x;
        p.y = pick.y;
      }
    }
  }
  p.x = Math.max(10 + r, Math.min(1270 - r, p.x));
  p.y = Math.max(96 + r, Math.min(710 - r, p.y));
}
