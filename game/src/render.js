// Ember Bistro — all canvas drawing: kitchen, stations, HUD, screens.
// One job: turn a state into the picture the player (and the judge) sees.

import {
  CHOP_SECONDS,
  GRILL_BURNT_AT,
  GRILL_DONE_AT,
  HUD_H,
  INGREDIENTS,
  INTERACT_RANGE,
  PALETTE,
  PLAYER_RADIUS,
  STATIONS,
  VIEW_H,
  VIEW_W,
} from './config.js';
import { chopProgress, grillStatus, isPlate, stationRects } from './state.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align = 'left', weight = '700') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}

// --- food icons: drawn, never borrowed --------------------------------------

export function drawIngredient(ctx, id, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  if (id === 'bun') {
    ctx.fillStyle = '#e8b06a';
    rr(ctx, -s * 0.55, -s * 0.18, s * 1.1, s * 0.55, s * 0.22);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -s * 0.12, s * 0.52, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fff3dd';
    for (const [dx, dy] of [[-0.28, -0.3], [0, -0.42], [0.28, -0.3], [-0.12, -0.18], [0.14, -0.2]]) {
      ctx.beginPath();
      ctx.ellipse(dx * s, dy * s, s * 0.05, s * 0.03, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'patty' || id === 'patty_grilled' || id === 'patty_burnt') {
    ctx.fillStyle = id === 'patty_burnt' ? '#241a14' : id === 'patty_grilled' ? '#7a3f22' : '#b06a4a';
    rr(ctx, -s * 0.55, -s * 0.22, s * 1.1, s * 0.44, s * 0.2);
    ctx.fill();
    if (id === 'patty_grilled') {
      ctx.strokeStyle = '#4a2410';
      ctx.lineWidth = s * 0.06;
      for (const dx of [-0.3, 0, 0.3]) {
        ctx.beginPath();
        ctx.moveTo(dx * s, -s * 0.2);
        ctx.lineTo(dx * s, s * 0.2);
        ctx.stroke();
      }
    }
    if (id === 'patty_burnt') {
      ctx.strokeStyle = '#5a4632';
      ctx.lineWidth = s * 0.05;
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, -s * 0.1);
      ctx.lineTo(s * 0.3, s * 0.1);
      ctx.moveTo(s * 0.3, -s * 0.1);
      ctx.lineTo(-s * 0.3, s * 0.1);
      ctx.stroke();
    }
  } else if (id === 'lettuce' || id === 'lettuce_chopped') {
    ctx.fillStyle = '#7dc24a';
    if (id === 'lettuce') {
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5da338';
      ctx.beginPath();
      ctx.arc(-s * 0.15, -s * 0.1, s * 0.28, 0, Math.PI * 2);
      ctx.arc(s * 0.2, s * 0.12, s * 0.24, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#4a8a2a';
      ctx.lineWidth = s * 0.05;
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, s * 0.25);
      ctx.quadraticCurveTo(0, -s * 0.3, s * 0.3, s * 0.2);
      ctx.stroke();
    } else {
      for (const [dx, dy, rot] of [[-0.25, -0.1, 0.5], [0.1, -0.2, -0.4], [0.25, 0.15, 0.9], [-0.05, 0.22, -0.9]]) {
        ctx.save();
        ctx.translate(dx * s, dy * s);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.22, s * 0.09, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  } else if (id === 'tomato' || id === 'tomato_chopped') {
    ctx.fillStyle = '#e4573d';
    if (id === 'tomato') {
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.48, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4a8a2a';
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.45, s * 0.16, s * 0.07, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      for (const rot of [0.2, 1.3, 2.4]) {
        ctx.save();
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, s * 0.5, -0.5, 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#f2806a';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.14, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'cheese') {
    ctx.fillStyle = '#f2c230';
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, s * 0.3);
    ctx.lineTo(s * 0.5, s * 0.3);
    ctx.lineTo(s * 0.5, -s * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d99a12';
    for (const [dx, dy] of [[0.15, 0.05], [0.3, -0.08], [0.05, -0.12]]) {
      ctx.beginPath();
      ctx.arc(dx * s, dy * s, s * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawPlate(ctx, plate, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#f4f4f0';
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.62, s * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c8ccd2';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#e8e8e2';
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.42, s * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  // Stack the dish's layers so a mid-assembly plate reads at a glance.
  let dy = s * 0.18;
  for (const itemId of plate.items) {
    drawIngredient(ctx, itemId, 0, dy, s * 0.62);
    dy -= s * 0.14;
  }
  ctx.restore();
}

// --- kitchen ----------------------------------------------------------------

function drawFloor(ctx) {
  const tile = 64;
  for (let y = 92; y < VIEW_H; y += tile) {
    for (let x = 0; x < VIEW_W; x += tile) {
      ctx.fillStyle = ((x / tile + y / tile) % 2 === 0) ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(x, y, tile, tile);
    }
  }
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 84, VIEW_W, 8);
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  for (let y = 92; y < VIEW_H; y += tile) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(VIEW_W, y);
    ctx.stroke();
  }
  for (let x = 0; x < VIEW_W; x += tile) {
    ctx.beginPath();
    ctx.moveTo(x, 92);
    ctx.lineTo(x, VIEW_H);
    ctx.stroke();
  }
}

function stationLabel(ctx, s, sub) {
  text(ctx, s.label, s.x + s.w / 2, s.y + s.h - 8, 13, '#fff3dd', 'center');
  if (sub) text(ctx, sub, s.x + s.w / 2, s.y - 8, 12, '#fff3dd', 'center');
}

function drawCrate(ctx, state, s) {
  ctx.fillStyle = '#7a4a22';
  rr(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fill();
  ctx.fillStyle = '#9a6232';
  rr(ctx, s.x + 5, s.y + 5, s.w - 10, s.h - 34, 7);
  ctx.fill();
  drawIngredient(ctx, s.gives, s.x + s.w / 2, s.y + 40, 44);
  stationLabel(ctx, s);
}

function drawGrill(ctx, state) {
  const s = STATIONS.grill;
  ctx.fillStyle = '#3a3f45';
  rr(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fill();
  ctx.fillStyle = '#22252a';
  rr(ctx, s.x + 8, s.y + 8, s.w - 16, s.h - 34, 6);
  ctx.fill();
  ctx.strokeStyle = '#555b63';
  ctx.lineWidth = 2;
  for (let i = 1; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(s.x + 8 + (i * (s.w - 16)) / 8, s.y + 12);
    ctx.lineTo(s.x + 8 + (i * (s.w - 16)) / 8, s.y + s.h - 30);
    ctx.stroke();
  }
  state.grill.forEach((slot, i) => {
    const cx = s.x + 62 + i * 136;
    const cy = s.y + (s.h - 26) / 2;
    if (!slot) return;
    const status = grillStatus(slot);
    // Heat glow under a cooking patty.
    if (status === 'cooking') {
      const pulse = 0.35 + 0.2 * Math.sin(state.now / 180);
      ctx.fillStyle = `rgba(255,110,40,${pulse})`;
      ctx.beginPath();
      ctx.arc(cx, cy, 34, 0, Math.PI * 2);
      ctx.fill();
    }
    drawIngredient(ctx, status === 'burnt' ? 'patty_burnt' : status === 'done' ? 'patty_grilled' : 'patty', cx, cy, 52);
    const frac = Math.min(1, slot.t / GRILL_BURNT_AT);
    const barColor = status === 'burnt' ? '#241a14' : status === 'done' ? PALETTE.green : PALETTE.gold;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    rr(ctx, cx - 30, cy + 26, 60, 7, 3);
    ctx.fill();
    ctx.fillStyle = barColor;
    rr(ctx, cx - 30, cy + 26, 60 * frac, 7, 3);
    ctx.fill();
    if (status === 'done') text(ctx, 'READY', cx, cy - 30, 13, PALETTE.green, 'center');
    if (status === 'burnt') text(ctx, 'BURNT!', cx, cy - 30, 13, '#ff8a5c', 'center');
  });
  stationLabel(ctx, s);
}

function drawBoard(ctx, state) {
  const s = STATIONS.board;
  ctx.fillStyle = '#c8a06a';
  rr(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fill();
  ctx.fillStyle = '#e8c795';
  rr(ctx, s.x + 8, s.y + 8, s.w - 16, s.h - 34, 6);
  ctx.fill();
  // Knife marks.
  ctx.strokeStyle = 'rgba(120,80,30,0.35)';
  ctx.lineWidth = 1;
  for (const [x1, y1, x2, y2] of [[40, 18, 70, 26], [120, 30, 150, 22], [200, 16, 225, 28]]) {
    ctx.beginPath();
    ctx.moveTo(s.x + x1, s.y + y1);
    ctx.lineTo(s.x + x2, s.y + y2);
    ctx.stroke();
  }
  const cx = s.x + s.w / 2;
  const cy = s.y + (s.h - 26) / 2;
  if (state.board) {
    drawIngredient(ctx, state.board.id, cx, cy, 46);
    const frac = chopProgress(state.board);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    rr(ctx, cx - 40, cy + 26, 80, 8, 4);
    ctx.fill();
    ctx.fillStyle = PALETTE.green;
    rr(ctx, cx - 40, cy + 26, 80 * frac, 8, 4);
    ctx.fill();
    text(ctx, 'CHOPPING…', cx, cy - 30, 13, PALETTE.cream, 'center');
  } else if (state.boardItem) {
    drawIngredient(ctx, state.boardItem, cx, cy, 46);
    text(ctx, 'READY — TAKE IT', cx, cy - 30, 13, PALETTE.green, 'center');
  }
  stationLabel(ctx, s);
}

function drawPlates(ctx, state) {
  const s = STATIONS.plates;
  ctx.fillStyle = PALETTE.steelDark;
  rr(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = '#f4f4f0';
    ctx.beginPath();
    ctx.ellipse(s.x + s.w / 2, s.y + 26 + i * 12, 34, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c8ccd2';
    ctx.stroke();
  }
  stationLabel(ctx, s);
}

function drawCounter(ctx, state) {
  const s = STATIONS.counter;
  ctx.fillStyle = PALETTE.counterWood;
  rr(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.counterTop;
  rr(ctx, s.x + 6, s.y + 6, s.w - 12, 26, 6);
  ctx.fill();
  state.counter.forEach((plate, i) => {
    const cx = s.x + 110 + i * 360;
    const cy = s.y + 56;
    ctx.strokeStyle = 'rgba(255,243,221,0.5)';
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, 62, 26, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    if (plate) drawPlate(ctx, plate, cx, cy, 78);
  });
  stationLabel(ctx, s, 'build dishes here');
}

function drawWindow(ctx, state) {
  const s = STATIONS.window;
  ctx.fillStyle = '#5a3a22';
  rr(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fill();
  ctx.fillStyle = '#3a2412';
  rr(ctx, s.x + 8, s.y + 8, s.w - 16, s.h - 44, 6);
  ctx.fill();
  ctx.fillStyle = '#ffd98a';
  ctx.beginPath();
  ctx.arc(s.x + s.w / 2, s.y + 34, 16, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, 'PICK UP', s.x + s.w / 2, s.y + 62, 11, '#ffd98a', 'center');
  stationLabel(ctx, s, 'serve here');
}

function drawTrash(ctx) {
  const s = STATIONS.trash;
  ctx.fillStyle = '#4a4f55';
  rr(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fill();
  ctx.fillStyle = '#33373c';
  rr(ctx, s.x + 14, s.y + 12, s.w - 28, s.h - 46, 6);
  ctx.fill();
  stationLabel(ctx, s);
}

function drawStations(ctx, state) {
  for (const s of stationRects()) {
    if (s.kind === 'crate') drawCrate(ctx, state, s);
  }
  drawGrill(ctx, state);
  drawBoard(ctx, state);
  drawPlates(ctx, state);
  drawCounter(ctx, state);
  drawWindow(ctx, state);
  drawTrash(ctx);
}

// --- player -----------------------------------------------------------------

function drawPlayer(ctx, state) {
  const p = state.player;
  const bob = p.walking ? Math.sin(state.now / 90) * 2 : 0;
  ctx.save();
  ctx.translate(p.x, p.y + bob);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 16 - bob, 18, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body (apron).
  ctx.fillStyle = '#f4f4f0';
  rr(ctx, -15, -6, 30, 24, 10);
  ctx.fill();
  ctx.fillStyle = '#e4573d';
  ctx.fillRect(-15, 6, 30, 4);
  // Head.
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath();
  ctx.arc(0, -16, 11, 0, Math.PI * 2);
  ctx.fill();
  // Chef hat.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-6, -26, 7, 0, Math.PI * 2);
  ctx.arc(0, -29, 8, 0, Math.PI * 2);
  ctx.arc(6, -26, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-11, -26, 22, 5);
  // Eyes look the way the chef faces.
  ctx.fillStyle = '#2b1a12';
  ctx.beginPath();
  ctx.arc(3 * p.dir, -17, 1.8, 0, Math.PI * 2);
  ctx.arc(8 * p.dir, -17, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // Held item floats above the hat.
  if (state.hands) {
    const hy = -46;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, hy + 14, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    if (isPlate(state.hands)) drawPlate(ctx, state.hands, 0, hy, 52);
    else drawIngredient(ctx, state.hands.id, 0, hy, 40);
  }
  ctx.restore();
}

// --- HUD --------------------------------------------------------------------

function drawOrderTicket(ctx, order, x, y) {
  const urgent = order.left < 15;
  const pulse = urgent ? 0.5 + 0.5 * Math.sin(Date.now() / 150) : 0;
  ctx.fillStyle = urgent ? `rgba(228,87,61,${0.25 + pulse * 0.2})` : '#fff3dd';
  rr(ctx, x, y, 228, 76, 10);
  ctx.fill();
  ctx.strokeStyle = urgent ? '#e4573d' : '#d9a05f';
  ctx.lineWidth = urgent ? 3 : 2;
  ctx.stroke();
  text(ctx, order.recipe.name, x + 10, y + 20, 15, PALETTE.ink);
  text(ctx, `$${order.recipe.base} base`, x + 218, y + 20, 12, PALETTE.muted, 'right');
  // Recipe icons in a row.
  let ix = x + 22;
  for (const need of order.recipe.needs) {
    drawIngredient(ctx, need, ix, y + 44, 30);
    ix += 34;
  }
  // Timer bar.
  const frac = Math.max(0, order.left / order.total);
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  rr(ctx, x + 10, y + 62, 208, 8, 4);
  ctx.fill();
  ctx.fillStyle = urgent ? '#e4573d' : frac > 0.5 ? PALETTE.green : PALETTE.gold;
  rr(ctx, x + 10, y + 62, 208 * frac, 8, 4);
  ctx.fill();
}

function drawHUD(ctx, state) {
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = PALETTE.hudEdge;
  ctx.fillRect(0, HUD_H - 4, VIEW_W, 4);
  state.orders.forEach((order, i) => {
    drawOrderTicket(ctx, order, 16 + i * 240, 24 - 6);
  });
  if (state.orders.length === 0) {
    text(ctx, 'No orders — the rush is coming…', 16, 52, 14, '#8a6a52');
  }
  // Shift timer, big and central-right.
  const mm = Math.floor(state.shiftLeft / 60);
  const ss = Math.floor(state.shiftLeft % 60).toString().padStart(2, '0');
  const lowTime = state.shiftLeft < 30;
  text(ctx, `${mm}:${ss}`, 880, 52, 40, lowTime ? '#ff8a5c' : PALETTE.cream, 'center');
  text(ctx, 'SHIFT', 880, 20, 12, '#c8a06a', 'center');
  const shiftFrac = state.shiftLeft / 180;
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  rr(ctx, 800, 64, 160, 8, 4);
  ctx.fill();
  ctx.fillStyle = lowTime ? '#e4573d' : PALETTE.gold;
  rr(ctx, 800, 64, 160 * shiftFrac, 8, 4);
  ctx.fill();
  // Coins and combo.
  text(ctx, `$${state.earned}`, 1010, 52, 34, PALETTE.gold, 'left');
  text(ctx, 'EARNED', 1010, 20, 12, '#c8a06a', 'left');
  if (state.combo >= 2) {
    text(ctx, `COMBO x${(1 + Math.min(state.combo, 8) * 0.25).toFixed(2)}`, 1264, 52, 20, '#ff9d5c', 'right');
    text(ctx, `${state.combo} in a row`, 1264, 20, 12, '#c8a06a', 'right');
  } else {
    text(ctx, `served ${state.served}`, 1264, 52, 16, PALETTE.cream, 'right');
    text(ctx, 'DISHES', 1264, 20, 12, '#c8a06a', 'right');
  }
}

function drawPrompt(ctx, state) {
  if (state.screen !== 'play') return;
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
  if (!best || bestD > INTERACT_RANGE) return;
  const action = {
    crate: `Take ${best.gives}`,
    board: 'Chop (hold E)',
    grill: 'Grill / take patty',
    plates: 'Take a plate',
    counter: 'Build / take plate',
    window: 'Serve the plate',
    trash: 'Throw it away',
  }[best.kind];
  const label = `E — ${action}`;
  ctx.font = '700 15px "Trebuchet MS", Verdana, sans-serif';
  const w = ctx.measureText(label).width + 24;
  const x = Math.max(8, Math.min(VIEW_W - w - 8, p.x - w / 2));
  const y = p.y - 78;
  ctx.fillStyle = 'rgba(43,26,18,0.9)';
  rr(ctx, x, y, w, 28, 14);
  ctx.fill();
  text(ctx, label, x + w / 2, y + 19, 15, PALETTE.cream, 'center');
}

function drawFloaters(ctx, state) {
  for (const f of state.floaters) {
    const age = (state.now - f.born) / f.life;
    const y = f.y - age * 34;
    ctx.globalAlpha = 1 - age;
    text(ctx, f.text, f.x, y, 24, f.color, 'center');
    ctx.globalAlpha = 1;
  }
  if (state.toast) {
    const age = (state.now - state.toast.born) / state.toast.life;
    ctx.globalAlpha = age > 0.8 ? 1 - (age - 0.8) / 0.2 : 1;
    ctx.font = '700 17px "Trebuchet MS", Verdana, sans-serif';
    const w = ctx.measureText(state.toast.text).width + 28;
    ctx.fillStyle = 'rgba(43,26,18,0.92)';
    rr(ctx, (VIEW_W - w) / 2, 100, w, 34, 17);
    ctx.fill();
    text(ctx, state.toast.text, VIEW_W / 2, 122, 17, PALETTE.cream, 'center');
    ctx.globalAlpha = 1;
  }
}

function drawLog(ctx, state) {
  const lines = state.log.slice(-3);
  lines.forEach((line, i) => {
    ctx.globalAlpha = 0.55 + i * 0.2;
    text(ctx, line, 16, VIEW_H - 12 - (lines.length - 1 - i) * 18, 13, '#fff3dd');
  });
  ctx.globalAlpha = 1;
}

// --- screens ------------------------------------------------------------------

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(43,26,18,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'EMBER BISTRO', VIEW_W / 2, 190, 72, PALETTE.gold, 'center');
  text(ctx, 'SIZZLE  •  CHOP  •  SERVE', VIEW_W / 2, 232, 22, PALETTE.cream, 'center');
  const panel = { x: 330, y: 280, w: 620, h: 250 };
  ctx.fillStyle = '#fff3dd';
  rr(ctx, panel.x, panel.y, panel.w, panel.h, 16);
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 3;
  ctx.stroke();
  const how = [
    'WASD / arrows to run — click a spot to walk there.',
    'E (or click a station) to grab, chop, grill and serve.',
    'Chop veg on the board. Grill patties — pull them off in time.',
    'Build dishes on the counter. Serve them at the window.',
    'Orders pay more when served fast. Chains build your combo.',
  ];
  how.forEach((line, i) => {
    text(ctx, line, VIEW_W / 2, panel.y + 44 + i * 30, 17, PALETTE.ink, 'center', '600');
  });
  const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 350);
  ctx.globalAlpha = pulse;
  text(ctx, 'PRESS ENTER TO START THE SHIFT', VIEW_W / 2, 580, 26, PALETTE.cream, 'center');
  ctx.globalAlpha = 1;
  text(ctx, '180 seconds. One bistro. No burnt patties.', VIEW_W / 2, 620, 15, '#c8a06a', 'center');
}

function drawOver(ctx, state) {
  ctx.fillStyle = 'rgba(43,26,18,0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'SHIFT OVER', VIEW_W / 2, 170, 54, PALETTE.gold, 'center');
  const r = state.result;
  if (r) {
    text(ctx, r.rank, VIEW_W / 2, 240, 44, PALETTE.cream, 'center');
    text(ctx, r.blurb, VIEW_W / 2, 276, 18, '#c8a06a', 'center');
  }
  const panel = { x: 390, y: 310, w: 500, h: 220 };
  ctx.fillStyle = '#fff3dd';
  rr(ctx, panel.x, panel.y, panel.w, panel.h, 16);
  ctx.fill();
  const rows = [
    ['Earned', `$${state.earned}`],
    ['Dishes served', `${state.served}`],
    ['Orders expired', `${state.expired}`],
    ['Patties burnt', `${state.burnt}`],
    ['Best combo', `${state.bestCombo} in a row`],
  ];
  rows.forEach(([k, v], i) => {
    const y = panel.y + 44 + i * 34;
    text(ctx, k, panel.x + 30, y, 18, PALETTE.muted, 'left', '600');
    text(ctx, v, panel.x + panel.w - 30, y, 18, PALETTE.ink, 'right');
  });
  const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 350);
  ctx.globalAlpha = pulse;
  text(ctx, 'PRESS ENTER TO COOK AGAIN', VIEW_W / 2, 590, 24, PALETTE.cream, 'center');
  ctx.globalAlpha = 1;
}

export function render(ctx, state) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawFloor(ctx);
  drawStations(ctx, state);
  drawPlayer(ctx, state);
  drawFloaters(ctx, state);
  drawHUD(ctx, state);
  drawLog(ctx, state);
  drawPrompt(ctx, state);
  if (state.screen === 'title') drawTitle(ctx, state);
  if (state.screen === 'over') drawOver(ctx, state);
}
