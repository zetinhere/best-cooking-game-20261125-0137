// Ember Bistro — staged scenes for screenshots.
// One job: given a fresh state, arrange one deterministic scene per shot
// name, so the screenshots are reproducible captures of the real game.
// The game itself is never faked: every scene is a legal state the rules
// could reach, rendered by the same renderer the player sees.

import { RECIPES, SHIFT_SECONDS } from './config.js';
import { newGame, plateWith } from './state.js';

function base(seed) {
  const state = newGame(seed);
  state.now = 90000; // floaters, grill glow and the chef's bob read a fixed clock
  return state;
}

function openOrder(state, recipeId, left) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  const total = left + 25;
  state.orders.push({
    id: state.nextOrderId++,
    recipe,
    left,
    total,
    state: 'open',
  });
}

// The cover: a kitchen at full tilt — three orders on the board, a burger
// mid-assembly on the counter, a patty on the grill, chopped tomato waiting
// on the board, and a finished Cheese Melt in the chef's hands by the window.
function stageCover(state) {
  state.screen = 'play';
  state.phase = 'play';
  state.elapsed = 93;
  state.shiftLeft = SHIFT_SECONDS - 93;
  openOrder(state, 'burger', 52);
  openOrder(state, 'melt', 34);
  openOrder(state, 'deluxe', 61);
  state.grill[0] = { id: 'patty', t: 4.2 };
  state.boardItem = 'tomato_chopped';
  state.counter[0] = plateWith(['bun', 'patty_grilled', 'lettuce_chopped']);
  state.hands = plateWith(['bun', 'patty_grilled', 'cheese', 'tomato_chopped']);
  state.player.x = 1060;
  state.player.y = 360;
  state.player.dir = 1;
  state.coins = 86;
  state.earned = 86;
  state.served = 5;
  state.combo = 3;
  state.bestCombo = 4;
  state.floaters = [{ text: '+$26', x: 1190, y: 280, color: '#f2c230', born: 89500, life: 1100 }];
  state.log = [
    'Grilled patty, fresh off the grill.',
    'Added lettuce to the plate.',
    'New order: Ember Deluxe.',
  ];
}

// The title screen, exactly as a new player sees it.
function stageTitle(state) {
  state.screen = 'title';
}

// The rush: thirty-eight seconds left, three orders, one about to walk out,
// a patty ready and one seconds from burnt.
function stageRush(state) {
  state.screen = 'play';
  state.phase = 'play';
  state.elapsed = 142;
  state.shiftLeft = 38;
  openOrder(state, 'deluxe', 9);
  openOrder(state, 'burger', 27);
  openOrder(state, 'salad', 44);
  state.grill[0] = { id: 'patty', t: 7.5 };
  state.grill[1] = { id: 'patty', t: 11.2 };
  state.board = { id: 'lettuce', progress: 0.9 };
  state.counter[0] = plateWith(['bun', 'patty_grilled']);
  state.counter[1] = plateWith(['lettuce_chopped', 'tomato_chopped']);
  state.player.x = 480;
  state.player.y = 300;
  state.player.dir = -1;
  state.coins = 214;
  state.earned = 214;
  state.served = 12;
  state.combo = 5;
  state.bestCombo = 6;
  state.log = [
    'A patty burnt on the grill!',
    'Served Cheese Melt for $31 (combo x2.00).',
    'New order: Garden Salad.',
  ];
}

// A finished shift: HEAD CHEF rank, full stat line.
function stageWin(state) {
  state.screen = 'over';
  state.phase = 'over';
  state.over = true;
  state.elapsed = 180;
  state.shiftLeft = 0;
  state.coins = 342;
  state.earned = 342;
  state.served = 17;
  state.expired = 1;
  state.burnt = 1;
  state.combo = 0;
  state.bestCombo = 7;
  state.result = {
    rank: 'HEAD CHEF',
    blurb: 'The bistro sings. Every plate a small triumph.',
  };
  state.log = ['Shift over — 17 dishes served, $342 earned.'];
}

const STAGES = { cover: stageCover, title: stageTitle, rush: stageRush, win: stageWin };

export function stageShot(name, seed) {
  const state = base(seed);
  const stage = STAGES[name];
  if (!stage) return null;
  stage(state);
  return state;
}

export function shotNames() {
  return Object.keys(STAGES);
}
