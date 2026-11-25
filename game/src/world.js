// Ember Bistro — update logic: movement, stations, cooking, orders, scoring.
// One job: turn input + time into the next state, and nothing else.

import {
  CHOP_SECONDS,
  COMBO_MAX,
  COMBO_STEP,
  GRILL_BURNT_AT,
  INGREDIENTS,
  INTERACT_RANGE,
  PALETTE,
  PLAYER_SPEED,
  RANKS,
  SHIFT_SECONDS,
  STATIONS,
} from './config.js';
import {
  addFloater,
  collidePlayer,
  grillStatus,
  isPlate,
  item,
  nextOrderDelay,
  plateMatchesRecipe,
  plateWith,
  setToast,
  spawnOrder,
  stationRects,
} from './state.js';
import {
  playBurnt,
  playChop,
  playCoin,
  playError,
  playExpire,
  playPickup,
  playPlace,
  playServe,
  setSizzle,
} from './audio.js';

export function startShift(state) {
  state.screen = 'play';
  state.phase = 'play';
  state.now = 0;
  state.elapsed = 0;
  state.shiftLeft = SHIFT_SECONDS;
  state.orders = [];
  state.nextOrderId = 1;
  state.nextOrderAt = 2;
  state.grill = state.grill.map(() => null);
  state.board = null;
  state.boardItem = null;
  state.counter = state.counter.map(() => null);
  state.hands = null;
  state.coins = 0;
  state.served = 0;
  state.expired = 0;
  state.burnt = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.earned = 0;
  state.floaters = [];
  state.log = ['Shift started. First order coming in…'];
  state.result = null;
  state.over = false;
  state.player.x = 640;
  state.player.y = 400;
  state.player.target = null;
}

function nearestStation(state) {
  const p = state.player;
  let best = null;
  let bestD = Infinity;
  for (const s of stationRects()) {
    const nx = Math.max(s.x, Math.min(p.x, s.x + s.w));
    const ny = Math.max(s.y, Math.min(p.y, s.y + s.h));
    const d = Math.hypot(p.x - nx, p.y - ny);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return bestD <= INTERACT_RANGE ? best : null;
}

function stationCenter(s) {
  return { x: s.x + s.w / 2, y: s.y + s.h / 2 };
}

// --- interactions -----------------------------------------------------------

function takeFromCrate(state, station, audio) {
  if (state.hands) {
    setToast(state, 'Hands full — put something down first.');
    playError(audio);
    return;
  }
  state.hands = item(station.gives);
  state.log.push(`Took ${INGREDIENTS[station.gives].name}.`);
  playPickup(audio);
}

function useBoard(state, audio) {
  const held = state.hands;
  // Pick up a finished chopped item waiting on the board.
  if (state.boardItem) {
    if (held) {
      setToast(state, 'Hands full — the chopped veg is waiting on the board.');
      playError(audio);
      return;
    }
    state.hands = item(state.boardItem);
    state.boardItem = null;
    state.log.push('Picked up the chopped veg.');
    playPickup(audio);
    return;
  }
  if (state.board) return; // already chopping; progress runs in update()
  if (!held || held.kind !== 'item') {
    setToast(state, 'Bring lettuce or tomato to chop.');
    playError(audio);
    return;
  }
  const def = INGREDIENTS[held.id];
  if (!def.chop) {
    setToast(state, `${def.name} doesn't need chopping.`);
    playError(audio);
    return;
  }
  state.board = { id: held.id, progress: 0 };
  state.hands = null;
  state.log.push(`Chopping ${def.name}…`);
  playChop(audio);
}

function useGrill(state, audio) {
  const held = state.hands;
  // Pick up a finished patty first if one is done or burnt.
  const doneIdx = state.grill.findIndex((slot) => slot && grillStatus(slot) !== 'cooking');
  if (doneIdx !== -1) {
    const slot = state.grill[doneIdx];
    const status = grillStatus(slot);
    if (!held) {
      state.grill[doneIdx] = null;
      if (status === 'burnt') {
        state.hands = item('patty_burnt');
        setToast(state, 'Burnt! Toss it in the trash.');
        playBurnt(audio);
      } else {
        state.hands = item('patty_grilled');
        state.log.push('Grilled patty, fresh off the grill.');
        playPickup(audio);
      }
      return;
    }
    setToast(state, 'Hands full — the grill is waiting.');
    playError(audio);
    return;
  }
  // Otherwise place a raw patty on a free slot.
  if (!held || held.kind !== 'item' || held.id !== 'patty') {
    setToast(state, 'The grill takes raw patties.');
    playError(audio);
    return;
  }
  const freeIdx = state.grill.findIndex((slot) => slot === null);
  if (freeIdx === -1) {
    setToast(state, 'Both grill slots are full.');
    playError(audio);
    return;
  }
  state.grill[freeIdx] = { id: 'patty', t: 0 };
  state.hands = null;
  state.log.push('Patty on the grill — watch it, it burns fast.');
  playPlace(audio);
}

function usePlates(state, audio) {
  if (state.hands) {
    setToast(state, 'Hands full — put something down first.');
    playError(audio);
    return;
  }
  state.hands = plateWith([]);
  state.log.push('Took a clean plate.');
  playPickup(audio);
}

function useCounter(state, audio) {
  const held = state.hands;
  if (!held) {
    // Pick a plate back up off the counter.
    const idx = state.counter.findIndex((p) => p !== null);
    if (idx === -1) {
      setToast(state, 'Bring a plate here to build a dish.');
      playError(audio);
      return;
    }
    state.hands = state.counter[idx];
    state.counter[idx] = null;
    state.log.push('Picked the plate back up.');
    playPickup(audio);
    return;
  }
  if (held.kind === 'plate') {
    const freeIdx = state.counter.findIndex((p) => p === null);
    if (freeIdx === -1) {
      setToast(state, 'Both counter spots are taken.');
      playError(audio);
      return;
    }
    state.counter[freeIdx] = held;
    state.hands = null;
    state.log.push('Plate on the counter — build the dish here.');
    playPlace(audio);
    return;
  }
  // Held is an ingredient: add it to a plate on the counter.
  const idx = state.counter.findIndex((p) => p !== null);
  if (idx === -1) {
    setToast(state, 'Put a plate on the counter first.');
    playError(audio);
    return;
  }
  const plate = state.counter[idx];
  if (plate.items.includes(held.id)) {
    setToast(state, 'That is already on the plate.');
    playError(audio);
    return;
  }
  if (held.id === 'patty' || held.id === 'patty_burnt') {
    setToast(state, 'A raw or burnt patty goes nowhere near a plate.');
    playError(audio);
    return;
  }
  plate.items.push(held.id);
  state.hands = null;
  state.log.push(`Added ${held.id.replace('_', ' ')} to the plate.`);
  playPlace(audio);
}

function useWindow(state, audio) {
  const held = state.hands;
  if (!held || !isPlate(held)) {
    setToast(state, 'Bring a finished plate to serve.');
    playError(audio);
    return;
  }
  if (held.items.length === 0) {
    setToast(state, 'An empty plate earns nothing.');
    playError(audio);
    return;
  }
  const open = state.orders.filter((o) => o.state === 'open');
  const match = open.find((o) => plateMatchesRecipe(held, o.recipe));
  if (!match) {
    setToast(state, 'No order wants this plate — check the board.');
    playError(audio);
    return;
  }
  const timeBonus = Math.round((match.left / match.total) * 8);
  const mult = 1 + Math.min(state.combo, 8) * COMBO_STEP;
  const earned = Math.round((match.recipe.base + timeBonus) * Math.min(mult, COMBO_MAX));
  match.state = 'done';
  state.coins += earned;
  state.earned += earned;
  state.served += 1;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.hands = null;
  const c = stationCenter(STATIONS.window);
  addFloater(state, `+$${earned}`, c.x - 40, c.y - 30, PALETTE.gold);
  state.log.push(`Served ${match.recipe.name} for $${earned}${state.combo > 1 ? ` (combo x${mult.toFixed(2)})` : ''}.`);
  playServe(audio);
  playCoin(audio);
}

function useTrash(state, audio) {
  if (!state.hands) {
    setToast(state, 'Nothing to throw away.');
    playError(audio);
    return;
  }
  if (state.hands.kind === 'item' && state.hands.id === 'patty_burnt') state.burnt += 1;
  state.log.push('Tossed it in the trash.');
  state.hands = null;
  playPlace(audio);
}

const USE = {
  crate: takeFromCrate,
  board: useBoard,
  grill: useGrill,
  plates: usePlates,
  counter: useCounter,
  window: useWindow,
  trash: useTrash,
};

export function interact(state, audio) {
  const station = nearestStation(state);
  if (!station) {
    setToast(state, 'Step closer to a station to use it.');
    return;
  }
  USE[station.kind](state, station, audio);
}

// --- per-frame update -------------------------------------------------------

export function update(state, input, dt, audio) {
  if (state.screen !== 'play') return;
  state.now += dt * 1000;
  state.elapsed += dt;
  state.shiftLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);

  // Movement: keys first, click-to-move target second.
  const p = state.player;
  let vx = 0;
  let vy = 0;
  if (input.mouse.clicked) {
    p.target = { x: input.mouse.x, y: input.mouse.y };
  }
  const mv = { x: 0, y: 0 };
  if (input.keys.has('w') || input.keys.has('a') || input.keys.has('s') || input.keys.has('d')
    || input.keys.has('arrowup') || input.keys.has('arrowleft')
    || input.keys.has('arrowdown') || input.keys.has('arrowright')) {
    p.target = null;
    const v = { x: 0, y: 0 };
    if (input.keys.has('a') || input.keys.has('arrowleft')) v.x -= 1;
    if (input.keys.has('d') || input.keys.has('arrowright')) v.x += 1;
    if (input.keys.has('w') || input.keys.has('arrowup')) v.y -= 1;
    if (input.keys.has('s') || input.keys.has('arrowdown')) v.y += 1;
    const len = Math.hypot(v.x, v.y) || 1;
    mv.x = v.x / len;
    mv.y = v.y / len;
  } else if (p.target) {
    const dx = p.target.x - p.x;
    const dy = p.target.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d < 6) {
      p.target = null;
    } else {
      mv.x = dx / d;
      mv.y = dy / d;
    }
  }
  if (mv.x !== 0 || mv.y !== 0) {
    p.x += mv.x * PLAYER_SPEED * dt;
    p.y += mv.y * PLAYER_SPEED * dt;
    p.dir = mv.x < 0 ? -1 : mv.x > 0 ? 1 : p.dir;
    p.walking = true;
  } else {
    p.walking = false;
  }
  collidePlayer(state);

  // Interact key / click on a nearby station.
  if (input.pressed.has('e') || input.pressed.has(' ') || input.pressed.has('enter')) {
    interact(state, audio);
  }

  // Chopping progresses while the chef stands by the board.
  if (state.board) {
    const board = STATIONS.board;
    const near = Math.hypot(p.x - (board.x + board.w / 2), p.y - (board.y + board.h / 2)) < 220;
    if (near) {
      state.board.progress += dt;
      if (Math.floor(state.board.progress * 10) !== Math.floor((state.board.progress - dt) * 10)) {
        playChop(audio);
      }
      if (state.board.progress >= CHOP_SECONDS) {
        const done = `${state.board.id}_chopped`;
        state.boardItem = done;
        state.log.push(`${INGREDIENTS[state.board.id].name} chopped.`);
        state.board = null;
        playPlace(audio);
      }
    }
  }

  // Grill timers; a patty left too long burns.
  let anyCooking = false;
  for (const slot of state.grill) {
    if (!slot) continue;
    slot.t += dt;
    if (slot.t < GRILL_BURNT_AT) anyCooking = true;
    if (slot.t >= GRILL_BURNT_AT && !slot.burntAnnounced) {
      slot.burntAnnounced = true;
      state.log.push('A patty burnt on the grill!');
      setToast(state, 'A patty burnt! Trash it and start over.');
      playBurnt(audio);
    }
  }
  setSizzle(audio, anyCooking);

  // Orders: spawn on schedule, tick timers, expire.
  if (state.shiftLeft > 0) {
    if (state.elapsed >= state.nextOrderAt) {
      spawnOrder(state);
      state.nextOrderAt = state.elapsed + nextOrderDelay(state);
    }
  }
  for (const order of state.orders) {
    if (order.state !== 'open') continue;
    order.left -= dt;
    if (order.left <= 0) {
      order.left = 0;
      order.state = 'expired';
      state.expired += 1;
      state.combo = 0;
      state.log.push(`${order.recipe.name} walked out — too slow.`);
      setToast(state, `${order.recipe.name} expired! Combo lost.`);
      playExpire(audio);
    }
  }
  // Served and expired tickets leave the board at once.
  state.orders = state.orders.filter((o) => o.state === 'open');

  // Floaters and toast age out.
  state.floaters = state.floaters.filter((f) => state.now - f.born < f.life);
  if (state.toast && state.now - state.toast.born > state.toast.life) state.toast = null;
  if (state.log.length > 5) state.log = state.log.slice(-5);

  // Shift end.
  if (state.shiftLeft <= 0) endShift(state, audio);
}

function endShift(state, audio) {
  state.screen = 'over';
  state.phase = 'over';
  state.over = true;
  setSizzle(audio, false);
  const rank = RANKS.find((r) => state.earned >= r.min) || RANKS[RANKS.length - 1];
  state.result = rank;
  state.log.push(`Shift over — ${state.served} dishes served, $${state.earned} earned.`);
  playServe(audio);
}
