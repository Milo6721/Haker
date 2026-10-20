/* wspólne narzędzia */
const $ = (sel, root = document) => root.querySelector(sel);
const rand = (a, b) => Math.random() * (b - a) + a;
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const pad = (n, l = 2) => String(n).padStart(l, "0");
const hex = (n, l = 2) => n.toString(16).toUpperCase().padStart(l, "0");

const COLORS = {
  cyan: "#00ffe5",
  cyan2: "#00d9c0",
  green: "#00ff66",
  green2: "#39ff14",
  red: "#ff2a4d",
  yellow: "#ffe14a",
};

const randIp = () => `${randInt(1, 223)}.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`;
const randPrivateIp = () => `192.168.${randInt(0, 40)}.${randInt(2, 254)}`;

/**
 * Dopasowuje canvas do rozmiaru kontenera (z obsługą devicePixelRatio).
 * Zwraca obiekt { ctx, size } – size.w / size.h w pikselach CSS.
 */
function fitCanvas(canvas, onResize) {
  const ctx = canvas.getContext("2d");
  const size = { w: 0, h: 0, dpr: 1 };
  const fit = () => {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    size.w = Math.max(1, r.width);
    size.h = Math.max(1, r.height);
    size.dpr = dpr;
    canvas.width = Math.round(size.w * dpr);
    canvas.height = Math.round(size.h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (onResize) onResize(size, ctx);
  };
  if (window.ResizeObserver) new ResizeObserver(fit).observe(canvas);
  else window.addEventListener("resize", fit);
  fit();
  return { ctx, size, canvas };
}

/** pętla animacji z dt w sekundach */
function loop(fn) {
  let last = performance.now();
  const frame = now => {
    const dt = clamp((now - last) / 1000, 0, 0.1);
    last = now;
    fn(dt, now / 1000);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/** hook na zdarzenia globalne (np. zmiana statusu systemu) */
const bus = {
  _h: {},
  on(e, f) { (this._h[e] = this._h[e] || []).push(f); },
  emit(e, d) { (this._h[e] || []).forEach(f => f(d)); },
};
