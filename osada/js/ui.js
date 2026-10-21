/* interfejs: narzędzia, inspektor postaci, wejście myszy/dotyku */

const NEEDS = [
  { k: "hunger", e: "🍔", n: "Głód", c: "#ffb86b" },
  { k: "energy", e: "⚡", n: "Energia", c: "#7aa7ff" },
  { k: "fun", e: "🎮", n: "Rozrywka", c: "#c792ea" },
  { k: "social", e: "💬", n: "Towarzystwo", c: "#7ee8c1" },
];

const TOOL_GROUPS = [
  { title: "Wybór", items: [
    { id: "select", e: "👆", n: "Wybierz" },
    { id: "erase", e: "🧹", n: "Usuń" },
  ] },
  { title: "Mieszkańcy", items: [
    { act: "addPerson", e: "➕", n: "Nowa osoba" },
    { act: "addChild", e: "👶", n: "Dziecko" },
    { act: "newcomer", e: "🚶", n: "Przybysz" },
  ] },
  { title: "Dom", items: ["bed", "crib", "fridge", "tv", "sofa", "table", "desk", "piano", "lamp", "rug"].map(t => ({ id: "obj:" + t, e: OBJ[t].emoji, n: OBJ[t].name })) },
  { title: "Plener", items: ["tree", "bush", "flowers", "bench", "campfire", "stall", "workbench"].map(t => ({ id: "obj:" + t, e: OBJ[t].emoji, n: OBJ[t].name })) },
  { title: "Budowa", items: [
    { id: "wall", e: "🧱", n: "Ściana" }, { id: "floor", e: "🟫", n: "Podłoga" },
    { id: "path", e: "🛤️", n: "Ścieżka" }, { id: "grass", e: "🌱", n: "Trawa" }, { id: "water", e: "💧", n: "Woda" },
  ] },
  { title: "Wydarzenia", items: [
    { act: "party", e: "🎉", n: "Impreza" }, { id: "partyAt", e: "🪩", n: "Impreza tu" },
    { act: "rain", e: "🌧️", n: "Deszcz" }, { act: "sun", e: "☀️", n: "Słońce" },
    { act: "gift", e: "🎁", n: "Prezent" }, { act: "love", e: "💘", n: "Eliksir miłości" },
    { act: "quarrel", e: "⚡", n: "Kłótnia" }, { id: "meteor", e: "☄️", n: "Meteoryt" },
  ] },
];

const HINTS = {
  erase: "Kliknij lub przeciągaj, aby usuwać",
  wall: "Maluj ściany · przeciągaj",
  floor: "Maluj podłogę (wnętrze domu) · przeciągaj",
  path: "Maluj ścieżkę · przeciągaj",
  grass: "Maluj trawę · przeciągaj",
  water: "Maluj wodę · przeciągaj",
  goto: "Kliknij miejsce, do którego ma pójść postać",
  meteor: "Kliknij miejsce uderzenia meteorytu",
  partyAt: "Kliknij miejsce, gdzie ma być impreza",
};

class UI {
  constructor(sim, r) {
    this.sim = sim; this.r = r; this.canvas = r.canvas;
    this.tool = "select";
    this.selChar = null; this.selObj = null; this.hoverChar = null; this.ghost = null; this.carry = null;
    this.follow = false; this.insChar = null; this.insT = 0; this.insSig = {};
    this.mouse = { x: 0, y: 0, in: false };
    this.drag = null; this.pts = new Map(); this.lastPaint = "";
    this.buildTools();
    this.bindInput();
    this.bindTop();
    sim.onLog = e => this.addFeed(e);
    sim.log.slice(-6).forEach(e => this.addFeed(e, true));
  }

  /* ---------- pasek narzędzi ---------- */
  buildTools() {
    const root = $("#tools");
    root.innerHTML = "";
    this.toolBtns = {};
    for (const g of TOOL_GROUPS) {
      const h = document.createElement("h4"); h.textContent = g.title; root.appendChild(h);
      const grid = document.createElement("div"); grid.className = "tgrid";
      for (const it of g.items) {
        const b = document.createElement("button");
        b.className = "tool"; b.type = "button"; b.title = it.n;
        b.innerHTML = `<span class="e">${it.e}</span><span>${it.n}</span>`;
        b.addEventListener("click", () => it.act ? this.action(it.act) : this.setTool(it.id));
        grid.appendChild(b);
        if (it.id) this.toolBtns[it.id] = b;
      }
      root.appendChild(grid);
    }
    this.setTool("select");
  }

  setTool(id) {
    this.tool = id;
    for (const k in this.toolBtns) this.toolBtns[k].classList.toggle("on", k === id);
    const hint = $("#toolHint");
    let txt = HINTS[id];
    if (id.startsWith("obj:")) txt = `Stawiasz: ${OBJ[id.slice(4)].name} · klikaj na mapie`;
    if (txt && id !== "select") { hint.textContent = txt + " · Esc – koniec"; hint.hidden = false; } else hint.hidden = true;
    this.canvas.style.cursor = id === "select" ? "default" : "crosshair";
    this.ghost = null;
  }

  action(a) {
    const sim = this.sim;
    switch (a) {
      case "addPerson": if (sim.chars.length >= MAX_POP) return this.toast("Osada jest pełna", "bad"); { const c = sim.spawnChar({}); this.toast(`${c.name} dołącza do osady`, "good"); this.select(c); } break;
      case "addChild": if (sim.chars.length >= MAX_POP) return this.toast("Osada jest pełna", "bad"); { const c = sim.spawnChar({ age: rand(1.5, 3.5) }); this.toast(`Dziecko: ${c.name}`, "good"); this.select(c); } break;
      case "newcomer": { const c = sim.newcomer(); if (c) this.select(c); } break;
      case "party": if (sim.party) this.toast("Impreza już trwa!"); else sim.startParty(); break;
      case "rain": sim.startRain(rand(150, 300)); break;
      case "sun": sim.stopRain(); break;
      case "gift": { const c = this.selChar || pick(sim.chars.filter(x => x.stage !== "baby")); if (c) sim.gift(c); } break;
      case "love": if (!sim.love()) this.toast("Brak pasującej, wolnej pary", "bad"); break;
      case "quarrel": sim.quarrel(); break;
    }
  }

  /* ---------- góra ---------- */
  bindTop() {
    const sim = this.sim;
    document.querySelectorAll("#speed button").forEach(b => b.addEventListener("click", () => this.setSpeed(+b.dataset.s)));
    $("#btnSave").addEventListener("click", () => { this.save(); this.toast("💾 Zapisano grę", "good"); });
    $("#btnLoad").addEventListener("click", () => this.loadSave(true));
    $("#btnNew").addEventListener("click", () => { if (confirm("Zacząć nowy świat? Obecny zostanie utracony (chyba że zapisany).")) { sim.reset(); this.select(null); this.r.fit(); this.toast("🆕 Nowy świat", "good"); } });
    $("#btnSet").addEventListener("click", () => { const s = $("#settings"); s.hidden = !s.hidden; });
    $("#btnHelp").addEventListener("click", () => { $("#help").hidden = false; });
    $("#help").addEventListener("click", e => { if (e.target.id === "help" || e.target.dataset.close !== undefined) $("#help").hidden = true; });
    $("#btnCenter").addEventListener("click", () => { this.r.fit(); });
    const opt = (id, key) => { const el = $(id); el.checked = sim.settings[key]; el.addEventListener("change", () => { sim.settings[key] = el.checked; }); };
    opt("#optWeather", "weather"); opt("#optEvents", "events"); opt("#optNames", "names"); opt("#optDeath", "death");
    const fs = $("#btnFs"), root = document.documentElement;
    if (!(root.requestFullscreen || root.webkitRequestFullscreen)) fs.hidden = true;
    fs.addEventListener("click", () => this.toggleFs());
  }
  toggleFs() {
    const d = document;
    if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    else { const p = (d.documentElement.requestFullscreen || d.documentElement.webkitRequestFullscreen).call(d.documentElement); if (p && p.catch) p.catch(() => {}); }
  }
  setSpeed(s) {
    const sim = this.sim;
    sim.paused = s === 0; if (s) sim.speed = s;
    document.querySelectorAll("#speed button").forEach(b => b.classList.toggle("on", +b.dataset.s === (sim.paused ? 0 : sim.speed)));
  }
  save() { try { localStorage.setItem("osada-save-v1", this.sim.serialize()); return true; } catch (e) { return false; } }
  loadSave(announce) {
    try {
      const s = localStorage.getItem("osada-save-v1");
      if (!s) { if (announce) this.toast("Brak zapisu", "bad"); return false; }
      this.sim.load(s); this.select(null);
      if (announce) this.toast("📂 Wczytano zapis", "good");
      return true;
    } catch (e) { if (announce) this.toast("Nie udało się wczytać zapisu", "bad"); return false; }
  }

  /* ---------- toasty i dziennik ---------- */
  toast(text, kind) {
    const box = $("#toasts"), d = document.createElement("div");
    d.className = "toast " + (kind || ""); d.textContent = text;
    box.appendChild(d);
    setTimeout(() => d.remove(), 4100);
    while (box.children.length > 4) box.firstChild.remove();
  }
  addFeed(e, quiet) {
    const feed = $("#feed"), d = document.createElement("div");
    d.className = "item " + (e.kind || "");
    d.innerHTML = `<time>${fmtClock(e.min)}</time>`;
    d.appendChild(document.createTextNode(e.text));
    d.addEventListener("click", () => { const c = e.id && this.sim.byId(e.id); if (c) { this.select(c); this.r.cam.x = c.x * TILE; this.r.cam.y = c.y * TILE; } });
    feed.prepend(d);
    while (feed.children.length > 14) feed.lastChild.remove();
    if (!quiet && (e.kind === "love" || e.kind === "good" || e.kind === "bad")) this.toast(e.text, e.kind);
  }

  /* ---------- zaznaczenie ---------- */
  select(ch) {
    this.selChar = ch; this.selObj = null;
    this.buildInspector();
  }
  selectObj(o) {
    this.selObj = o; this.selChar = null;
    this.buildInspector();
  }

  charAt(wx, wy) {
    let best = null, bd = 1e9;
    for (const c of this.sim.chars) {
      if (c.carried) continue;
      const sc = c.stage === "baby" ? 0.5 : c.stage === "child" ? 0.76 : 1;
      const dx = wx - c.x * TILE, dy = wy - (c.y * TILE - 14 * sc);
      const d = Math.hypot(dx, dy * 0.75);
      if (d < 15 * sc + 3 && d < bd) { bd = d; best = c; }
    }
    return best;
  }

  /* ---------- wejście ---------- */
  local(e) { const r = this.canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  tileAt(wx, wy) { return [Math.floor(wx / TILE), Math.floor(wy / TILE)]; }

  bindInput() {
    const cv = this.canvas, r = this.r;
    cv.addEventListener("contextmenu", e => e.preventDefault());
    cv.addEventListener("wheel", e => {
      e.preventDefault();
      const [sx, sy] = this.local(e);
      const [wx, wy] = r.toWorld(sx, sy);
      r.cam.zoom *= Math.exp(-e.deltaY * 0.0013);
      r.clampCam();
      r.cam.x = wx - (sx - r.w / 2) / r.cam.zoom; r.cam.y = wy - (sy - r.h / 2) / r.cam.zoom;
    }, { passive: false });

    cv.addEventListener("pointerdown", e => {
      cv.setPointerCapture(e.pointerId);
      const [sx, sy] = this.local(e);
      this.pts.set(e.pointerId, { x: sx, y: sy });
      if (this.pts.size === 2) {
        const [a, b] = [...this.pts.values()];
        this.drag = { mode: "pinch", d: Math.hypot(a.x - b.x, a.y - b.y), z: r.cam.zoom };
        return;
      }
      const [wx, wy] = r.toWorld(sx, sy);
      if (e.button === 1 || e.button === 2) { this.drag = { mode: "pan", sx, sy, cx: r.cam.x, cy: r.cam.y }; return; }
      const [tx, ty] = this.tileAt(wx, wy);
      const t = this.tool;
      if (t === "select") {
        const ch = this.charAt(wx, wy);
        if (ch) this.drag = { mode: "char", ch, sx, sy, moved: false };
        else this.drag = { mode: "pan", sx, sy, cx: r.cam.x, cy: r.cam.y, click: true, moved: false, tx, ty };
      } else if (t.startsWith("obj:")) this.placeObj(t.slice(4), wx, wy);
      else if (t === "goto") { this.gotoTile(tx, ty); }
      else if (t === "meteor") { this.sim.meteor(tx, ty); this.setTool("select"); }
      else if (t === "partyAt") { if (this.sim.party) this.toast("Impreza już trwa!"); else this.sim.startParty(tx, ty); this.setTool("select"); }
      else { this.drag = { mode: "paint" }; this.lastPaint = ""; this.paint(tx, ty); }
    });

    cv.addEventListener("pointermove", e => {
      const [sx, sy] = this.local(e);
      this.mouse = { x: sx, y: sy, in: true };
      if (this.pts.has(e.pointerId)) this.pts.set(e.pointerId, { x: sx, y: sy });
      const [wx, wy] = r.toWorld(sx, sy);
      const d = this.drag;
      if (d) {
        if (d.mode === "pinch" && this.pts.size >= 2) {
          const [a, b] = [...this.pts.values()];
          r.cam.zoom = d.z * Math.hypot(a.x - b.x, a.y - b.y) / d.d; r.clampCam();
        } else if (d.mode === "pan") {
          if (Math.hypot(sx - d.sx, sy - d.sy) > 4) d.moved = true;
          r.cam.x = d.cx - (sx - d.sx) / r.cam.zoom; r.cam.y = d.cy - (sy - d.sy) / r.cam.zoom;
          if (d.moved) this.follow = false;
        } else if (d.mode === "char") {
          if (!d.moved && Math.hypot(sx - d.sx, sy - d.sy) > 6) {
            d.moved = true; this.carry = d.ch; d.ch.carried = true; d.ch.abortTask(true); d.ch.walking = false; d.ch.sleeping = false;
            this.sim.fxAt(d.ch, "😮");
          }
          if (this.carry) { this.carry.x = wx / TILE; this.carry.y = wy / TILE + 0.5; }
        } else if (d.mode === "paint") { const [tx, ty] = this.tileAt(wx, wy); this.paint(tx, ty); }
      }
      this.updateHover(wx, wy, e);
    });

    const up = e => {
      this.pts.delete(e.pointerId);
      const d = this.drag;
      if (this.pts.size < 2 && d && d.mode === "pinch") this.drag = null;
      if (!d || d.mode === "pinch") return;
      if (d.mode === "char") {
        if (this.carry) {
          const c = this.carry; this.carry = null;
          const n = this.sim.world.nearestWalkable(Math.floor(c.x), Math.floor(c.y)) || [32, 26];
          c.x = n[0] + 0.5; c.y = n[1] + 0.5; c.carried = false; c.nextThink = this.sim.min + 1;
          this.sim.fxAt(c, "😌");
        } else this.select(d.ch);
      } else if (d.mode === "pan" && d.click && !d.moved) {
        const o = this.sim.world.objAt(d.tx, d.ty);
        if (o) this.selectObj(o); else this.select(null);
      }
      this.drag = null;
    };
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up);
    cv.addEventListener("pointerleave", () => { this.mouse.in = false; this.hoverChar = null; this.ghost = null; $("#tip").hidden = true; });

    window.addEventListener("keydown", e => {
      if (e.target.tagName === "INPUT" || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === " ") { e.preventDefault(); this.setSpeed(this.sim.paused ? 1 : 0); }
      else if (e.key === "1") this.setSpeed(1); else if (e.key === "2") this.setSpeed(3); else if (e.key === "3") this.setSpeed(10);
      else if (e.key === "Escape") { this.setTool("select"); $("#settings").hidden = true; $("#help").hidden = true; }
      else if (e.key === "Delete" && this.selObj) this.removeSelectedObj();
      else if (e.key === "f" || e.key === "F") this.toggleFs();
    });
  }

  updateHover(wx, wy, e) {
    const tip = $("#tip");
    const sim = this.sim, w = sim.world;
    const [tx, ty] = this.tileAt(wx, wy);
    this.hoverChar = this.tool === "select" && !this.carry ? this.charAt(wx, wy) : null;
    // duszek
    this.ghost = null;
    const t = this.tool;
    if (t.startsWith("obj:")) {
      const type = t.slice(4), d = OBJ[type];
      const gx = Math.floor(wx / TILE - d.w / 2 + 0.5), gy = Math.floor(wy / TILE - d.h / 2 + 0.5);
      this.ghost = { type, x: gx, y: gy, ok: w.canPlace(type, gx, gy) };
    } else if (["wall", "floor", "path", "grass", "water", "erase", "goto", "meteor", "partyAt"].includes(t)) this.ghost = { x: tx, y: ty, ok: true };
    // podpowiedź
    let txt = "";
    if (this.hoverChar) { const c = this.hoverChar; txt = `${c.name} · ${(TASK_LABEL[c.task && c.task.type] || ["", c.sleeping ? "Śpi" : "Odpoczywa"])[1]}`; }
    else if (t === "select") { const o = w.inb(tx, ty) && w.objAt(tx, ty); if (o) txt = OBJ[o.type].name + (o.type === "fridge" ? ` · jedzenie: ${o.data.food}` : o.type === "bush" ? ` · jagody: ${o.data.berries}` : ""); }
    if (txt) { tip.textContent = txt; tip.hidden = false; tip.style.left = Math.min(this.mouse.x + 14, this.r.w - 200) + "px"; tip.style.top = (this.mouse.y + 14) + "px"; } else tip.hidden = true;
    if (this.tool === "select") this.canvas.style.cursor = this.carry ? "grabbing" : this.hoverChar ? "grab" : this.drag && this.drag.mode === "pan" && this.drag.moved ? "grabbing" : "default";
  }

  /* ---------- edycja świata ---------- */
  fixChars() {
    const w = this.sim.world;
    for (const c of this.sim.chars) {
      if (c.carried || c.sleeping) continue;
      if (!w.walkable(c.tx, c.ty)) { const n = w.nearestWalkable(c.tx, c.ty); if (n) { c.x = n[0] + 0.5; c.y = n[1] + 0.5; } }
    }
  }
  placeObj(type, wx, wy) {
    const d = OBJ[type];
    const gx = Math.floor(wx / TILE - d.w / 2 + 0.5), gy = Math.floor(wy / TILE - d.h / 2 + 0.5);
    const o = this.sim.world.addObj(type, gx, gy);
    if (!o) { this.toast("Nie można tu postawić", "bad"); return; }
    this.sim.fx.push({ x: gx + d.w / 2, y: gy + 0.3, vy: -0.6, text: "✨", t: 0, life: 1 });
    this.fixChars();
  }
  removeObjSafe(o) {
    for (const c of this.sim.chars) if (c.task && c.task.obj === o) c.abortTask(true);
    if (o.data && o.data.sleeper) { const s = this.sim.byId(o.data.sleeper); if (s) s.abortTask(true); }
    this.sim.world.removeObj(o);
  }
  removeSelectedObj() {
    if (!this.selObj) return;
    this.removeObjSafe(this.selObj); this.selObj = null; this.buildInspector();
  }
  paint(tx, ty) {
    const key = tx + "," + ty;
    if (key === this.lastPaint) return;
    this.lastPaint = key;
    const w = this.sim.world, t = this.tool;
    if (!w.inb(tx, ty)) return;
    const i = w.idx(tx, ty);
    const clear = (types) => { for (const o of w.objs.slice()) if (tx >= o.x && tx < o.x + o.w && ty >= o.y && ty < o.y + o.h && (!types || types.includes(o.type))) this.removeObjSafe(o); };
    if (t === "erase") {
      const o = w.objAt(tx, ty);
      if (o) this.removeObjSafe(o);
      else if (w.wall[i]) { w.wall[i] = 0; w.touchTerrain(); }
      else if (w.terrain[i] !== T.GRASS) { w.terrain[i] = T.GRASS; w.touchTerrain(); }
      return;
    }
    if (t === "wall") { clear(); w.wall[i] = 1; }
    else if (t === "floor") { w.wall[i] = 0; w.terrain[i] = T.FLOOR; }
    else if (t === "path") { w.wall[i] = 0; w.terrain[i] = T.PATH; clear(["tree", "bush", "flowers"]); }
    else if (t === "grass") { w.wall[i] = 0; w.terrain[i] = T.GRASS; }
    else if (t === "water") { w.wall[i] = 0; w.terrain[i] = T.WATER; clear(); }
    w.touchTerrain();
    // domy: wykryj prostokąt zamknięty ścianami -> nowy dom (dla przydziału mieszkańców)
    this.detectHomes();
    this.fixChars();
  }

  /** wykrywa pokoje z podłogi (>= 6 pól) jako domy – nowe budowle gracza zasiedlają mieszkańcy */
  detectHomes() {
    const w = this.sim.world;
    const seen = new Uint8Array(w.w * w.h);
    for (let y = 0; y < w.h; y++) for (let x = 0; x < w.w; x++) {
      const i = w.idx(x, y);
      if (seen[i] || w.terrain[i] !== T.FLOOR || w.wall[i]) continue;
      const q = [[x, y]]; seen[i] = 1;
      let x0 = x, x1 = x, y0 = y, y1 = y, n = 0;
      while (q.length) {
        const [cx, cy] = q.pop(); n++;
        x0 = Math.min(x0, cx); x1 = Math.max(x1, cx); y0 = Math.min(y0, cy); y1 = Math.max(y1, cy);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx, ny = cy + dy;
          if (!w.inb(nx, ny)) continue;
          const k = w.idx(nx, ny);
          if (!seen[k] && w.terrain[k] === T.FLOOR && !w.wall[k]) { seen[k] = 1; q.push([nx, ny]); }
        }
      }
      if (n < 6) continue;
      const rect = { x: x0 - 1, y: y0 - 1, w: x1 - x0 + 3, h: y1 - y0 + 3, door: [(x0 + x1) >> 1, y1 + 1] };
      const hit = w.homes.find(h => rect.x < h.x + h.w && rect.x + rect.w > h.x && rect.y < h.y + h.h && rect.y + rect.h > h.y);
      if (!hit) { rect.auto = true; w.homes.push(rect); }
      else if (hit.auto) Object.assign(hit, rect);
    }
  }

  gotoTile(tx, ty) {
    const c = this.selChar;
    this.setTool("select");
    if (!c) { this.toast("Najpierw wybierz mieszkańca", "bad"); return; }
    if (c.stage === "baby") return;
    if (!this.sim.world.walkable(tx, ty)) { this.toast("Tam nie da się wejść", "bad"); return; }
    c.abortTask(true); c.startTask({ type: "goto", tile: [tx, ty], forced: true });
    this.sim.fx.push({ x: tx + 0.5, y: ty, vy: -0.4, text: "📍", t: 0, life: 1.2 });
  }

  /* ---------- inspektor ---------- */
  buildInspector() {
    const root = $("#inspect");
    this.insSig = {};
    $("#inspect").classList.toggle("open", !!(this.selChar || this.selObj));
    if (this.selObj) { this.buildObjInspector(root); return; }
    const ch = this.selChar;
    this.insChar = ch;
    if (!ch) { root.innerHTML = '<div class="empty">Kliknij mieszkańca, aby zobaczyć jego życie.</div>'; return; }
    root.innerHTML = `
      <div class="ins">
        <div class="ins-head">
          <canvas id="iPortrait" width="184" height="184"></canvas>
          <div><h2 id="iName"></h2><small id="iSub"></small><small id="iHome"></small></div>
          <button class="close-x" id="iClose" title="Zamknij">✕</button>
        </div>
        <div class="chips" id="iTraits"></div>
        <div class="card">
          <div class="mood-row"><span class="face" id="iFace"></span><div><b id="iMood"></b><div class="muted" id="iMoodNum"></div></div></div>
          <div id="iNeeds"></div>
        </div>
        <div class="card">
          <h5>Teraz</h5>
          <div class="doing"><span class="ico" id="iIco"></span><b id="iDoing"></b></div>
          <div class="thought" id="iThought"></div>
          <div class="muted" style="margin-top:6px">💰 <b id="iMoney"></b> monet</div>
        </div>
        <div class="card"><h5>Nastrój – powody</h5><div class="chips" id="iLets"></div></div>
        <div class="card"><h5>Relacje</h5><div id="iRels"></div></div>
        <div class="card"><h5>Wspomnienia</h5><div class="mem" id="iMem"></div></div>
        <div class="card">
          <h5>Rozmowa</h5>
          <div class="chatbox" id="iChat"></div>
          <form class="chatform" id="iForm"><input id="iInput" type="text" placeholder="Napisz coś…" autocomplete="off" maxlength="120"><button type="submit">Wyślij</button></form>
          <div class="quick" id="iQuick"></div>
        </div>
        <div class="acts" id="iActs"></div>
      </div>`;
    // potrzeby
    const needs = $("#iNeeds");
    needs.innerHTML = NEEDS.map(n => `<div class="bar-row"><span>${n.e}</span><span>${n.n}</span><div class="bar"><i data-n="${n.k}" style="background:${n.c}"></i></div><b data-v="${n.k}">0</b></div>`).join("");
    $("#iClose").addEventListener("click", () => this.select(null));
    const send = text => {
      if (!text.trim()) return;
      ch.chat.push({ who: "me", text });
      const rep = ch.reply(text);
      setTimeout(() => { ch.chat.push({ who: "ch", text: rep }); this.insSig.chat = null; this.updateInspector(true); }, 450);
      this.insSig.chat = null; this.updateInspector(true);
    };
    $("#iForm").addEventListener("submit", e => { e.preventDefault(); const i = $("#iInput"); send(i.value); i.value = ""; });
    $("#iQuick").innerHTML = ["Cześć!", "Jak się masz?", "Idź spać", "Zjedz coś", "Idź do pracy", "Zagraj na pianinie", "Idź do ogniska", "Jesteś super!"].map(t => `<button type="button">${t}</button>`).join("");
    $("#iQuick").addEventListener("click", e => { if (e.target.tagName === "BUTTON") send(e.target.textContent); });
    const acts = $("#iActs");
    acts.innerHTML = `<button data-a="gift">🎁 Prezent</button><button data-a="praise">👏 Pochwal</button><button data-a="scold">😠 Zrugaj</button><button data-a="goto">📍 Idź tam…</button><button data-a="follow" class="${this.follow ? "on" : ""}">📷 Śledź</button>`;
    acts.addEventListener("click", e => {
      const a = e.target.dataset && e.target.dataset.a; if (!a) return;
      if (a === "gift") this.sim.gift(ch);
      else if (a === "praise") { ch.moodlet("praise", "Ktoś mnie pochwalił", 10, 240); this.sim.fxAt(ch, "👏"); ch.say("Dziękuję! 😊"); }
      else if (a === "scold") { ch.moodlet("insult", "Ktoś mnie zrugał", -12, 240); this.sim.fxAt(ch, "💢"); ch.say(ch.traits.includes("klotliwy") ? "Sam się zrugaj!" : "Hej, to nie fair…"); }
      else if (a === "goto") this.setTool("goto");
      else if (a === "follow") { this.follow = !this.follow; e.target.classList.toggle("on", this.follow); }
    });
    this.updateInspector(true);
  }

  buildObjInspector(root) {
    const o = this.selObj, d = OBJ[o.type];
    root.innerHTML = `<div class="ins"><div class="ins-head"><div style="font-size:46px">${d.emoji}</div><div><h2>${d.name}</h2><small>x:${o.x} y:${o.y}</small></div><button class="close-x" id="iClose">✕</button></div>
      <div class="card" id="oInfo"></div><div class="acts" id="oActs"></div></div>`;
    $("#iClose").addEventListener("click", () => this.select(null));
    const info = $("#oInfo");
    const lines = [];
    if (o.type === "fridge") lines.push(`🍱 Jedzenie: <b>${o.data.food}</b>`);
    if (o.type === "bush") lines.push(`🫐 Jagody: <b>${o.data.berries}</b>`);
    if (o.type === "grave") lines.push(`🪦 Tu spoczywa: <b>${o.data.who}</b>`);
    if (o.type === "tv") lines.push("📺 Mieszkańcy oglądają, by poprawić nastrój.");
    if (o.type === "stall") lines.push("🛒 Tu mieszkańcy kupują jedzenie do lodówek (15 monet).");
    if (o.type === "desk" || o.type === "workbench") lines.push("💼 Miejsce pracy – zarabia się tu monety.");
    if (o.type === "bed") lines.push("🛏️ Śpią tu mieszkańcy. Im więcej łóżek w domu, tym więcej lokatorów.");
    info.innerHTML = lines.join("<br>") || '<span class="muted">Obiekt dekoracyjny.</span>';
    const acts = $("#oActs");
    acts.innerHTML = (o.type === "fridge" ? '<button data-a="fill">🍱 +5 jedzenia</button>' : "") + '<button data-a="del">🗑️ Usuń</button>';
    acts.addEventListener("click", e => {
      const a = e.target.dataset.a;
      if (a === "del") this.removeSelectedObj();
      else if (a === "fill") { o.data.food += 5; this.buildObjInspector(root); }
    });
  }

  drawPortrait(ch) {
    const cv = $("#iPortrait"); if (!cv) return;
    const c = cv.getContext("2d");
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
    c.translate(cv.width / 2, cv.height - 16); c.scale(3.3, 3.3);
    const proxy = Object.assign(Object.create(ch), { x: 0, y: 0, walking: false, pose: "stand", sleeping: false, carried: false, bubble: null, task: null, anim: this.r.t, face: 1 });
    this.r.drawChar(c, proxy, this);
  }

  updateInspector(force) {
    const ch = this.insChar;
    if (!ch || this.selChar !== ch) return;
    const sim = this.sim;
    if (!sim.chars.includes(ch)) { this.select(null); return; }
    $("#iName").textContent = ch.name;
    $("#iSub").textContent = `${stageName(ch.stage, ch.female)} · ${ageYears(ch.age)} lat`;
    const home = sim.world.homes[ch.home];
    $("#iHome").textContent = (home ? `🏠 Dom nr ${ch.home + 1}` : "🏚️ Bezdomn" + (ch.female ? "a" : "y")) + (ch.partner !== null && sim.byId(ch.partner) ? ` · 💞 ${sim.byId(ch.partner).name}` : "");
    const sigT = ch.traits.join();
    if (this.insSig.traits !== sigT) { this.insSig.traits = sigT; $("#iTraits").innerHTML = ch.traits.map(t => `<span class="chip" title="${TRAITS[t].name}">${TRAITS[t].emoji} ${TRAITS[t].name}</span>`).join(""); }
    const mi = moodInfo(ch.mood);
    $("#iFace").textContent = mi[1]; $("#iMood").textContent = mi[2]; $("#iMoodNum").textContent = `Nastrój: ${Math.round(ch.mood)}/100`;
    for (const n of NEEDS) { const v = ch.needs[n.k]; $(`[data-n="${n.k}"]`).style.width = v + "%"; const b = $(`[data-v="${n.k}"]`); b.textContent = Math.round(v); b.style.color = v < 20 ? "#ff6b7a" : ""; }
    const tl = ch.task ? TASK_LABEL[ch.task.type] : null;
    $("#iIco").textContent = tl ? tl[0] : (ch.stage === "baby" ? "🍼" : "…");
    $("#iDoing").textContent = ch.stage === "baby" ? "Śpi w kołysce" : tl ? tl[1] + (ch.task.type === "talk" && ch.task.partner ? ` z ${ch.task.partner.name}` : "") : "Zastanawia się…";
    $("#iThought").textContent = ch.thought ? `„${ch.thought}”` : "";
    $("#iMoney").textContent = Math.round(ch.money);

    const letSig = ch.moodlets.map(m => m.key + m.v).join();
    if (this.insSig.lets !== letSig) { this.insSig.lets = letSig; $("#iLets").innerHTML = ch.moodlets.length ? ch.moodlets.map(m => `<span class="chip ${m.v > 0 ? "good" : "bad"}">${m.v > 0 ? "+" : ""}${m.v} ${m.text}</span>`).join("") : '<span class="muted">brak szczególnych</span>'; }

    const rels = Object.entries(ch.rel).map(([id, r]) => [sim.byId(+id), r]).filter(([c]) => c && c !== ch).sort((a, b) => (Math.abs(b[1].f) + b[1].r) - (Math.abs(a[1].f) + a[1].r)).slice(0, 8);
    const rsig = rels.map(([c, r]) => c.id + ":" + Math.round(r.f) + ":" + Math.round(r.r) + ch.relLabel(c)).join("|");
    if (this.insSig.rels !== rsig) {
      this.insSig.rels = rsig;
      const el = $("#iRels");
      el.innerHTML = rels.length ? "" : '<span class="muted">Jeszcze nikogo nie poznał' + (ch.female ? "a" : "") + "…</span>";
      for (const [c, r] of rels) {
        const d = document.createElement("div"); d.className = "rel";
        d.innerHTML = `<span class="dot" style="background:${c.look.shirt}"></span><div class="nm"><span>${c.name}</span><small>${ch.relLabel(c)}</small></div>
          <div class="bars"><div class="bar" title="Przyjaźń: ${Math.round(r.f)}"><i style="width:${clamp(50 + r.f / 2, 0, 100)}%;background:${r.f < 0 ? "#ff6b7a" : "#7aa7ff"}"></i></div><div class="bar" title="Romans: ${Math.round(r.r)}"><i style="width:${r.r}%;background:#ff8fb1"></i></div></div>`;
        d.addEventListener("click", () => this.select(c));
        el.appendChild(d);
      }
    }
    const msig = ch.mem.length + ":" + (ch.mem.length ? ch.mem[ch.mem.length - 1].t : 0);
    if (this.insSig.mem !== msig) {
      this.insSig.mem = msig;
      $("#iMem").innerHTML = ch.mem.slice(-6).reverse().map(m => `<div><time>${fmtClock(m.t)}</time>${m.text.replace(/</g, "&lt;")}</div>`).join("") || '<span class="muted">Brak wspomnień.</span>';
    }
    const csig = ch.chat.length;
    if (this.insSig.chat !== csig) {
      this.insSig.chat = csig;
      const box = $("#iChat");
      box.innerHTML = ch.chat.slice(-12).map(m => `<div class="msg ${m.who}">${m.text.replace(/</g, "&lt;")}</div>`).join("");
      box.scrollTop = box.scrollHeight;
    }
    this.drawPortrait(ch);
  }

  /* ---------- co klatkę ---------- */
  frame(dt) {
    const sim = this.sim;
    const hr = sim.hour, dl = daylight(hr);
    this.insT += dt;
    if (this.insT > 0.3) { this.insT = 0; this.updateInspector(); this.updateTop(); }
    if (this.follow && this.selChar) {
      this.r.cam.x += (this.selChar.x * TILE - this.r.cam.x) * Math.min(1, dt * 4);
      this.r.cam.y += (this.selChar.y * TILE - this.r.cam.y) * Math.min(1, dt * 4);
    }
  }
  updateTop() {
    const sim = this.sim, hr = sim.hour;
    $("#clockTime").textContent = fmtClock(sim.min);
    $("#clockDay").textContent = "Dzień " + sim.day;
    $("#clockIcon").textContent = sim.rain > 0.3 ? "🌧️" : hr >= 6 && hr < 19 ? "☀️" : hr >= 19 && hr < 21 ? "🌇" : "🌙";
    $("#popStat").textContent = `👥 ${sim.chars.length}`;
  }
}
