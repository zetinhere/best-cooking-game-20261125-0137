// Ember Bistro — procedural WebAudio sounds, no audio files.
// One job: every blip, chop, sizzle and ding the kitchen makes.

export function newAudio() {
  return { ctx: null, sizzle: null, muted: false };
}

function ensureContext(audio) {
  if (!audio.ctx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audio.ctx = new Ctx();
  }
  if (audio.ctx.state === 'suspended') audio.ctx.resume();
  return audio.ctx;
}

export function unlockAudio(audio) {
  ensureContext(audio);
}

function tone(audio, freq, dur, type, gain, when = 0) {
  const ctx = ensureContext(audio);
  if (!ctx || audio.muted) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(audio, dur, filterFreq, gain) {
  const ctx = ensureContext(audio);
  if (!ctx || audio.muted) return;
  const len = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const amp = ctx.createGain();
  amp.gain.value = gain;
  src.connect(filter).connect(amp).connect(ctx.destination);
  src.start();
}

export function playChop(audio) {
  noiseBurst(audio, 0.09, 1800, 0.5);
  tone(audio, 140, 0.07, 'square', 0.12);
}

export function playPickup(audio) {
  tone(audio, 520, 0.08, 'sine', 0.18);
}

export function playPlace(audio) {
  tone(audio, 300, 0.08, 'triangle', 0.2);
  noiseBurst(audio, 0.05, 900, 0.2);
}

export function playServe(audio) {
  tone(audio, 880, 0.12, 'sine', 0.22);
  tone(audio, 1318, 0.2, 'sine', 0.2, 0.1);
}

export function playCoin(audio) {
  tone(audio, 988, 0.09, 'triangle', 0.2);
  tone(audio, 1319, 0.09, 'triangle', 0.2, 0.08);
  tone(audio, 1568, 0.16, 'triangle', 0.18, 0.16);
}

export function playError(audio) {
  tone(audio, 160, 0.18, 'square', 0.16);
  tone(audio, 120, 0.22, 'square', 0.14, 0.1);
}

export function playExpire(audio) {
  tone(audio, 392, 0.15, 'sawtooth', 0.1);
  tone(audio, 311, 0.25, 'sawtooth', 0.1, 0.14);
}

export function playBurnt(audio) {
  noiseBurst(audio, 0.25, 500, 0.3);
  tone(audio, 90, 0.3, 'sawtooth', 0.14);
}

// A soft looping sizzle while any patty cooks on the grill.
export function setSizzle(audio, on) {
  const ctx = ensureContext(audio);
  if (!ctx) return;
  if (on && !audio.sizzle) {
    const len = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3200;
    const amp = ctx.createGain();
    amp.gain.value = audio.muted ? 0 : 0.045;
    src.connect(filter).connect(amp).connect(ctx.destination);
    src.start();
    audio.sizzle = { src, amp };
  } else if (!on && audio.sizzle) {
    try {
      audio.sizzle.src.stop();
    } catch {
      // already stopped
    }
    audio.sizzle = null;
  }
}
