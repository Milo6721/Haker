/* świat: teren, ściany, obiekty, wyszukiwanie ścieżek */
const T = { GRASS: 0, WATER: 1, PATH: 2, FLOOR: 3 };

const OBJ = {
  bed:       { name: "Łóżko",        emoji: "🛏️", w: 2, h: 1, block: true },
  crib:      { name: "Kołyska",      emoji: "🍼", w: 1, h: 1, block: true },
  fridge:    { name: "Lodówka",      emoji: "🧊", w: 1, h: 1, block: true, init: () => ({ food: 6 }) },
  tv:        { name: "Telewizor",    emoji: "📺", w: 2, h: 1, block: true, init: () => ({ users: 0 }) },
  sofa:      { name: "Sofa",         emoji: "🛋️", w: 2, h: 1, block: true },
  table:     { name: "Stół",         emoji: "🍽️", w: 2, h: 1, block: true },
  desk:      { name: "Biurko",       emoji: "🖥️", w: 2, h: 1, block: true },
  piano:     { name: "Pianino",      emoji: "🎹", w: 2, h: 1, block: true },
  lamp:      { name: "Lampa",        emoji: "💡", w: 1, h: 1, block: true, light: 4.5 },
  rug:       { name: "Dywan",        emoji: "🟪", w: 2, h: 2, block: false },
  tree:      { name: "Drzewo",       emoji: "🌳", w: 1, h: 1, block: true },
  bush:      { name: "Krzew jagód",  emoji: "🫐", w: 1, h: 1, block: true, init: () => ({ berries: 3, grow: 0 }) },
  flowers:   { name: "Kwiaty",       emoji: "🌸", w: 1, h: 1, block: false },
  bench:     { name: "Ławka",        emoji: "🪑", w: 2, h: 1, block: true },
  campfire:  { name: "Ognisko",      emoji: "🔥", w: 1, h: 1, block: true, light: 7 },
  stall:     { name: "Sklep",        emoji: "🏪", w: 2, h: 1, block: true },
  workbench: { name: "Warsztat",     emoji: "🔨", w: 2, h: 1, block: true },
  grave:     { name: "Grób",         emoji: "🪦", w: 1, h: 1, block: false, init: () => ({ who: "?" }) },
};

class World {
  constructor() {
    this.w = GW; this.h = GH;
    this.terrain = new Uint8Array(GW * GH);
    this.wall = new Uint8Array(GW * GH);
    this.block = new Uint8Array(GW * GH);
    this.objs = [];
    this.homes = [];
    this.nextId = 1;
    this.version = 0;     // zmiana przeszkód (ścieżki)
    this.tver = 0;        // zmiana terenu (render)
    this._shore = null;
  }

  idx(x, y) { return y * this.w + x; }
  inb(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  walkable(x, y) { return this.inb(x, y) && !this.block[this.idx(x, y)]; }
  isIndoor(x, y) { return this.inb(x | 0, y | 0) && this.terrain[this.idx(x | 0, y | 0)] === T.FLOOR; }

  rebuild() {
    const b = this.block;
    for (let i = 0; i < b.length; i++) b[i] = (this.wall[i] || this.terrain[i] === T.WATER) ? 1 : 0;
    for (const o of this.objs) {
      if (!OBJ[o.type].block) continue;
      for (let dy = 0; dy < o.h; dy++) for (let dx = 0; dx < o.w; dx++) {
        if (this.inb(o.x + dx, o.y + dy)) b[this.idx(o.x + dx, o.y + dy)] = 1;
      }
    }
    this.version++;
    this._shore = null;
  }
  touchTerrain() { this.tver++; this.rebuild(); }

  objAt(x, y) {
    let best = null;
    for (const o of this.objs) {
      if (x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h) {
        if (!best || OBJ[o.type].block) best = o;
      }
    }
    return best;
  }

  canPlace(type, x, y) {
    const d = OBJ[type];
    for (let dy = 0; dy < d.h; dy++) for (let dx = 0; dx < d.w; dx++) {
      const tx = x + dx, ty = y + dy;
      if (!this.inb(tx, ty)) return false;
      const i = this.idx(tx, ty);
      if (this.terrain[i] === T.WATER || this.wall[i]) return false;
      if (this.block[i]) return false;
      const o = this.objAt(tx, ty);
      if (o) return false;
    }
    // drzewa / krzewy tylko na trawie
    if ((type === "tree" || type === "bush" || type === "flowers") && this.terrain[this.idx(x, y)] !== T.GRASS) return false;
    return true;
  }

  addObj(type, x, y, data) {
    if (!this.canPlace(type, x, y)) return null;
    const d = OBJ[type];
    const o = { id: this.nextId++, type, x, y, w: d.w, h: d.h, data: data || (d.init ? d.init() : {}) };
    this.objs.push(o);
    this.rebuild();
    return o;
  }
  removeObj(o) {
    const i = this.objs.indexOf(o);
    if (i >= 0) { this.objs.splice(i, 1); this.rebuild(); }
  }
  ofType(type) { return this.objs.filter(o => o.type === type); }

  nearestWalkable(x, y) {
    x |= 0; y |= 0;
    if (this.walkable(x, y)) return [x, y];
    for (let r = 1; r < 12; r++) {
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (this.walkable(x + dx, y + dy)) return [x + dx, y + dy];
      }
    }
    return null;
  }

  /* pola przy obiekcie, z których można go używać */
  spots(o) {
    const out = [];
    for (let dy = -1; dy <= o.h; dy++) for (let dx = -1; dx <= o.w; dx++) {
      const inside = dx >= 0 && dx < o.w && dy >= 0 && dy < o.h;
      if (inside) continue;
      const corner = (dx === -1 || dx === o.w) && (dy === -1 || dy === o.h);
      if (corner) continue;
      const tx = o.x + dx, ty = o.y + dy;
      if (this.walkable(tx, ty)) out.push([tx, ty]);
    }
    return out;
  }
  bestSpot(o, fx, fy) {
    const s = this.spots(o);
    if (!s.length) return null;
    let best = s[0], bd = 1e9;
    for (const p of s) { const d = Math.hypot(p[0] - fx, p[1] - fy); if (d < bd) { bd = d; best = p; } }
    return best;
  }
  shoreSpots() {
    if (this._shore) return this._shore;
    const out = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (!this.walkable(x, y)) continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => this.inb(x + dx, y + dy) && this.terrain[this.idx(x + dx, y + dy)] === T.WATER)) out.push([x, y]);
    }
    return (this._shore = out);
  }
  homeOfTile(x, y) {
    return this.homes.findIndex(h => x >= h.x && x < h.x + h.w && y >= h.y && y < h.y + h.h);
  }

  /* A* po siatce, 8 kierunków, bez ścinania rogów */
  findPath(sx, sy, gx, gy) {
    sx |= 0; sy |= 0; gx |= 0; gy |= 0;
    if (!this.walkable(gx, gy)) return null;
    if (!this.walkable(sx, sy)) { const n = this.nearestWalkable(sx, sy); if (!n) return null; [sx, sy] = n; }
    if (sx === gx && sy === gy) return [];
    const W = this.w, N = W * this.h;
    const g = new Float32Array(N).fill(1e9), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
    const open = new Heap();
    const s = sy * W + sx, goal = gy * W + gx;
    g[s] = 0;
    open.push(0, s);
    const D = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
    let guard = 0;
    while (open.size && guard++ < 6000) {
      const cur = open.pop();
      if (closed[cur]) continue;
      closed[cur] = 1;
      if (cur === goal) {
        const path = [];
        for (let c = goal; c !== s; c = from[c]) path.push([c % W, (c / W) | 0]);
        return path.reverse();
      }
      const cx = cur % W, cy = (cur / W) | 0;
      for (const [dx, dy, cost] of D) {
        const nx = cx + dx, ny = cy + dy;
        if (!this.walkable(nx, ny)) continue;
        if (dx && dy && (!this.walkable(cx + dx, cy) || !this.walkable(cx, cy + dy))) continue;
        const ni = ny * W + nx;
        if (closed[ni]) continue;
        const ng = g[cur] + cost;
        if (ng < g[ni]) {
          g[ni] = ng; from[ni] = cur;
          const hx = Math.abs(nx - gx), hy = Math.abs(ny - gy);
          open.push(ng + (hx + hy) + (1.414 - 2) * Math.min(hx, hy), ni);
        }
      }
    }
    return null;
  }

  /* ---------- generowanie startowej osady ---------- */
  addHouse(x, y, w, h) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
      const edge = i === x || j === y || i === x + w - 1 || j === y + h - 1;
      const k = this.idx(i, j);
      this.terrain[k] = edge ? T.GRASS : T.FLOOR;
      this.wall[k] = edge ? 1 : 0;
    }
    const dx = x + (w >> 1), dy = y + h - 1;
    this.wall[this.idx(dx, dy)] = 0;
    this.terrain[this.idx(dx, dy)] = T.FLOOR;
    const home = { x, y, w, h, door: [dx, dy] };
    this.homes.push(home);
    return home;
  }
  carve(x0, y0, x1, y1) {
    const mark = (x, y) => {
      if (!this.inb(x, y)) return;
      const k = this.idx(x, y);
      if (this.terrain[k] === T.GRASS && !this.wall[k]) this.terrain[k] = T.PATH;
    };
    let x = x0, y = y0;
    while (y !== y1) { mark(x, y); y += Math.sign(y1 - y); }
    while (x !== x1) { mark(x, y); x += Math.sign(x1 - x); }
    mark(x, y);
  }

  generate() {
    this.terrain.fill(T.GRASS); this.wall.fill(0); this.objs = []; this.homes = []; this.nextId = 1;
    // staw
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const dx = (x - 52) / 6.5, dy = (y - 9) / 4.5;
      if (dx * dx + dy * dy < 1 + Math.sin(x * 0.9 + y * 0.6) * 0.12) this.terrain[this.idx(x, y)] = T.WATER;
    }
    const plaza = [32, 26];
    const A = this.addHouse(6, 6, 9, 7), B = this.addHouse(21, 6, 9, 7), C = this.addHouse(6, 20, 9, 7);
    // place
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (Math.hypot(x - plaza[0], y - plaza[1]) < 4.2 && this.terrain[this.idx(x, y)] === T.GRASS) this.terrain[this.idx(x, y)] = T.PATH;
    }
    for (const hm of this.homes) {
      this.carve(hm.door[0], hm.door[1] + 1, plaza[0], hm.door[1] + 1 > plaza[1] ? plaza[1] : plaza[1] - 5);
      this.carve(hm.door[0], hm.door[1] + 1, hm.door[0], plaza[1] - 5);
    }
    this.carve(plaza[0] - 5, plaza[1] - 5, plaza[0], plaza[1] - 5);
    this.carve(plaza[0] + 4, plaza[1], 50, plaza[1]);
    this.carve(50, plaza[1], 50, 15);
    this.rebuild();

    const furnish = (hm, second) => {
      const f = (t, rx, ry) => this.addObj(t, hm.x + rx, hm.y + ry);
      f("bed", 1, 1); f("fridge", 4, 1); f(second ? "piano" : "desk", 6, 1);
      f("bed", 1, 3); f("table", 3, 3); f("tv", 6, 3); f("sofa", 6, 5);
      f("rug", 3, 5 - 1 > 4 ? 4 : 4);
    };
    furnish(A, false); furnish(B, true); furnish(C, false);
    this.objs = this.objs.filter(o => !(o.type === "rug" && this.objs.some(p => p !== o && OBJ[p.type].block && o.x < p.x + p.w && o.x + o.w > p.x && o.y < p.y + p.h && o.y + o.h > p.y)));
    this.rebuild();

    const px = plaza[0], py = plaza[1];
    this.addObj("campfire", px, py);
    this.addObj("bench", px - 4, py - 2); this.addObj("bench", px + 3, py - 2);
    this.addObj("bench", px - 2, py + 3);
    this.addObj("stall", px + 7, py - 1);
    this.addObj("workbench", px - 8, py + 2);
    this.addObj("lamp", px - 4, py + 3); this.addObj("lamp", px + 4, py + 3);
    this.addObj("lamp", A.door[0] + 1, A.door[1] + 2); this.addObj("lamp", B.door[0] + 1, B.door[1] + 2); this.addObj("lamp", C.door[0] + 1, C.door[1] + 2);
    this.addObj("bench", 48, 15);

    // roślinność
    const nearPath = (x, y, r) => { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { if (this.inb(x + i, y + j) && (this.terrain[this.idx(x + i, y + j)] === T.PATH || this.wall[this.idx(x + i, y + j)])) return true; } return false; };
    let tries = 0, trees = 0;
    while (trees < 85 && tries++ < 2000) {
      const x = randInt(0, this.w - 1), y = randInt(0, this.h - 1);
      if (nearPath(x, y, 2)) continue;
      if (this.addObj("tree", x, y)) trees++;
    }
    tries = 0; let bushes = 0;
    while (bushes < 10 && tries++ < 1000) {
      const x = randInt(2, this.w - 3), y = randInt(2, this.h - 3);
      if (nearPath(x, y, 1)) continue;
      if (this.addObj("bush", x, y)) bushes++;
    }
    tries = 0; let fl = 0;
    while (fl < 40 && tries++ < 1000) {
      const x = randInt(1, this.w - 2), y = randInt(1, this.h - 2);
      if (this.addObj("flowers", x, y)) fl++;
    }
    this.touchTerrain();
  }

  toJSON() {
    return { terrain: Array.from(this.terrain), wall: Array.from(this.wall), objs: this.objs, homes: this.homes, nextId: this.nextId };
  }
  fromJSON(j) {
    this.terrain = Uint8Array.from(j.terrain); this.wall = Uint8Array.from(j.wall);
    this.objs = j.objs; this.homes = j.homes; this.nextId = j.nextId;
    this.touchTerrain();
  }
}
