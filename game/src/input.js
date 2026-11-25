// Ember Bistro — keyboard and mouse state.
// One job: turn raw DOM events into one clean input snapshot per frame.

export function newInput() {
  return {
    keys: new Set(),
    pressed: new Set(),
    mouse: { x: 0, y: 0, clicked: false, down: false },
  };
}

export function attachInput(input, canvas) {
  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
      event.preventDefault();
    }
    if (!event.repeat) input.pressed.add(event.key.toLowerCase());
    input.keys.add(event.key.toLowerCase());
  });
  window.addEventListener('keyup', (event) => {
    input.keys.delete(event.key.toLowerCase());
  });
  window.addEventListener('blur', () => {
    input.keys.clear();
    input.mouse.down = false;
  });
  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.mouse.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    input.mouse.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
  });
  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.mouse.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    input.mouse.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    input.mouse.down = true;
    input.mouse.clicked = true;
  });
  window.addEventListener('mouseup', () => {
    input.mouse.down = false;
  });
}

export function endFrameInput(input) {
  input.pressed.clear();
  input.mouse.clicked = false;
}

export function moveVector(input) {
  const keys = input.keys;
  let x = 0;
  let y = 0;
  if (keys.has('a') || keys.has('arrowleft')) x -= 1;
  if (keys.has('d') || keys.has('arrowright')) x += 1;
  if (keys.has('w') || keys.has('arrowup')) y -= 1;
  if (keys.has('s') || keys.has('arrowdown')) y += 1;
  if (x !== 0 && y !== 0) {
    const inv = 1 / Math.hypot(x, y);
    x *= inv;
    y *= inv;
  }
  return { x, y };
}

export function interactPressed(input) {
  return input.pressed.has('e') || input.pressed.has(' ') || input.pressed.has('enter');
}

export function anyKeyPressed(input) {
  return input.pressed.size > 0 || input.mouse.clicked;
}
