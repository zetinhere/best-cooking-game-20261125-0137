// Ember Bistro — tuning constants, palette, recipes and kitchen layout.
// One job: every number the rest of the game reads, in one place.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const HUD_H = 92;

export const PLAYER_SPEED = 265;
export const PLAYER_RADIUS = 18;
export const INTERACT_RANGE = 78;

export const SHIFT_SECONDS = 180;
export const MAX_ORDERS = 3;
export const FIRST_ORDER_AT = 2;
export const ORDER_INTERVAL_START = 19;
export const ORDER_INTERVAL_END = 12;
export const ORDER_PATIENCE_START = 80;
export const ORDER_PATIENCE_END = 62;

export const CHOP_SECONDS = 1.4;
export const GRILL_DONE_AT = 6;
export const GRILL_BURNT_AT = 12;
export const GRILL_SLOTS = 2;
export const PLATE_SLOTS = 2;

export const COMBO_STEP = 0.25;
export const COMBO_MAX = 2.0;

// Ingredients. `chop` means the board turns it into `chopped`;
// `grill` means the grill turns it into `grilled`.
export const INGREDIENTS = {
  bun: { name: 'Bun', color: '#e8b06a', chop: false, grill: false },
  patty: { name: 'Patty', color: '#b06a4a', chop: false, grill: true, grilledName: 'Grilled Patty' },
  lettuce: { name: 'Lettuce', color: '#7dc24a', chop: true, grill: false, choppedName: 'Chopped Lettuce' },
  tomato: { name: 'Tomato', color: '#e4573d', chop: true, grill: false, choppedName: 'Chopped Tomato' },
  cheese: { name: 'Cheese', color: '#f2c230', chop: false, grill: false },
};

// A finished plate must hold exactly one recipe's set, in any order.
export const RECIPES = [
  {
    id: 'salad',
    name: 'Garden Salad',
    needs: ['lettuce_chopped', 'tomato_chopped'],
    base: 14,
    patience: 1.0,
  },
  {
    id: 'burger',
    name: 'Classic Burger',
    needs: ['bun', 'patty_grilled', 'lettuce_chopped'],
    base: 18,
    patience: 1.0,
  },
  {
    id: 'melt',
    name: 'Cheese Melt',
    needs: ['bun', 'patty_grilled', 'cheese', 'tomato_chopped'],
    base: 22,
    patience: 1.1,
  },
  {
    id: 'deluxe',
    name: 'Ember Deluxe',
    needs: ['bun', 'patty_grilled', 'cheese', 'lettuce_chopped', 'tomato_chopped'],
    base: 28,
    patience: 1.2,
  },
];

export const RANKS = [
  { min: 320, rank: 'HEAD CHEF', blurb: 'The bistro sings. Every plate a small triumph.' },
  { min: 220, rank: 'SOUS CHEF', blurb: 'A steady hand and a hot grill. The crowd is fed.' },
  { min: 130, rank: 'LINE COOK', blurb: 'A few burnt patties, but dinner got served.' },
  { min: 0, rank: 'DISHWASHER', blurb: 'The orders won this shift. Sharpen the knives.' },
];

// Station rectangles on the 1280x720 floor. `kind` drives the interaction.
export const STATIONS = {
  crateBun: { kind: 'crate', gives: 'bun', label: 'BUNS', x: 12, y: 116, w: 128, h: 100 },
  cratePatty: { kind: 'crate', gives: 'patty', label: 'PATTIES', x: 12, y: 228, w: 128, h: 100 },
  crateLettuce: { kind: 'crate', gives: 'lettuce', label: 'LETTUCE', x: 12, y: 340, w: 128, h: 100 },
  crateTomato: { kind: 'crate', gives: 'tomato', label: 'TOMATOES', x: 12, y: 452, w: 128, h: 100 },
  crateCheese: { kind: 'crate', gives: 'cheese', label: 'CHEESE', x: 12, y: 564, w: 128, h: 100 },
  grill: { kind: 'grill', label: 'GRILL', x: 300, y: 122, w: 260, h: 80 },
  board: { kind: 'board', label: 'CHOPPING BOARD', x: 620, y: 122, w: 260, h: 80 },
  plates: { kind: 'plates', label: 'PLATES', x: 940, y: 122, w: 120, h: 80 },
  counter: { kind: 'counter', label: 'ASSEMBLY COUNTER', x: 300, y: 560, w: 580, h: 88 },
  window: { kind: 'window', label: 'SERVING WINDOW', x: 1130, y: 300, w: 138, h: 120 },
  trash: { kind: 'trash', label: 'TRASH', x: 1130, y: 470, w: 138, h: 100 },
};

export const PALETTE = {
  floorA: '#c98f5f',
  floorB: '#bd8252',
  wall: '#8a5a34',
  hud: '#2b1a12',
  hudEdge: '#4a2f1d',
  cream: '#fff3dd',
  ink: '#2b1a12',
  muted: '#8a6a52',
  gold: '#f2c230',
  green: '#7dc24a',
  red: '#e4573d',
  counterWood: '#a06a3c',
  counterTop: '#d9a05f',
  steel: '#c8ccd2',
  steelDark: '#9aa0a8',
};
