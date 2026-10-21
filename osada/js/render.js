/* renderowanie: kamera, teren, obiekty, postaci, noc, deszcz */

const rr = (c, x, y, w, h, r) => {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
};
const shade = (hex, amt) => {
  const n = parseInt(hex.slice(1), 16);
  const f = v => clamp(Math.round(v + amt), 0, 255);
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
};

function daylight(h) {
  if (h >= 7 && h <= 18) return 1;
  if (h >= 5 && h < 7) return (h - 5) / 2;
  if (h > 18 && h <= 20.5) return 1 - (h - 18) / 2.5;
  return 0;
}

/* ===== rysowanie obiektów (współrzędne w pikselach świata) ===== */
const DRAW = {
  bed(c, o, R) {
    const x = o.x * TILE, y = o.y * TILE, w = o.w * TILE, h = TILE;
    c.fillStyle = "#6b4a35"; rr(c, x + 1, y + 3, w - 2, h - 5, 4); c.fill();
    c.fillStyle = "#f4efe4"; rr(c, x + 3, y + 5, w - 6, h - 9, 3); c.fill();
    c.fillStyle = "#fff"; rr(c, x + 4, y + 7, 12, h - 13, 4); c.fill();
    const col = ["#e57373", "#64b5f6", "#81c784", "#ba68c8", "#ffb74d"][Math.floor(hash2(o.x, o.y) * 5)];
    c.fillStyle = col; rr(c, x + 16, y + 5, w - 19, h - 9, 3); c.fill();
    c.fillStyle = "rgba(255,255,255,.18)"; c.fillRect(x + 18, y + 7, w - 24, 3);
    const s = o.data.sleeper && R.sim.byId(o.data.sleeper);
    if (s) {
      c.fillStyle = s.look.skin; c.beginPath(); c.arc(x + 10, y + 13, 5, 0, 7); c.fill();
      c.fillStyle = s.look.hair; c.beginPath(); c.arc(x + 10, y + 11.5, 5, Math.PI, 0); c.fill();
      c.strokeStyle = "#333"; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 8, y + 13.5); c.lineTo(x + 10, y + 13.5); c.stroke();
      c.fillStyle = col; rr(c, x + 15, y + 7, w - 18, h - 12, 3); c.fill();
      c.fillStyle = "rgba(255,255,255,.18)"; c.fillRect(x + 17, y + 9, w - 24, 2);
    }
  },
  crib(c, o) {
    const x = o.x * TILE, y = o.y * TILE;
    c.fillStyle = "#e8d5b5"; rr(c, x + 2, y + 5, TILE - 4, TILE - 8, 3); c.fill();
    c.fillStyle = "#fff"; rr(c, x + 5, y + 8, TILE - 10, TILE - 14, 3); c.fill();
    c.strokeStyle = "#c9a97a"; c.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(x + 4 + i * 6, y + 5); c.lineTo(x + 4 + i * 6, y + TILE - 3); c.stroke(); }
  },
  fridge(c, o) {
    const x = o.x * TILE, y = o.y * TILE;
    c.fillStyle = "#cfd8dc"; rr(c, x + 4, y + 1, TILE - 8, TILE - 3, 3); c.fill();
    c.fillStyle = "#eceff1"; rr(c, x + 5, y + 2, TILE - 10, TILE - 6, 2); c.fill();
    c.fillStyle = "#90a4ae"; c.fillRect(x + 5, y + 11, TILE - 10, 1.5);
    c.fillRect(x + TILE - 9, y + 5, 1.8, 4); c.fillRect(x + TILE - 9, y + 14, 1.8, 6);
    if (o.data.food === 0) { c.fillStyle = "#e53935"; c.fillRect(x + 8, y + 5, 4, 2); }
  },
  tv(c, o, R) {
    const x = o.x * TILE, y = o.y * TILE, w = o.w * TILE;
    c.fillStyle = "#37474f"; rr(c, x + 3, y + 3, w - 6, TILE - 10, 3); c.fill();
    const on = o.data.users > 0;
    if (on) {
      const g = c.createLinearGradient(x, y, x + w, y);
      const t = R.t * 2;
      g.addColorStop(0, `hsl(${(t * 40) % 360},70%,55%)`); g.addColorStop(1, `hsl(${(t * 40 + 120) % 360},70%,55%)`);
      c.fillStyle = g;
    } else c.fillStyle = "#1c262b";
    rr(c, x + 6, y + 5, w - 12, TILE - 15, 2); c.fill();
    c.fillStyle = "#263238"; c.fillRect(x + w / 2 - 6, y + TILE - 7, 12, 3);
  },
  sofa(c, o) {
    const x = o.x * TILE, y = o.y * TILE, w = o.w * TILE;
    const col = ["#8e6bbf", "#c0614e", "#4f8f9c", "#6e8f4f"][Math.floor(hash2(o.x + 5, o.y) * 4)];
    c.fillStyle = shade("#000000", 0); c.fillStyle = col;
    rr(c, x + 1, y + 3, w - 2, TILE - 5, 5); c.fill();
    c.fillStyle = "rgba(255,255,255,.2)"; rr(c, x + 4, y + 10, w - 8, TILE - 15, 4); c.fill();
    c.fillStyle = "rgba(0,0,0,.18)"; c.fillRect(x + w / 2 - 0.5, y + 10, 1, TILE - 15);
  },
  table(c, o) {
    const x = o.x * TILE, y = o.y * TILE, w = o.w * TILE;
    c.fillStyle = "#8d6240"; rr(c, x + 2, y + 5, w - 4, TILE - 9, 4); c.fill();
    c.fillStyle = "#a97a52"; rr(c, x + 3, y + 6, w - 6, TILE - 13, 3); c.fill();
    c.fillStyle = "#fff"; c.beginPath(); c.arc(x + 16, y + 13, 4, 0, 7); c.fill();
    c.fillStyle = "#e57373"; c.beginPath(); c.arc(x + 38, y + 12, 3, 0, 7); c.fill();
  },
  desk(c, o, R) {
    const x = o.x * TILE, y = o.y * TILE, w = o.w * TILE;
    c.fillStyle = "#6d4c41"; rr(c, x + 2, y + 6, w - 4, TILE - 9, 3); c.fill();
    c.fillStyle = "#263238"; rr(c, x + 12, y - 1, 24, 15, 2); c.fill();
    c.fillStyle = "#4fc3f7"; c.fillRect(x + 14, y + 1, 20, 10);
    c.fillStyle = "rgba(255,255,255,.35)"; c.fillRect(x + 16, y + 3, 9, 2);
    c.fillStyle = "#90a4ae"; c.fillRect(x + 22, y + 14, 4, 2);
  },
  piano(c, o) {
    const x = o.x * TILE, y = o.y * TILE, w = o.w * TILE;
    c.fillStyle = "#212121"; rr(c, x + 1, y + 1, w - 2, TILE - 2, 3); c.fill();
    c.fillStyle = "#fafafa"; c.fillRect(x + 4, y + 14, w - 8, 9);
    c.fillStyle = "#212121";
    for (let i = 0; i < 7; i++) c.fillRect(x + 7 + i * 6.3, y + 14, 3, 5);
    c.fillStyle = "#555"; c.fillRect(x + 4, y + 4, w - 8, 3);
  },
  lamp(c, o, R) {
    const x = o.x * TILE + TILE / 2, y = o.y * TILE;
    c.fillStyle = "#37474f"; c.fillRect(x - 1.5, y + 8, 3, TILE - 10);
    c.fillStyle = "#263238"; c.beginPath(); c.ellipse(x, y + TILE - 2, 6, 3, 0, 0, 7); c.fill();
    const night = daylight(R.sim.hour) < 0.8;
    c.fillStyle = night ? "#fff2a8" : "#e0d9b0"; c.beginPath(); c.arc(x, y + 7, 5, 0, 7); c.fill();
    c.strokeStyle = "#37474f"; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y + 7, 5, 0, 7); c.stroke();
  },
  rug(c, o) {
    const x = o.x * TILE, y = o.y * TILE, w = o.w * TILE, h = o.h * TILE;
    c.fillStyle = "#b5524a"; rr(c, x + 2, y + 2, w - 4, h - 4, 6); c.fill();
    c.strokeStyle = "#f3d9a4"; c.lineWidth = 2; rr(c, x + 6, y + 6, w - 12, h - 12, 4); c.stroke();
    c.fillStyle = "#f3d9a4"; c.beginPath(); c.arc(x + w / 2, y + h / 2, 5, 0, 7); c.fill();
  },
  tree(c, o, R) {
    const x = o.x * TILE + TILE / 2, y = o.y * TILE + TILE;
    const sway = Math.sin(R.t * 1.2 + o.x * 0.7 + o.y) * 1.2;
    const k = 0.9 + hash2(o.x, o.y) * 0.4;
    c.fillStyle = "rgba(0,0,0,.2)"; c.beginPath(); c.ellipse(x, y - 1, 11 * k, 4, 0, 0, 7); c.fill();
    c.fillStyle = "#6b4528"; c.fillRect(x - 2.5, y - 14, 5, 14);
    const gl = hash2(o.y, o.x) > 0.5;
    const col = gl ? "#2e8b4a" : "#3a9a3f";
    c.fillStyle = shade("#2e8b4a", -30); c.beginPath(); c.arc(x + sway * 0.5, y - 20, 13 * k, 0, 7); c.fill();
    c.fillStyle = col; c.beginPath(); c.arc(x + sway - 3, y - 24, 11 * k, 0, 7); c.fill();
    c.beginPath(); c.arc(x + sway + 5, y - 20, 9 * k, 0, 7); c.fill();
    c.fillStyle = "rgba(255,255,255,.12)"; c.beginPath(); c.arc(x + sway - 5, y - 28, 5 * k, 0, 7); c.fill();
  },
  bush(c, o) {
    const x = o.x * TILE + TILE / 2, y = o.y * TILE + TILE - 2;
    c.fillStyle = "rgba(0,0,0,.2)"; c.beginPath(); c.ellipse(x, y, 11, 4, 0, 0, 7); c.fill();
    c.fillStyle = "#2f7d3a"; c.beginPath(); c.arc(x - 5, y - 6, 7, 0, 7); c.arc(x + 5, y - 6, 7, 0, 7); c.arc(x, y - 10, 8, 0, 7); c.fill();
    c.fillStyle = "#3b9446"; c.beginPath(); c.arc(x - 2, y - 11, 5, 0, 7); c.fill();
    for (let i = 0; i < o.data.berries; i++) {
      c.fillStyle = "#4a3fd1"; c.beginPath(); c.arc(x - 7 + i * 5 + hash2(i, o.x) * 2, y - 5 - (i % 2) * 5, 2.2, 0, 7); c.fill();
    }
  },
  flowers(c, o) {
    const x = o.x * TILE, y = o.y * TILE;
    const cols = ["#ff8fab", "#ffd166", "#b794f6", "#ffffff", "#ff6b6b"];
    for (let i = 0; i < 4; i++) {
      const fx = x + 5 + hash2(o.x + i, o.y) * 18, fy = y + 6 + hash2(o.x, o.y + i * 3) * 16;
      c.strokeStyle = "#3a7d34"; c.lineWidth = 1; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx, fy + 5); c.stroke();
      c.fillStyle = cols[Math.floor(hash2(o.x * 3 + i, o.y) * 5)]; c.beginPath(); c.arc(fx, fy, 2.6, 0, 7); c.fill();
      c.fillStyle = "#ffe08a"; c.beginPath(); c.arc(fx, fy, 1, 0, 7); c.fill();
    }
  },
  bench(c, o) {
    const x = o.x * TILE, y = o.y * TILE, w = o.w * TILE;
    c.fillStyle = "rgba(0,0,0,.15)"; c.fillRect(x + 3, y + TILE - 4, w - 6, 3);
    c.fillStyle = "#7b5836"; c.fillRect(x + 4, y + 14, 3, 10); c.fillRect(x + w - 7, y + 14, 3, 10);
    c.fillStyle = "#a47a4c"; rr(c, x + 2, y + 9, w - 4, 7, 2); c.fill();
    c.fillStyle = "#8e6a40"; rr(c, x + 2, y + 3, w - 4, 5, 2); c.fill();
  },
  campfire(c, o, R) {
    const x = o.x * TILE + TILE / 2, y = o.y * TILE + TILE - 5;
    c.fillStyle = "#757575"; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; c.beginPath(); c.arc(x + Math.cos(a) * 9, y + Math.sin(a) * 4, 2.6, 0, 7); c.fill(); }
    c.fillStyle = "#5d4037"; c.save(); c.translate(x, y); c.rotate(0.5); c.fillRect(-8, -2, 16, 4); c.rotate(-1); c.fillRect(-8, -2, 16, 4); c.restore();
    const f = 1 + Math.sin(R.t * 12 + o.x) * 0.12 + Math.sin(R.t * 7.3) * 0.08;
    const flame = (col, w, h, dx) => { c.fillStyle = col; c.beginPath(); c.moveTo(x - w + dx, y); c.quadraticCurveTo(x - w * 0.8 + dx, y - h * 0.6 * f, x + dx + Math.sin(R.t * 9) * 1.5, y - h * f); c.quadraticCurveTo(x + w * 0.8 + dx, y - h * 0.6 * f, x + w + dx, y); c.fill(); };
    flame("#ff7043", 8, 22, 0); flame("#ffb74d", 5.5, 15, 1); flame("#fff59d", 3, 9, 0);
  },
  stall(c, o) {
    const x = o.x * TILE, y = o.y * TILE, w = o.w * TILE;
    c.fillStyle = "#7b5836"; rr(c, x + 2, y + 12, w - 4, TILE - 12, 3); c.fill();
    c.fillStyle = "#a47a4c"; rr(c, x + 3, y + 13, w - 6, 8, 2); c.fill();
    for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? "#fff" : "#e53935"; c.fillRect(x + 2 + i * ((w - 4) / 6), y - 2, (w - 4) / 6 + 0.5, 11); }
    c.fillStyle = "#e53935"; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(x + 10 + i * 10, y + 15, 3, 0, 7); c.fill(); }
    c.fillStyle = "#43a047"; c.beginPath(); c.arc(x + 15, y + 16, 2.2, 0, 7); c.fill();
  },
  workbench(c, o) {
    const x = o.x * TILE, y = o.y * TILE, w = o.w * TILE;
    c.fillStyle = "#5d4037"; rr(c, x + 2, y + 8, w - 4, TILE - 10, 3); c.fill();
    c.fillStyle = "#8d6e63"; rr(c, x + 3, y + 8, w - 6, 8, 2); c.fill();
    c.fillStyle = "#b0bec5"; c.fillRect(x + 8, y + 3, 3, 8); c.fillStyle = "#795548"; c.fillRect(x + 7, y + 3, 5, 3);
    c.fillStyle = "#cfd8dc"; c.fillRect(x + 28, y + 5, 12, 3);
  },
  grave(c, o) {
    const x = o.x * TILE + TILE / 2, y = o.y * TILE + TILE - 4;
    c.fillStyle = "#9e9e9e"; rr(c, x - 7, y - 16, 14, 18, 6); c.fill();
    c.strokeStyle = "#616161"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y - 12); c.lineTo(x, y - 4); c.moveTo(x - 3, y - 9); c.lineTo(x + 3, y - 9); c.stroke();
  },
};
const FLAT = new Set(["rug", "flowers", "grave"]);

class Renderer {
  constructor(canvas, sim) {
    this.canvas = canvas; this.ctx = canvas.getContext("2d"); this.sim = sim;
    this.cam = { x: GW * TILE / 2, y: GH * TILE / 2, zoom: 0.8 };
    this.t = 0; this.dpr = 1; this.w = 1; this.h = 1;
    this.terrainCanvas = document.createElement("canvas");
    this.dark = document.createElement("canvas"); this.dctx = this.dark.getContext("2d");
    this.tver = -1;
    this.drops = [];
    this.fitted = false;
    new ResizeObserver(() => this.resize()).observe(canvas);
    this.resize();
  }
  resize() {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
    this.canvas.width = Math.round(this.w * this.dpr); this.canvas.height = Math.round(this.h * this.dpr);
    this.dark.width = this.canvas.width; this.dark.height = this.canvas.height;
    if (!this.fitted && r.width > 50) { this.fit(); this.fitted = true; }
  }
  fit() {
    let z = Math.min(this.w / (GW * TILE), this.h / (GH * TILE)) * 1.02;
    this.cam.x = GW * TILE / 2; this.cam.y = GH * TILE / 2;
    if (this.w < 700) { z = Math.max(z, 0.62); this.cam.x = 22 * TILE; this.cam.y = 18 * TILE; }
    this.cam.zoom = z;
  }
  toScreen(wx, wy) { return [(wx - this.cam.x) * this.cam.zoom + this.w / 2, (wy - this.cam.y) * this.cam.zoom + this.h / 2]; }
  toWorld(sx, sy) { return [(sx - this.w / 2) / this.cam.zoom + this.cam.x, (sy - this.h / 2) / this.cam.zoom + this.cam.y]; }
  clampCam() {
    const c = this.cam;
    c.zoom = clamp(c.zoom, Math.min(this.w / (GW * TILE), this.h / (GH * TILE)) * 0.6, 3);
    c.x = clamp(c.x, 0, GW * TILE); c.y = clamp(c.y, 0, GH * TILE);
  }

  /* ---------- teren ---------- */
  renderTerrain() {
    const w = this.sim.world, c = this.terrainCanvas;
    c.width = GW * TILE; c.height = GH * TILE;
    const g = c.getContext("2d");
    const T_ = (x, y) => (w.inb(x, y) ? w.terrain[w.idx(x, y)] : T.GRASS);
    const W_ = (x, y) => w.inb(x, y) && w.wall[w.idx(x, y)];
    this.waterTiles = [];
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      const t = w.terrain[w.idx(x, y)], px = x * TILE, py = y * TILE, h = hash2(x, y);
      if (t === T.WATER) {
        g.fillStyle = `hsl(${205 + h * 8},62%,${44 + h * 6}%)`; g.fillRect(px, py, TILE, TILE);
        this.waterTiles.push([px, py, h]);
        const edge = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        g.fillStyle = "rgba(255,255,255,.18)";
        edge.forEach(([dx, dy]) => { if (T_(x + dx, y + dy) !== T.WATER) { if (dx) g.fillRect(dx < 0 ? px : px + TILE - 3, py, 3, TILE); else g.fillRect(px, dy < 0 ? py : py + TILE - 3, TILE, 3); } });
        continue;
      }
      const nearWater = [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dy]) => T_(x + dx, y + dy) === T.WATER);
      if (t === T.GRASS) {
        if (nearWater) { g.fillStyle = `hsl(44,45%,${72 + h * 6}%)`; g.fillRect(px, py, TILE, TILE); g.fillStyle = "rgba(160,130,70,.25)"; for (let i = 0; i < 3; i++) g.fillRect(px + hash2(x + i, y) * 24, py + hash2(x, y + i) * 24, 2, 2); }
        else {
          g.fillStyle = `hsl(${100 + h * 14},${42 + h * 8}%,${38 + h * 7}%)`; g.fillRect(px, py, TILE, TILE);
          g.strokeStyle = `rgba(255,255,255,${0.05 + h * 0.06})`; g.lineWidth = 1;
          for (let i = 0; i < 3; i++) { const tx = px + hash2(x * 3 + i, y * 5) * 24 + 2, ty = py + hash2(x * 5, y * 3 + i) * 22 + 4; g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx - 1, ty - 4); g.moveTo(tx, ty); g.lineTo(tx + 2, ty - 3); g.stroke(); }
        }
      } else if (t === T.PATH) {
        g.fillStyle = `hsl(40,${34 + h * 8}%,${68 + h * 6}%)`; g.fillRect(px, py, TILE, TILE);
        g.fillStyle = "rgba(120,90,50,.25)"; for (let i = 0; i < 4; i++) g.fillRect(px + hash2(x + i, y * 2) * 24, py + hash2(x * 2, y + i) * 24, 2.5, 2);
      } else if (t === T.FLOOR) {
        g.fillStyle = (x + y) % 2 ? "#cf9f66" : "#c8975c"; g.fillRect(px, py, TILE, TILE);
        g.fillStyle = "rgba(90,55,25,.25)"; for (let i = 1; i < 4; i++) g.fillRect(px, py + i * 7, TILE, 1);
        g.fillStyle = "rgba(255,255,255,.07)"; g.fillRect(px, py, TILE, 2);
      }
    }
    // ściany
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      if (!W_(x, y)) continue;
      const px = x * TILE, py = y * TILE;
      g.fillStyle = "#8d6e57"; g.fillRect(px, py, TILE, TILE);
      g.fillStyle = "#a88a72"; g.fillRect(px, py, TILE, 18);
      g.fillStyle = "rgba(255,255,255,.18)"; g.fillRect(px, py, TILE, 2);
      g.fillStyle = "#5e4535"; g.fillRect(px, py + 19, TILE, TILE - 19);
      g.fillStyle = "rgba(0,0,0,.18)"; g.fillRect(px, py + 18, TILE, 1);
      if (!W_(x + 1, y)) { g.fillStyle = "rgba(0,0,0,.2)"; g.fillRect(px + TILE - 2, py, 2, TILE); }
      // okna
      if (W_(x - 1, y) && W_(x + 1, y) && x % 3 === 1 && !W_(x, y + 1) !== !W_(x, y - 1)) {
        g.fillStyle = "#6b4f3a"; rr(g, px + 5, py + 3, TILE - 10, 12, 2); g.fill();
        g.fillStyle = "#a9d6f5"; g.fillRect(px + 7, py + 5, TILE - 14, 8);
        g.fillStyle = "rgba(255,255,255,.5)"; g.fillRect(px + 8, py + 6, 4, 3);
      }
    }
    // progi drzwi
    for (const hm of w.homes) {
      const [dx, dy] = hm.door, px = dx * TILE, py = dy * TILE;
      if (!w.wall[w.idx(dx, dy)]) {
        g.fillStyle = "#7a5230"; g.fillRect(px, py, 4, TILE); g.fillRect(px + TILE - 4, py, 4, TILE);
        g.fillStyle = "#e3b47a"; g.fillRect(px + 4, py + TILE - 5, TILE - 8, 3);
      }
    }
    this.tver = w.tver;
  }

  /* ---------- postać ---------- */
  drawChar(c, ch, ui) {
    const px = ch.x * TILE, py = ch.y * TILE;
    const st = ch.stage;
    const sc = st === "baby" ? 0.5 : st === "child" ? 0.76 : st === "teen" ? 0.9 : 1;
    const L = ch.look;
    const hairCol = st === "elder" ? "#d9d9d9" : L.hair;
    const sleepingInBed = ch.sleeping && ch.pose === "sleep" && ch.sleepBed;
    if (sleepingInBed) return;
    c.save(); c.translate(px, py);
    // cień
    c.fillStyle = "rgba(0,0,0,.25)"; c.beginPath(); c.ellipse(0, 0, 9 * sc, 3.2 * sc, 0, 0, 7); c.fill();

    if (st === "baby" || ch.pose === "sleep") {      // leży
      c.rotate(ch.pose === "sleep" ? 0 : 0);
      const s = st === "baby" ? 1 : sc;
      c.fillStyle = L.shirt; rr(c, -9 * s, -9 * s, 16 * s, 8 * s, 4 * s); c.fill();
      c.fillStyle = L.skin; c.beginPath(); c.arc(-10 * s, -6 * s, 5.5 * s, 0, 7); c.fill();
      c.fillStyle = hairCol; c.beginPath(); c.arc(-10 * s, -8 * s, 5.5 * s, Math.PI, 0); c.fill();
      c.strokeStyle = "#333"; c.lineWidth = 1; c.beginPath(); c.moveTo(-12 * s, -5.5 * s); c.lineTo(-9 * s, -5.5 * s); c.stroke();
      c.fillStyle = "#f4efe4"; rr(c, -3 * s, -10 * s, 12 * s, 9 * s, 3 * s); c.fill();
      c.restore(); return;
    }

    const walk = ch.walking ? Math.sin(ch.anim * 11) : 0;
    const bob = ch.walking ? Math.abs(Math.sin(ch.anim * 11)) * 1.6 : (ch.pose === "dance" ? Math.abs(Math.sin(ch.anim * 8)) * 3 : 0);
    const sit = ch.pose === "sit" || ch.pose === "sleepsit";
    c.scale(sc, sc);
    const f = ch.face || 1;
    const dance = ch.pose === "dance" ? Math.sin(ch.anim * 8) : 0;
    c.translate(dance * 2, 0);
    // nogi
    if (!sit) {
      c.fillStyle = L.pants;
      c.fillRect(-5, -9 - bob * 0.2, 4.2, 9 + walk * 2); c.fillRect(0.8, -9 - bob * 0.2, 4.2, 9 - walk * 2);
      c.fillStyle = "#2a2a2a"; c.fillRect(-5.5, -1 + walk * 2, 5, 2); c.fillRect(0.5, -1 - walk * 2, 5, 2);
    } else {
      c.fillStyle = L.pants; c.fillRect(-5, -7, 10, 4); c.fillRect(f > 0 ? 3 : -8, -5, 5, 4);
    }
    const by = sit ? 4 : 0;
    // tułów
    c.fillStyle = L.shirt; rr(c, -6.5, -21 + by - bob, 13, 13, 4); c.fill();
    c.fillStyle = "rgba(255,255,255,.18)"; rr(c, -5, -20 + by - bob, 10, 4, 2); c.fill();
    // ręce
    c.fillStyle = L.skin;
    if (ch.pose === "dance") { c.fillRect(-9, -26 + by - bob + 6 * Math.max(0, -dance), 3, 9); c.fillRect(6, -26 + by - bob + 6 * Math.max(0, dance), 3, 9); }
    else if (ch.task && ch.task.type === "piano" && ch.task.phase === "do") { c.fillRect(-8, -16 + by + Math.sin(ch.anim * 14) * 1.5, 3, 7); c.fillRect(5, -16 + by - Math.sin(ch.anim * 14) * 1.5, 3, 7); }
    else { c.fillRect(-9, -19 + by - bob + walk * 1.5, 3, 9); c.fillRect(6, -19 + by - bob - walk * 1.5, 3, 9); }
    // głowa
    const hy = -27 + by - bob;
    c.fillStyle = L.skin; c.beginPath(); c.arc(0, hy, 7, 0, 7); c.fill();
    // włosy
    c.fillStyle = hairCol;
    const sty = L.style;
    if (sty === 0) { c.beginPath(); c.arc(0, hy - 1, 7.4, Math.PI * 1.02, Math.PI * 1.98); c.fill(); c.fillRect(-7, hy - 2, 3, 3); }
    else if (sty === 1) { c.beginPath(); c.arc(0, hy - 1, 7.6, Math.PI, 0); c.fill(); c.fillRect(-8, hy - 1, 3.5, 13); c.fillRect(4.5, hy - 1, 3.5, 13); }
    else if (sty === 2) { c.beginPath(); for (let i = -3; i <= 3; i++) { c.moveTo(i * 2.4 - 1.5, hy - 5); c.lineTo(i * 2.4, hy - 11 - (i % 2) * 2); c.lineTo(i * 2.4 + 1.5, hy - 5); } c.fill(); c.beginPath(); c.arc(0, hy - 1, 7.3, Math.PI, 0); c.fill(); }
    else if (sty === 3) { c.beginPath(); c.arc(0, hy - 1, 7.5, Math.PI, 0); c.fill(); c.beginPath(); c.arc(0, hy - 10, 3.4, 0, 7); c.fill(); }
    else if (sty === 4) { c.beginPath(); c.arc(0, hy - 1, 7.4, Math.PI, 0); c.fill(); }
    else { c.beginPath(); c.arc(-5, hy - 3, 4.2, 0, 7); c.arc(5, hy - 3, 4.2, 0, 7); c.arc(0, hy - 6, 5, 0, 7); c.fill(); }
    if (L.hat && st !== "baby") { c.fillStyle = shade(L.shirt, -40); c.fillRect(-8, hy - 4.5, 16, 2.4); rr(c, -5.5, hy - 10, 11, 7, 2); c.fill(); }
    // twarz
    const e = ch.sleeping ? 0 : 1;
    c.fillStyle = "#222";
    if (e) { c.beginPath(); c.arc(-2.5 + f * 0.9, hy + 0.5, 1, 0, 7); c.arc(2.5 + f * 0.9, hy + 0.5, 1, 0, 7); c.fill(); }
    else { c.strokeStyle = "#222"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-4, hy + 0.5); c.lineTo(-1.5, hy + 0.5); c.moveTo(1.5, hy + 0.5); c.lineTo(4, hy + 0.5); c.stroke(); }
    c.strokeStyle = "#7a2e2e"; c.lineWidth = 1;
    const talking = ch.task && ch.task.type === "talk" && ch.task.phase === "do" && ch.bubble;
    if (talking && Math.sin(ch.anim * 14) > 0) { c.fillStyle = "#7a2e2e"; c.beginPath(); c.ellipse(f * 0.9, hy + 3.6, 1.7, 1.3, 0, 0, 7); c.fill(); }
    else {
      c.beginPath();
      if (ch.mood >= 62) c.arc(f * 0.9, hy + 2.2, 2.4, 0.15 * Math.PI, 0.85 * Math.PI);
      else if (ch.mood >= 35) { c.moveTo(-1.5 + f * 0.9, hy + 3.8); c.lineTo(1.5 + f * 0.9, hy + 3.8); }
      else c.arc(f * 0.9, hy + 5.6, 2.3, 1.15 * Math.PI, 1.85 * Math.PI);
      c.stroke();
    }
    if (ch.mood >= 80) { c.fillStyle = "rgba(255,120,120,.35)"; c.beginPath(); c.arc(-4.5, hy + 2.5, 1.6, 0, 7); c.arc(4.5, hy + 2.5, 1.6, 0, 7); c.fill(); }
    c.restore();

    // kryształ nastroju
    const h = -27 * sc - 22 * sc + Math.sin(this.t * 3 + ch.id) * 1.5 + (sit ? 4 * sc : 0);
    c.save(); c.translate(px, py + h);
    c.fillStyle = `hsl(${Math.round(ch.mood * 1.2)},85%,55%)`; c.shadowColor = c.fillStyle; c.shadowBlur = 8;
    c.beginPath(); c.moveTo(0, -6); c.lineTo(4.2, 0); c.lineTo(0, 6); c.lineTo(-4.2, 0); c.closePath(); c.fill();
    c.shadowBlur = 0; c.fillStyle = "rgba(255,255,255,.45)"; c.beginPath(); c.moveTo(0, -6); c.lineTo(4.2, 0); c.lineTo(0, 0); c.closePath(); c.fill();
    c.restore();
  }

  /* ---------- klatka ---------- */
  draw(ui, dtReal) {
    this.t += dtReal;
    const sim = this.sim, w = sim.world, ctx = this.ctx, cam = this.cam, dpr = this.dpr;
    if (this.tver !== w.tver) this.renderTerrain();
    this.clampCam();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#10151f"; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const z = cam.zoom * dpr;
    ctx.setTransform(z, 0, 0, z, (this.w / 2 - cam.x * cam.zoom) * dpr, (this.h / 2 - cam.y * cam.zoom) * dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.terrainCanvas, 0, 0);

    // fale na wodzie
    ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 1;
    for (const [px, py, h] of this.waterTiles || []) {
      const ph = this.t * 0.9 + h * 20;
      if (Math.sin(ph) < 0.25) continue;
      const a = (Math.sin(ph) - 0.25) / 0.75;
      ctx.globalAlpha = a * 0.7;
      ctx.beginPath(); ctx.moveTo(px + 6 + h * 8, py + 10 + h * 6); ctx.quadraticCurveTo(px + 10 + h * 8, py + 7 + h * 6, px + 14 + h * 8, py + 10 + h * 6); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // obiekty płaskie
    for (const o of w.objs) if (FLAT.has(o.type)) DRAW[o.type](ctx, o, this);

    // impreza – kolorowe światła na ziemi
    if (sim.party) {
      for (let i = 0; i < 5; i++) {
        const a = this.t * 1.3 + i * 1.26, r = 40 + Math.sin(this.t * 2 + i) * 10;
        const px = sim.party.x * TILE + Math.cos(a) * 28, py = sim.party.y * TILE + Math.sin(a) * 18;
        const g = ctx.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0, `hsla(${(this.t * 80 + i * 70) % 360},90%,60%,.35)`); g.addColorStop(1, "transparent");
        ctx.fillStyle = g; ctx.fillRect(px - r, py - r, r * 2, r * 2);
      }
    }

    // ścieżka zaznaczonej postaci
    const sel = ui.selChar;
    if (sel && sel.path && sel.path.length && (sim.settings.paths || true)) {
      ctx.strokeStyle = "rgba(255,230,140,.7)"; ctx.setLineDash([4, 5]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sel.x * TILE, sel.y * TILE);
      for (const p of sel.path) ctx.lineTo(p[0] * TILE + TILE / 2, p[1] * TILE + TILE / 2);
      ctx.stroke(); ctx.setLineDash([]);
      const g = sel.path[sel.path.length - 1];
      ctx.fillStyle = "rgba(255,230,140,.85)"; ctx.beginPath(); ctx.arc(g[0] * TILE + TILE / 2, g[1] * TILE + TILE / 2, 4, 0, 7); ctx.fill();
    }

    // sortowane obiekty i postacie
    const items = [];
    for (const o of w.objs) if (!FLAT.has(o.type)) items.push({ y: (o.y + o.h) * TILE, o });
    for (const ch of sim.chars) items.push({ y: ch.y * TILE + (ch.sleeping && ch.pose === "sleepsit" ? 2 : 0), ch });
    items.sort((a, b) => a.y - b.y);
    for (const it of items) {
      if (it.o) DRAW[it.o.type](ctx, it.o, this);
      else {
        const ch = it.ch;
        if (ch.carried) continue;
        if (ch === ui.selChar || ch === ui.hoverChar) {
          ctx.strokeStyle = ch === ui.selChar ? "#ffd166" : "rgba(255,255,255,.7)"; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(ch.x * TILE, ch.y * TILE, 13, 5.5, 0, 0, 7); ctx.stroke();
        }
        this.drawChar(ctx, ch, ui);
      }
    }
    // niesiona postać
    if (ui.carry) { const ch = ui.carry; const sx = ch.x, sy = ch.y; ctx.save(); ctx.globalAlpha = 0.9; this.drawChar(ctx, Object.assign(Object.create(ch), { carried: false, walking: true, anim: this.t }), ui); ctx.restore(); }

    // duszek budowania
    if (ui.ghost) {
      const gh = ui.ghost;
      ctx.globalAlpha = 0.65;
      if (gh.type && DRAW[gh.type]) DRAW[gh.type](ctx, { type: gh.type, x: gh.x, y: gh.y, w: OBJ[gh.type].w, h: OBJ[gh.type].h, data: OBJ[gh.type].init ? OBJ[gh.type].init() : {} }, this);
      ctx.globalAlpha = 0.35; ctx.fillStyle = gh.ok ? "#4cff8a" : "#ff4c5a";
      const gw = gh.type ? OBJ[gh.type].w : 1, ghh = gh.type ? OBJ[gh.type].h : 1;
      ctx.fillRect(gh.x * TILE, gh.y * TILE, gw * TILE, ghh * TILE);
      ctx.globalAlpha = 1;
    }
    if (ui.selObj) {
      const o = ui.selObj;
      ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      ctx.strokeRect(o.x * TILE - 2, o.y * TILE - 2, o.w * TILE + 4, o.h * TILE + 4); ctx.setLineDash([]);
    }

    // efekty emoji
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (const f of sim.fx) {
      ctx.globalAlpha = clamp(1.6 - f.t / f.life * 1.6, 0, 1); ctx.font = "16px system-ui, 'Segoe UI Emoji', sans-serif";
      ctx.fillText(f.text, f.x * TILE, f.y * TILE);
    }
    ctx.globalAlpha = 1;
    // eksplozje
    for (const b of sim.booms) {
      const k = b.t / 1.6, r = 20 + k * 150;
      const g = ctx.createRadialGradient(b.x * TILE, b.y * TILE, 0, b.x * TILE, b.y * TILE, r);
      g.addColorStop(0, `rgba(255,240,170,${0.9 * (1 - k)})`); g.addColorStop(0.5, `rgba(255,120,40,${0.55 * (1 - k)})`); g.addColorStop(1, "rgba(255,60,20,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x * TILE, b.y * TILE, r, 0, 7); ctx.fill();
      ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - k)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(b.x * TILE, b.y * TILE, r * 1.1, 0, 7); ctx.stroke();
    }

    this.drawNight(sim, z);
    this.drawRain(sim, dtReal);
    this.drawLabels(ui);
  }

  drawNight(sim, z) {
    const dl = daylight(sim.hour);
    const rain = sim.rain;
    const dark = (1 - dl) * 0.74 + rain * 0.1 * dl;
    if (dark < 0.02) return;
    const d = this.dctx, W = this.dark.width, H = this.dark.height, cam = this.cam, dpr = this.dpr;
    d.setTransform(1, 0, 0, 1, 0, 0);
    d.globalCompositeOperation = "source-over";
    d.clearRect(0, 0, W, H);
    const dusk = dl > 0 && dl < 1 ? Math.sin(dl * Math.PI) : 0;
    const r = Math.round(lerp(12, 80, dusk)), g = Math.round(lerp(18, 34, dusk)), b = Math.round(lerp(52, 70, dusk));
    d.fillStyle = `rgba(${r},${g},${b},${dark})`; d.fillRect(0, 0, W, H);
    d.globalCompositeOperation = "destination-out";
    const lights = [];
    for (const o of sim.world.objs) { const def = OBJ[o.type]; if (def.light) lights.push([o.x * TILE + TILE / 2, o.y * TILE + TILE / 2, def.light * (o.type === "campfire" ? 1 + Math.sin(this.t * 9) * 0.05 : 1), 1]); }
    for (const h of sim.world.homes) {
      const occ = sim.chars.some(c => c.x >= h.x && c.x < h.x + h.w && c.y >= h.y && c.y < h.y + h.h && !c.sleeping);
      if (occ) lights.push([(h.x + h.w / 2) * TILE, (h.y + h.h / 2) * TILE, 5.2, 0.9]);
    }
    if (sim.party) lights.push([sim.party.x * TILE, sim.party.y * TILE, 8, 0.8]);
    for (const [lx, ly, rad, a] of lights) {
      const sx = ((lx - cam.x) * cam.zoom + this.w / 2) * dpr, sy = ((ly - cam.y) * cam.zoom + this.h / 2) * dpr, R = rad * TILE * z;
      const gr = d.createRadialGradient(sx, sy, 0, sx, sy, R);
      gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(0.55, `rgba(0,0,0,${a * 0.55})`); gr.addColorStop(1, "rgba(0,0,0,0)");
      d.fillStyle = gr; d.fillRect(sx - R, sy - R, R * 2, R * 2);
    }
    d.globalCompositeOperation = "source-over";
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.dark, 0, 0);
    // ciepła poświata
    ctx.globalCompositeOperation = "lighter";
    for (const [lx, ly, rad, a] of lights) {
      const sx = ((lx - cam.x) * cam.zoom + this.w / 2) * dpr, sy = ((ly - cam.y) * cam.zoom + this.h / 2) * dpr, R = rad * 0.8 * TILE * z;
      const gr = ctx.createRadialGradient(sx, sy, 0, sx, sy, R);
      gr.addColorStop(0, `rgba(255,170,70,${0.22 * dark * a})`); gr.addColorStop(1, "rgba(255,150,50,0)");
      ctx.fillStyle = gr; ctx.fillRect(sx - R, sy - R, R * 2, R * 2);
    }
    ctx.globalCompositeOperation = "source-over";
  }

  drawRain(sim, dt) {
    const k = sim.rain;
    if (k < 0.02) return;
    const ctx = this.ctx, W = this.canvas.width, H = this.canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(40,62,98,${0.13 * k})`; ctx.fillRect(0, 0, W, H);
    const want = Math.round(k * 380 * (W * H) / (1400 * 900));
    while (this.drops.length < want) this.drops.push({ x: Math.random() * (W + 200), y: Math.random() * H, l: rand(10, 22), v: rand(900, 1300) });
    if (this.drops.length > want) this.drops.length = want;
    ctx.strokeStyle = `rgba(190,215,255,${0.45 * k})`; ctx.lineWidth = Math.max(1, this.dpr);
    ctx.beginPath();
    for (const d of this.drops) {
      d.y += d.v * dt * this.dpr; d.x -= d.v * 0.18 * dt * this.dpr;
      if (d.y > H) { d.y = -20; d.x = Math.random() * (W + 200); }
      ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + d.l * 0.18 * this.dpr, d.y - d.l * this.dpr);
    }
    ctx.stroke();
  }

  drawLabels(ui) {
    const ctx = this.ctx, sim = this.sim, dpr = this.dpr, zm = this.cam.zoom;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    const showAll = sim.settings.names || zm > 1.25;
    for (const ch of sim.chars) {
      if (ch.carried) continue;
      const [sx, sy] = this.toScreen(ch.x * TILE, ch.y * TILE);
      if (sx < -80 || sy < -80 || sx > this.w + 80 || sy > this.h + 80) continue;
      const hov = ch === ui.hoverChar, sel = ch === ui.selChar;
      if (showAll || hov || sel) {
        ctx.font = "600 11px system-ui, sans-serif";
        const label = (ch.partner !== null ? "💞 " : "") + ch.name;
        ctx.lineWidth = 3; ctx.strokeStyle = "rgba(10,14,24,.85)"; ctx.strokeText(label, sx, sy + 15 * zm + 8);
        ctx.fillStyle = sel ? "#ffd166" : "#fff"; ctx.fillText(label, sx, sy + 15 * zm + 8);
        if ((hov || sel) && ch.icon) { ctx.font = "13px system-ui, 'Segoe UI Emoji', sans-serif"; ctx.fillText(ch.icon, sx + ctx.measureText(label).width / 2 + 11, sy + 15 * zm + 9); }
      }
      if (ch.bubble) {
        const b = ch.bubble, sc = ch.stage === "child" ? 0.8 : 1;
        const a = clamp(Math.min(1, (b.dur - b.t) * 3, b.t * 6 + 0.2), 0, 1);
        ctx.globalAlpha = a;
        ctx.font = "12px system-ui, sans-serif";
        const maxW = 150, words = b.text.split(" "), lines = []; let cur = "";
        for (const wd of words) { const t = cur ? cur + " " + wd : wd; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = wd; } else cur = t; }
        lines.push(cur);
        const lw = Math.min(maxW + 4, Math.max(...lines.map(l => ctx.measureText(l).width))) + 16, lh = lines.length * 15 + 10;
        const bx = clamp(sx - lw / 2, 4, this.w - lw - 4), by = Math.max(4, sy - (66 * sc) * zm - lh - 4);
        ctx.fillStyle = "rgba(255,255,255,.96)"; rr(ctx, bx, by, lw, lh, 9); ctx.fill();
        ctx.beginPath(); ctx.moveTo(sx - 5, by + lh - 1); ctx.lineTo(sx, by + lh + 6); ctx.lineTo(sx + 5, by + lh - 1); ctx.fill();
        ctx.fillStyle = "#1b2233"; lines.forEach((l, i) => ctx.fillText(l, bx + lw / 2, by + 16 + i * 15));
        ctx.globalAlpha = 1;
      }
    }
  }
}
