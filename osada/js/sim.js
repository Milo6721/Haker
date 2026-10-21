/* symulacja: czas, pogoda, wydarzenia, życie osady */
const MAX_POP = 24;

class Sim {
  constructor() {
    this.world = new World();
    this.chars = [];
    this.settings = { death: false, weather: true, events: true, names: false, paths: false };
    this.speed = 1; this.paused = false;
    this.fx = []; this.booms = []; this.log = [];
    this.onLog = null;
    this.reset();
  }

  reset() {
    this.world.generate();
    this.chars = []; this.nextCharId = 1; this.min = 7 * 60; this.lastDay = 1; this.log = []; this.fx = []; this.booms = [];
    this.rain = 0; this.rainTarget = 0; this.rainUntil = 0; this.party = null; this.nextEvent = this.min + 900;
    const w = this.world;
    for (let i = 0; i < 6; i++) this.spawnChar({ home: i >> 1, age: rand(9, 24) });
    this.addLog("🏡 Witaj w osadzie! Obserwuj mieszkańców, buduj i testuj różne wydarzenia.", null);
  }

  get hour() { return (this.min / 60) % 24; }
  get day() { return Math.floor(this.min / 1440) + 1; }
  byId(id) { return this.chars.find(c => c.id === id); }

  addLog(text, ch, kind) {
    const e = { min: this.min, text, id: ch ? ch.id : null, kind: kind || "" };
    this.log.push(e);
    if (this.log.length > 120) this.log.shift();
    if (this.onLog) this.onLog(e);
  }
  fxAt(ch, text) { this.fx.push({ x: ch.x + rand(-0.25, 0.25), y: ch.y - 1.3, vy: -0.7, text, t: 0, life: 1.8 }); }
  heartBurst(ch) { for (let i = 0; i < 5; i++) setTimeout(() => this.fxAt(ch, pick(["❤️", "💕", "💖"])), i * 180); }

  homeInfo(i) {
    const h = this.world.homes[i];
    if (!h) return { beds: 0, occ: 0 };
    const beds = this.world.ofType("bed").filter(b => b.x >= h.x && b.x < h.x + h.w && b.y >= h.y && b.y < h.y + h.h).length;
    const occ = this.chars.filter(c => c.home === i && c.stage !== "baby" && c.stage !== "child").length;
    return { beds, occ };
  }
  freeHome() {
    for (let i = 0; i < this.world.homes.length; i++) { const { beds, occ } = this.homeInfo(i); if (occ < beds) return i; }
    return -1;
  }
  moveIn(a, b) {
    if (a.home === b.home) return;
    const ia = this.homeInfo(a.home), ib = this.homeInfo(b.home);
    let mover = null, to = -1;
    if (b.home >= 0 && ib.occ < ib.beds + 1) { mover = a; to = b.home; }
    else if (a.home >= 0 && ia.occ < ia.beds + 1) { mover = b; to = a.home; }
    if (mover) { mover.home = to; this.addLog(`📦 ${mover.name} przeprowadza się do domu: ${mover === a ? b.name : a.name}`, mover); }
  }

  uniqueName(female) {
    const pool = female ? NAMES_F : NAMES_M;
    const used = new Set(this.chars.map(c => c.name));
    const free = pool.filter(n => !used.has(n));
    if (free.length) return pick(free);
    return pick(pool) + " " + randInt(2, 9);
  }

  spawnChar(o = {}) {
    const female = o.female === undefined ? chance(0.5) : o.female;
    const w = this.world;
    const home = o.home === undefined ? this.freeHome() : o.home;
    let pos = o.pos;
    if (!pos) {
      const h = w.homes[home];
      if (h) {
        const beds = w.ofType("bed").filter(b => b.x >= h.x && b.x < h.x + h.w && b.y >= h.y && b.y < h.y + h.h);
        const b = beds[Math.min(beds.length - 1, this.chars.filter(c => c.home === home).length)] || beds[0];
        pos = b ? (w.bestSpot(b, b.x, b.y) || h.door) : h.door;
      } else pos = [randInt(28, 36), randInt(22, 30)];
    }
    pos = w.nearestWalkable(pos[0], pos[1]) || [32, 26];
    const ch = new Character(this, {
      id: this.nextCharId++, name: o.name || this.uniqueName(female), female, age: o.age === undefined ? rand(9, 24) : o.age,
      look: o.look || Character.randomLook(female), traits: o.traits || Character.randomTraits(3, o.baseTraits || []),
      attr: o.attr || (chance(0.25) ? "both" : chance(0.86) ? (female ? "m" : "f") : (female ? "f" : "m")), home, x: pos[0] + 0.5, y: pos[1] + 0.5, parents: o.parents, family: o.family,
    });
    this.chars.push(ch);
    for (const other of this.chars) {                      // rodzina zna się od początku
      if (other !== ch && ch.family.has(other.id)) { other.family.add(ch.id); ch.mkRel(other); other.mkRel(ch); }
    }
    return ch;
  }

  /* ---------- aktualizacja ---------- */
  update(dtReal) {
    for (const c of this.chars) c.tickReal(dtReal);
    for (const f of this.fx) { f.t += dtReal; f.y += f.vy * dtReal; }
    this.fx = this.fx.filter(f => f.t < f.life);
    for (const b of this.booms) b.t += dtReal;
    this.booms = this.booms.filter(b => b.t < 1.6);
    const dr = clamp(this.rainTarget - this.rain, -dtReal * 0.25, dtReal * 0.25);
    this.rain += dr;
    if (this.paused) return;
    let dt = dtReal * this.speed;
    while (dt > 1e-6) { const s = Math.min(dt, 0.1); dt -= s; this.step(s); }
  }

  step(s) {
    const dtMin = s * MIN_PER_SEC;
    this.min += dtMin;
    for (const c of this.chars) c.update(s, dtMin);

    // krzewy odrastają
    const gr = dtMin * (1 + this.rain * 2);
    for (const o of this.world.objs) if (o.type === "bush") { o.data.grow += gr; if (o.data.grow >= 240) { o.data.grow = 0; if (o.data.berries < 4) o.data.berries++; } }

    // pogoda
    if (this.settings.weather && this.rainTarget === 0 && chance(0.00035 * dtMin)) this.startRain(rand(120, 360));
    if (this.rainTarget > 0 && this.min >= this.rainUntil) { this.rainTarget = 0; this.addLog("🌤️ Deszcz ustaje", null); }

    // impreza
    if (this.party) {
      if (this.min >= this.party.until) { this.party = null; this.addLog("🎉 Impreza dobiegła końca", null); }
      else if (chance(dtMin * 0.04)) this.fx.push({ x: this.party.x + rand(-2, 2), y: this.party.y - rand(0, 1), vy: -0.8, text: pick(["🎵", "🎶", "🎉", "✨"]), t: 0, life: 1.8 });
    }

    // losowe wydarzenia
    if (this.settings.events && this.min >= this.nextEvent) { this.randomEvent(); this.nextEvent = this.min + rand(700, 2400); }

    // nowy dzień
    const d = this.day;
    if (d !== this.lastDay) { this.lastDay = d; this.dailyTick(); }
  }

  dailyTick() {
    this.addLog(`📅 Dzień ${this.day}`, null);
    for (const c of this.chars) {
      for (const id in c.rel) {
        const r = c.rel[id];
        if (c.family.has(+id)) continue;
        r.f += r.f > 0 ? -0.8 : 0.5;
        r.r = Math.max(0, r.r - (c.partner === +id ? 0 : 0.8));
      }
    }
    // rozstania
    for (const c of this.chars) {
      if (c.partner === null || c.id > c.partner) continue;
      const p = this.byId(c.partner); if (!p) { c.partner = null; continue; }
      const r = c.rel[p.id], r2 = p.rel[c.id];
      if (!r || !r2 || r.f < 8 || r2.f < 8 || r.r < 25 || r2.r < 25) {
        c.partner = null; p.partner = null;
        this.addLog(`💔 ${c.name} i ${p.name} rozstają się`, c, "bad");
        c.moodlet("breakup", "Złamane serce", -22, 1500); p.moodlet("breakup", "Złamane serce", -22, 1500);
      }
    }
    // narodziny
    if (this.chars.length < MAX_POP) {
      for (const c of this.chars) {
        if (c.partner === null || c.id > c.partner || !c.adult || c.stage === "elder") continue;
        const p = this.byId(c.partner);
        if (!p || p.stage === "elder" || c.home !== p.home || c.home < 0) continue;
        if (this.chars.filter(x => x.parents.includes(c.id) && x.stage === "baby").length) continue;
        if (chance(0.4)) this.birth(c, p);
      }
    }
    // starość
    if (this.settings.death) {
      for (const c of this.chars.slice()) if (c.age > 33 && chance(0.12 * (c.age - 33) / 2)) this.die(c);
    }
  }

  birth(a, b) {
    const female = chance(0.5);
    const base = [pick(a.traits), pick(b.traits)].filter((t, i, arr) => arr.indexOf(t) === i);
    const donor = chance(0.5) ? a : b;
    const baby = this.spawnChar({
      female, age: 0, home: a.home, parents: [a.id, b.id], family: [a.id, b.id, ...a.family, ...b.family].filter(i => i !== undefined),
      baseTraits: base.slice(0, 2),
      look: { skin: donor.look.skin, hair: chance(0.5) ? a.look.hair : b.look.hair, style: female ? pick([1, 3, 0]) : pick([0, 2]), shirt: pick(SHIRTS), pants: pick(PANTS), hat: false },
      pos: [a.tx, a.ty],
    });
    for (const f of [a, b]) { f.family.add(baby.id); baby.family.add(f.id); baby.mkRel(f); f.mkRel(baby).f = 90; f.moodlet("baby", "Radość z dziecka", 18, 1500); f.memo(`Urodził${f.g("o", "o")} się nasze dziecko: ${baby.name}!`); }
    // rodzeństwo
    for (const c of this.chars) if (c !== baby && c.parents.length && c.parents.some(id => baby.parents.includes(id))) { baby.family.add(c.id); c.family.add(baby.id); baby.mkRel(c); c.mkRel(baby); }
    const h = this.world.homes[a.home];
    const crib = h && this.world.ofType("crib").find(c => c.x >= h.x && c.x < h.x + h.w && c.y >= h.y && c.y < h.y + h.h);
    if (crib) { baby.x = crib.x + 0.5; baby.y = crib.y + 0.5; }
    this.addLog(`🍼 ${a.name} i ${b.name} mają dziecko: ${baby.name}!`, baby, "love");
  }

  die(c) {
    const w = this.world;
    const spot = w.nearestWalkable(c.tx, c.ty) || [c.tx, c.ty];
    let g = null;
    for (let r = 0; r < 4 && !g; r++) for (let dy = -r; dy <= r && !g; dy++) for (let dx = -r; dx <= r && !g; dx++) { if (w.canPlace("grave", spot[0] + dx, spot[1] + dy)) g = w.addObj("grave", spot[0] + dx, spot[1] + dy, { who: c.name }); }
    c.abortTask(true);
    c.dead = true;
    this.chars = this.chars.filter(x => x !== c);
    for (const o of this.chars) {
      if (o.partner === c.id) o.partner = null;
      const r = o.rel[c.id];
      if (r && (r.f > 20 || o.family.has(c.id))) o.moodlet("mourn", `Żałoba po ${c.name}`, -25, 2000);
    }
    this.addLog(`🕯️ ${c.name} odchodzi… (wiek: ${ageYears(c.age)} lat)`, null, "bad");
  }

  /* ---------- zdarzenia ---------- */
  startRain(mins) { this.rainTarget = rand(0.5, 1); this.rainUntil = this.min + mins; this.addLog("🌧️ Zaczyna padać deszcz", null); }
  stopRain() { this.rainTarget = 0; this.addLog("☀️ Chmury się rozstępują", null); }

  startParty(x, y) {
    if (this.party) return;
    const c = this.world.ofType("campfire")[0];
    if (x === undefined) { x = c ? c.x : 32; y = c ? c.y : 26; }
    this.party = { x, y, until: this.min + 180 };
    this.addLog("🎉 Impreza! Wszyscy zbierają się na zabawę", null, "good");
    for (const ch of this.chars) {
      if (ch.stage === "baby" || ch.sleeping || ch.carried) continue;
      ch.abortTask(true);
      ch.startTask({ type: "party" });
    }
  }
  meteor(x, y) {
    const w = this.world;
    this.booms.push({ x: x + 0.5, y: y + 0.5, t: 0 });
    for (const o of w.objs.slice()) if (Math.hypot(o.x + o.w / 2 - x - 0.5, o.y + o.h / 2 - y - 0.5) < 3.4) w.objs.splice(w.objs.indexOf(o), 1);
    for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) {
      const tx = x + i, ty = y + j; if (!w.inb(tx, ty)) continue;
      const d = Math.hypot(i, j), k = w.idx(tx, ty);
      if (d < 2.4) w.wall[k] = 0;
      if (d < 1.9 && w.terrain[k] !== T.WATER) w.terrain[k] = T.PATH;
    }
    w.touchTerrain();
    this.addLog("☄️ Meteoryt uderza w osadę!", null, "bad");
    for (const ch of this.chars) {
      if (Math.hypot(ch.x - x, ch.y - y) < 6) {
        ch.moodlet("scare", "Przerażenie", -25, 240);
        if (!ch.sleeping && ch.stage !== "baby") { ch.abortTask(true); ch.startTask({ type: "panic" }); }
        else if (ch.sleeping) ch.moodlet("scare", "Przerażenie", -25, 240);
      }
    }
  }
  gift(ch) {
    const v = randInt(50, 120);
    ch.money += v; ch.moodlet("gift", "Dostał" + ch.g("", "a") + " prezent", 12, 300);
    this.fxAt(ch, "🎁"); ch.say("Prezent?! Dziękuję! 🎁");
    this.addLog(`🎁 ${ch.name} dostaje prezent (+${v} monet)`, ch, "good");
  }
  love() {
    const cs = this.chars.filter(c => c.adult && c.partner === null);
    const pairs = [];
    for (const a of cs) for (const b of cs) if (a.id < b.id && a.attractedTo(b) && b.attractedTo(a)) pairs.push([a, b]);
    if (!pairs.length) { this.addLog("💘 Eliksir nie znalazł pasującej pary…", null); return false; }
    const [a, b] = pick(pairs);
    a.bump(b, 18, 38);
    this.heartBurst(a); this.heartBurst(b);
    this.addLog(`💘 Eliksir miłości działa na ${a.name} i ${b.name}!`, a, "love");
    return true;
  }
  quarrel() {
    const cs = this.chars.filter(c => c.stage !== "baby");
    if (cs.length < 2) return;
    const a = pick(cs); let b; do { b = pick(cs); } while (b === a);
    a.bump(b, -35, -8);
    this.fxAt(a, "💢"); this.fxAt(b, "💢");
    a.moodlet("fight", "Kłótnia", -14, 300); b.moodlet("fight", "Kłótnia", -14, 300);
    this.addLog(`⚡ Gwałtowna kłótnia: ${a.name} i ${b.name}`, a, "bad");
  }
  newcomer() {
    if (this.chars.length >= MAX_POP) { this.addLog("🚫 Osada jest pełna", null); return null; }
    const ch = this.spawnChar({ age: rand(9, 22), pos: [1, randInt(18, 24)] });
    this.addLog(`🚶 ${ch.name} wprowadza się do osady${ch.home < 0 ? " (bez domu!)" : ""}`, ch, "good");
    return ch;
  }
  randomEvent() {
    const cs = this.chars.filter(c => c.stage !== "baby");
    if (!cs.length) return;
    const k = Math.random();
    if (k < 0.3) { const c = pick(cs); const v = randInt(20, 90); c.money += v; c.moodlet("wallet", "Znalezisko", 8, 240); this.fxAt(c, "💰"); this.addLog(`💰 ${c.name} znajduje portfel (+${v} monet)`, c); }
    else if (k < 0.5 && this.rainTarget === 0) this.startRain(rand(90, 240));
    else if (k < 0.65) this.quarrel();
    else if (k < 0.8) this.newcomer();
    else if (k < 0.9) { const c = pick(cs); c.moodlet("idea", "Przypływ weny", 10, 400); this.addLog(`💡 ${c.name} ma świetny pomysł`, c); }
    else if (!this.party && this.hour >= 15 && this.hour < 21) this.startParty();
  }

  /* ---------- zapis ---------- */
  serialize() {
    return JSON.stringify({
      v: 1, min: this.min, settings: this.settings, rain: this.rain, nextId: this.nextCharId,
      world: this.world.toJSON(), chars: this.chars, log: this.log.slice(-30),
    });
  }
  load(str) {
    const j = JSON.parse(str);
    if (!j || j.v !== 1) throw new Error("zły zapis");
    this.world.fromJSON(j.world);
    this.min = j.min; this.lastDay = this.day; this.settings = Object.assign(this.settings, j.settings);
    this.rain = j.rain || 0; this.rainTarget = 0; this.party = null; this.nextCharId = j.nextId;
    this.chars = j.chars.map(o => {
      const c = new Character(this, o);
      const p = this.world.nearestWalkable(Math.floor(o.x), Math.floor(o.y)) || [32, 26];
      c.x = p[0] + 0.5; c.y = p[1] + 0.5;
      return c;
    });
    this.log = j.log || []; this.fx = []; this.booms = []; this.nextEvent = this.min + 800;
    this.addLog("📂 Wczytano zapis", null);
  }
}
