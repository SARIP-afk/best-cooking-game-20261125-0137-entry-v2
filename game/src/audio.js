// The Golden Ladle — tiny synthesized sound effects (WebAudio, no audio files).
// Everything is generated with oscillators and filtered noise at run time.
let ctx = null;
let muted = false;
let sizzleNode = null;

export function isMuted() { return muted; }
export function toggleMute() { muted = !muted; return muted; }

function ac() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq, dur, type, vol, when = 0, slideTo = null) {
  if (muted) return;
  const c = ac(); if (!c) return;
  const t0 = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

export const sfx = {
  pickup() { tone(520, 0.09, 'triangle', 0.10, 0, 760); },
  grill() { tone(220, 0.12, 'square', 0.06, 0, 160); tone(880, 0.08, 'sine', 0.05, 0.05); },
  cooked() { tone(660, 0.1, 'sine', 0.09); tone(990, 0.14, 'sine', 0.09, 0.09); },
  serve() { tone(523, 0.12, 'sine', 0.12); tone(659, 0.12, 'sine', 0.12, 0.08); tone(784, 0.22, 'sine', 0.13, 0.16); },
  wrong() { tone(180, 0.22, 'sawtooth', 0.08, 0, 110); },
  tick() { tone(1040, 0.05, 'square', 0.04); },
  levelup() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.11, i * 0.09)); },
  lost() { tone(392, 0.2, 'triangle', 0.09, 0, 260); tone(262, 0.3, 'triangle', 0.09, 0.15, 180); },
  click() { tone(700, 0.05, 'sine', 0.06); },
  start() { [392, 523, 659].forEach((f, i) => tone(f, 0.14, 'triangle', 0.10, i * 0.08)); },
  chop() { tone(300, 0.06, 'square', 0.07, 0, 140); tone(150, 0.05, 'triangle', 0.08, 0.02); },
  rush() { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, 'square', 0.07, i * 0.06)); },
};

// Gentle looping sizzle while any patty is on the grill.
export function setSizzle(on) {
  const c = ac(); if (!c) return;
  if (on && !sizzleNode) {
    try {
      const len = c.sampleRate * 1;
      const buf = c.createBuffer(1, len, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.25;
      const src = c.createBufferSource();
      src.buffer = buf; src.loop = true;
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 4200; f.Q.value = 0.6;
      const g = c.createGain(); g.gain.value = 0.035;
      src.connect(f).connect(g).connect(c.destination);
      src.start();
      sizzleNode = { src, g };
    } catch { /* sound is optional */ }
  } else if (!on && sizzleNode) {
    try { sizzleNode.src.stop(); } catch { /* already stopped */ }
    sizzleNode = null;
  }
}
