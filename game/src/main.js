// Ember Bistro — main loop and screen flow.
// One job: own the canvas, the clock and the shot mode, and hand the rest
// to state, world and render.

import { VIEW_H, VIEW_W } from './config.js';
import { attachInput, endFrameInput, newInput } from './input.js';
import { render } from './render.js';
import { stageShot } from './shots.js';
import { newGame } from './state.js';
import { newAudio, unlockAudio } from './audio.js';
import { startShift, update } from './world.js';

const canvas = document.getElementById('game');
canvas.width = VIEW_W;
canvas.height = VIEW_H;
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;

const input = newInput();
attachInput(input, canvas);
const audio = newAudio();

let state;
if (shotName) {
  // Screenshot mode: stage one frozen scene and render it, advancing only
  // the animation clock so glows and pulses read alive.
  state = stageShot(shotName, seed) || newGame(seed);
  document.title = `Ember Bistro — shot ${shotName}`;
} else {
  state = newGame(seed);
}

// Dev handle for automated play-tests: read-only view of the live state.
window.__emberBistro = { get state() { return state; } };

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (shotName) {
    state.now += dt * 1000;
  } else {
    if (state.screen === 'title' && (input.pressed.has('enter') || input.pressed.has(' ') || input.mouse.clicked)) {
      unlockAudio(audio);
      startShift(state);
    } else if (state.screen === 'over' && (input.pressed.has('enter') || input.pressed.has(' ') || input.mouse.clicked)) {
      unlockAudio(audio);
      startShift(state);
    } else if (state.screen === 'play') {
      if (input.pressed.size > 0 || input.mouse.clicked) unlockAudio(audio);
      update(state, input, dt, audio);
    }
  }
  render(ctx, state);
  endFrameInput(input);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
