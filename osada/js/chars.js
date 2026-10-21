/* mieszkańcy: charaktery, potrzeby, decyzje (utility AI), relacje */

/** {łem|łam} -> forma zależna od płci */
const gf = (text, female) => text.replace(/\{([^|}]*)\|([^}]*)\}/g, (_, m, f) => (female ? f : m));

const TRAITS = {
  pracowity:   { name: "Pracowity",     emoji: "💼", work: 1.6 },
  leniwy:      { name: "Leniwy",        emoji: "🛋️", work: 0.3, energyDecay: 1.25 },
  towarzyski:  { name: "Towarzyski",    emoji: "🎉", social: 1.5, talk: 1.5 },
  samotnik:    { name: "Samotnik",      emoji: "🌙", social: 0.55, talk: 0.5 },
  lakomczuch:  { name: "Łakomczuch",    emoji: "🍔", hunger: 1.4 },
  romantyk:    { name: "Romantyk",      emoji: "💘", flirt: 2.2 },
  klotliwy:    { name: "Kłótliwy",      emoji: "😠", argue: 2.5, kind: 0.5 },
  mily:        { name: "Miły",          emoji: "😇", argue: 0.25, kind: 1.7 },
  artysta:     { name: "Artysta",       emoji: "🎨", piano: 2.4 },
  wesoly:      { name: "Wesoły",        emoji: "😄", moodBase: 7 },
  melancholik: { name: "Melancholijny", emoji: "🌧️", moodBase: -7, piano: 1.4 },
  nocny:       { name: "Nocny marek",   emoji: "🦉", night: 1 },
  plotkarz:    { name: "Plotkarz",      emoji: "🗣️", gossip: 3 },
  wedkarz:     { name: "Wędkarz",       emoji: "🎣", fish: 2.5 },
};
const CONFLICTS = [["pracowity", "leniwy"], ["towarzyski", "samotnik"], ["klotliwy", "mily"], ["wesoly", "melancholik"]];

const AGE = { baby: 0.5, child: 4, teen: 7, elder: 30 };       // w dniach gry
const stageOf = a => (a < AGE.baby ? "baby" : a < AGE.child ? "child" : a < AGE.teen ? "teen" : a < AGE.elder ? "adult" : "elder");
const stageName = (st, f) => ({ baby: "Niemowlę", child: f ? "Dziewczynka" : "Chłopiec", teen: f ? "Nastolatka" : "Nastolatek", adult: f ? "Dorosła" : "Dorosły", elder: f ? "Seniorka" : "Senior" }[st]);
const ageYears = a => Math.max(0, Math.round(a * 2.4));

const urg = v => Math.pow((100 - v) / 100, 2) * 100;

const PRIO = { wander: 0, tv: 1, piano: 1, flowers: 1, fire: 1, bench: 1, fish: 1, shelter: 2, work: 2, talk: 3, shop: 3, eat: 4, berry: 4, sleep: 5, party: 6, goto: 7, panic: 8 };

const TASK_LABEL = {
  wander: ["🚶", "Spaceruje"], tv: ["📺", "Ogląda telewizję"], piano: ["🎹", "Gra na pianinie"], flowers: ["🌸", "Wącha kwiaty"],
  fire: ["🔥", "Siedzi przy ognisku"], bench: ["🪑", "Odpoczywa na ławce"], fish: ["🎣", "Łowi ryby"], shelter: ["☂️", "Chowa się przed deszczem"],
  work: ["💼", "Pracuje"], talk: ["💬", "Rozmawia"], shop: ["🛒", "Robi zakupy"], eat: ["🍽️", "Je posiłek"], berry: ["🫐", "Zbiera jagody"],
  sleep: ["😴", "Śpi"], party: ["🎉", "Bawi się na imprezie"], goto: ["📍", "Idzie, gdzie kazano"], panic: ["😱", "Panikuje"],
};

const MOODS = [[80, "😄", "Wspaniały nastrój"], [62, "🙂", "Dobry nastrój"], [45, "😐", "Neutralnie"], [28, "🙁", "Kiepski nastrój"], [0, "😫", "Fatalny nastrój"]];
const moodInfo = m => MOODS.find(x => m >= x[0]);

/* ----- teksty rozmów ----- */
const SAY = {
  chat: ["Piękny dzień, prawda?", "Co u ciebie słychać?", "Zastanawiam się, co będzie na kolację…", "Ta osada jest całkiem przytulna.", "Słyszysz tych ptaków?", "Dawno nie gadaliśmy!"],
  chatNeed: {
    hunger: ["Burczy mi w brzuchu…", "Zjadłbym coś dobrego."],
    energy: ["Ledwo stoję na nogach.", "Muszę się zdrzemnąć…"],
    fun: ["Nudzi mi się strasznie.", "Brakuje mi jakiejś rozrywki."],
    money: ["Cienko u mnie z pieniędzmi…", "Muszę więcej zarabiać."],
    rain: ["Ale leje!", "Nie lubię takiej pogody."],
    night: ["Ale piękne gwiazdy dziś.", "Cicho tu nocą, co?"],
  },
  joke: ["Dlaczego komputer poszedł do lekarza? Złapał wirusa!", "Co mówi ogień do drewna? Kocham cię… na zabój!", "Wiesz, czemu kura przeszła przez drogę? Bo chciała zmienić kurnik!", "Jak nazywa się smutny ser? Tylko ser(ek)!", "Rozmawiają dwa ziemniaki… i się obrały."],
  jokeGood: ["Haha! 😂", "Dobre!", "Ale suchar, ha ha!", "Ten mnie rozbawił!"],
  jokeBad: ["Eee… no.", "To było słabe.", "Hm. Śmiech przez łzy…", "Nie zrozumiałem/am."],
  compliment: ["Świetnie dziś wyglądasz!", "Zawsze poprawiasz mi humor.", "Jesteś naprawdę fajną osobą.", "Cieszę się, że tu jesteś."],
  complimentRe: ["Aww, dziękuję! 😊", "Miło mi to słyszeć.", "Ty też jesteś super!"],
  story: ["Opowiem ci o dziwnym śnie, który miał{em|am}…", "Raz złowi{łem|łam} rybę większą od własnej głowy!", "Kiedyś zgubi{łem|łam} się w lesie na całą noc.", "Pamiętam, jak tu było pusto…"],
  storyRe: ["Serio? Opowiadaj dalej!", "Ha, niesamowite!", "Nie wierzę!"],
  gossip: ["Ciekawe, co {X} dziś kombinuje…", "Słyszał{em|am}, że {X} ma jakieś tajemnice.", "Widzia{łem|łam} {X} w nocy przy stawie…"],
  gossipRe: ["Ooo, mów więcej!", "Nie plotkujmy… no dobra, plotkujmy.", "Wiedziałem/am!"],
  flirt: ["Masz piękny uśmiech…", "Czy to ty, czy słońce świeci?", "Chętnie spędzę z tobą więcej czasu.", "Przy tobie czas płynie szybciej…"],
  flirtGood: ["Rumienię się… 💕", "Och, dziękuję!", "Ja też cię lubię…"],
  flirtBad: ["Hm… raczej nie.", "Wolę zostać przyjaciółmi.", "Ojej, nie jestem pewn{y|a}…"],
  hug: ["*przytula*", "Chodź tu!", "Należy ci się uścisk."],
  hugRe: ["*przytula mocno*", "Dziękuję, tego potrzebował{em|am}."],
  argue: ["Znowu to samo!", "Nie masz racji!", "Dość tego!", "Z tobą się nie da rozmawiać!", "Nie rozumiesz niczego!"],
  argueRe: ["To ty zaczynasz!", "Odczep się!", "Mam tego dość!", "Wcale nie!"],
  play: ["Berek! Gonisz!", "Zagrajmy w chowanego!", "Ścigamy się!", "Patrz, co potrafię!"],
  playRe: ["Hurra!", "Haha, nie dogonisz mnie!", "Jeszcze raz!"],
  greet: ["Cześć! Miło cię widzieć 😊", "Hej hej!", "No cześć!", "Witaj, wędrowcze!"],
};

/* kto jest zainteresowany kim */
const ATTR = ["f", "m", "both"];

class Character {
  constructor(sim, o) {
    this.sim = sim;
    this.id = o.id; this.name = o.name; this.female = !!o.female; this.age = o.age;
    this.look = o.look; this.traits = o.traits; this.attr = o.attr || "both";
    this.home = o.home === undefined ? -1 : o.home;
    this.needs = o.needs || { hunger: rand(55, 90), energy: rand(60, 92), fun: rand(40, 85), social: rand(40, 85) };
    this.money = o.money === undefined ? randInt(40, 120) : o.money;
    this.x = o.x; this.y = o.y;
    this.rel = o.rel || {};
    this.family = new Set(o.family || []);
    this.parents = o.parents || [];
    this.partner = o.partner === undefined ? null : o.partner;
    this.mem = o.mem || [];
    this.moodlets = o.moodlets || [];
    this.lastStage = stageOf(this.age);
    this.path = []; this.task = null; this.walking = false; this.face = 1; this.pose = "stand";
    this.sleeping = false; this.carried = false; this.dead = false;
    this.bubble = null; this.thought = ""; this.mood = 70; this.avoid = {};
    this.nextThink = 0; this.pver = -1; this.intCheck = 0; this.thinkTick = 0; this.chat = [];
    this.fxT = 0; this.anim = rand(0, 10);
  }

  /* ---------- tworzenie ---------- */
  static randomTraits(n = 3, base = []) {
    const keys = Object.keys(TRAITS), out = base.slice(0, n);
    let guard = 0;
    while (out.length < n && guard++ < 50) {
      const k = pick(keys);
      if (out.includes(k)) continue;
      if (CONFLICTS.some(([a, b]) => (a === k && out.includes(b)) || (b === k && out.includes(a)))) continue;
      out.push(k);
    }
    return out;
  }
  static randomLook(female, age) {
    return {
      skin: pick(SKINS), hair: pick(HAIRS), style: female ? pick([1, 1, 3, 0, 4]) : pick([0, 0, 2, 5, 4]),
      shirt: pick(SHIRTS), pants: pick(PANTS), hat: chance(0.12),
    };
  }

  toJSON() {
    return {
      id: this.id, name: this.name, female: this.female, age: this.age, look: this.look, traits: this.traits, attr: this.attr, home: this.home,
      needs: this.needs, money: this.money, x: this.x, y: this.y, rel: this.rel, family: [...this.family], parents: this.parents,
      partner: this.partner, mem: this.mem.slice(-20), moodlets: this.moodlets,
    };
  }

  /* ---------- pomocnicze ---------- */
  get stage() { return stageOf(this.age); }
  get adult() { return this.age >= AGE.teen; }
  get tx() { return Math.floor(this.x); }
  get ty() { return Math.floor(this.y); }
  m(key) { return this.traits.reduce((a, t) => a * (TRAITS[t][key] === undefined ? 1 : TRAITS[t][key]), 1); }
  moodBase() { return this.traits.reduce((a, t) => a + (TRAITS[t].moodBase || 0), 0); }
  g(m, f) { return this.female ? f : m; }
  f(text) { return gf(text, this.female); }
  isNight(h = this.sim.hour) { return this.traits.includes("nocny") ? (h >= 8 && h < 17) : (h >= 22 || h < 6); }
  inWorkTime(h = this.sim.hour) { return this.traits.includes("nocny") ? (h >= 20 || h < 4) : (h >= 8 && h < 17); }
  say(text, dur = 2.8) { this.bubble = { text: this.f(text), t: 0, dur }; }
  memo(text) { this.mem.push({ t: this.sim.min, text }); if (this.mem.length > 40) this.mem.shift(); }
  moodlet(key, text, v, mins) {
    const e = this.moodlets.find(m => m.key === key);
    const until = this.sim.min + mins;
    if (e) { e.until = until; e.v = v; } else this.moodlets.push({ key, text, v, until });
  }
  mkRel(o) {
    return this.rel[o.id] || (this.rel[o.id] = { f: this.family.has(o.id) ? 70 : 0, r: 0, met: this.family.has(o.id), s: "" });
  }
  compat(o) {
    let c = hash2(Math.min(this.id, o.id) * 7 + 3, Math.max(this.id, o.id) * 13 + 5) * 30 - 15;
    for (const t of this.traits) if (o.traits.includes(t)) c += 5;
    for (const [a, b] of CONFLICTS) if ((this.traits.includes(a) && o.traits.includes(b)) || (this.traits.includes(b) && o.traits.includes(a))) c -= 9;
    return c;
  }
  attractedTo(o) {
    if (!this.adult || !o.adult || this.family.has(o.id)) return false;
    if (this.attr === "both") return true;
    return this.attr === (o.female ? "f" : "m");
  }
  relLabel(o) {
    const r = this.rel[o.id];
    if (this.family.has(o.id)) return "👪 Rodzina";
    if (this.partner === o.id) return "💞 Para";
    if (!r || !r.met) return "Obcy";
    if (r.f <= -30) return "😠 Wrogowie";
    if (r.f >= 65) return "🤝 Najlepsi przyjaciele";
    if (r.r >= 30 && this.attractedTo(o)) return "💘 Zauroczenie";
    if (r.f >= 25) return "🙂 Przyjaciele";
    return "Znajomi";
  }
  describeMood() {
    const n = this.needs;
    if (n.hunger < 22) return this.f("Jestem strasznie głodn{y|a}!");
    if (n.energy < 20) return this.f("Padam z nóg, jestem wykończon{y|a}.");
    if (n.social < 20) return "Czuję się trochę samotnie…";
    if (n.fun < 20) return "Okropnie się nudzę.";
    const mi = moodInfo(this.mood);
    return mi[0] >= 80 ? "Świetnie! Życie jest piękne!" : mi[0] >= 62 ? "Całkiem dobrze, dzięki." : mi[0] >= 45 ? "Jakoś leci." : mi[0] >= 28 ? "Nie jest najlepiej…" : "Fatalnie. Wszystko mnie dołuje.";
  }

  /* ---------- aktualizacja ---------- */
  update(dt, dtMin) {
    if (this.dead || this.carried) return;
    const sim = this.sim, n = this.needs, sl = this.sleeping;
    this.age += (dtMin / 1440) * 0.4;
    this.anim += dt;

    const st = this.stage;
    if (st !== this.lastStage) {
      this.lastStage = st;
      sim.addLog(`🎂 ${this.name} jest teraz: ${stageName(st, this.female).toLowerCase()}`, this);
      this.memo(`Zostaję: ${stageName(st, this.female).toLowerCase()}.`);
    }

    n.hunger -= 0.065 * dtMin * this.m("hunger") * (sl ? 0.5 : 1);
    n.energy += sl ? 0.22 * dtMin : -0.058 * dtMin * this.m("energyDecay");
    n.fun -= 0.05 * dtMin * (sl ? 0.3 : 1);
    n.social -= 0.053 * dtMin * this.m("social") * (sl ? 0.3 : 1);
    for (const k in n) n[k] = clamp(n[k], 0, 100);

    this.moodlets = this.moodlets.filter(m => m.until > sim.min);
    const base = n.hunger * 0.3 + n.energy * 0.3 + n.fun * 0.2 + n.social * 0.2;
    let mood = base * 0.88 + 12 + this.moodBase();
    for (const m of this.moodlets) mood += m.v;
    for (const k in n) if (n[k] < 12) mood -= 7;
    this.mood = clamp(mood, 0, 100);

    if (st === "baby") { this.pose = "baby"; return; }

    if (this.task) {
      this.intCheck += dt;
      if (this.intCheck > 1.5) { this.intCheck = 0; this.checkInterrupt(); }
      if (this.task) this.runTask(dt, dtMin);
    } else {
      this.walking = false;
      if (sim.min >= this.nextThink) this.think();
    }
  }

  tickReal(dt) {
    if (this.bubble) { this.bubble.t += dt; if (this.bubble.t > this.bubble.dur) this.bubble = null; }
  }

  checkInterrupt() {
    const t = this.task, n = this.needs;
    if (!t || t.forced) return;
    const pr = PRIO[t.type] ?? 1;
    if (t.type === "sleep") { if (n.hunger < 4 && chance(0.5)) this.finishTask(); return; }
    if (n.hunger < 12 && pr < 4) { this.abortTask(); this.nextThink = 0; this.thought = "Muszę coś zjeść…"; return; }
    if (n.energy < 8 && pr < 5 && t.type !== "talk") { this.abortTask(); this.nextThink = 0; return; }
    if (this.sim.rain > 0.3 && !this.sim.world.isIndoor(this.x, this.y) && pr <= 1) { this.abortTask(); this.nextThink = 0; return; }
  }

  /* ---------- decyzje ---------- */
  think() {
    const sim = this.sim, w = sim.world, n = this.needs, hour = sim.hour;
    const cands = [];
    const add = (score, task) => { if (score > 0) cands.push({ score: score * (0.88 + Math.random() * 0.24), task }); };
    const dist = o => Math.hypot(o.x + (o.w || 1) / 2 - this.x, o.y + (o.h || 1) / 2 - this.y);
    const ok = key => !(this.avoid[key] > sim.min);
    const night = this.isNight(hour);
    const raining = sim.rain > 0.25 && !w.isIndoor(this.x, this.y);
    const wet = o => (sim.rain > 0.25 && !w.isIndoor(o.x, o.y) ? 28 : 0);
    const isChild = this.stage === "child";
    const myHome = w.homes[this.home];
    const inHome = o => myHome && o.x >= myHome.x && o.x < myHome.x + myHome.w && o.y >= myHome.y && o.y < myHome.y + myHome.h;

    // jedzenie
    if (n.hunger < 82) {
      const u = urg(n.hunger);
      for (const f of w.ofType("fridge")) if (f.data.food > 0 && ok("eat:" + f.id)) add(u * 1.6 - dist(f) * 0.4 + (inHome(f) ? 6 : 0), { type: "eat", obj: f });
      for (const b of w.ofType("bush")) if (b.data.berries > 0 && n.hunger < 70 && ok("berry:" + b.id)) add(u * 1.15 - dist(b) * 0.45 - wet(b), { type: "berry", obj: b });
      if (w.shoreSpots().length && n.hunger < 60 && !raining) add(u * 0.5 * this.m("fish") + urg(n.fun) * 0.45 - 8, { type: "fish" });
    }
    // zakupy
    const food = w.ofType("fridge").reduce((a, f) => a + f.data.food, 0);
    const stall = w.ofType("stall")[0];
    if (stall && this.adult && food < 3 && this.money >= 15 && hour >= 7 && hour < 21 && ok("shop")) add(Math.max(urg(n.hunger) * 1.2, 42) - dist(stall) * 0.2 - wet(stall), { type: "shop", obj: stall });

    // sen
    if (n.energy < 88) {
      let base = urg(n.energy) * (night ? 1.8 : 0.75) + (night && n.energy < 75 ? 20 : 0);
      if (!night && n.energy > 45) base *= 0.4;
      const beds = w.ofType("bed").filter(b => !b.data.sleeper && (!b.data.res || b.data.res === this.id) && ok("sleep:" + b.id));
      if (beds.length) for (const b of beds) add(base + (inHome(b) ? 10 : 0) - dist(b) * 0.25, { type: "sleep", obj: b });
      else {
        const seats = w.ofType("bench").concat(w.ofType("sofa")).filter(b => !b.data.sleeper && ok("sleep:" + b.id));
        for (const b of seats) add(base * 0.65 - dist(b) * 0.3 - wet(b), { type: "sleep", obj: b });
        if (n.energy < 22) add(base * 0.55, { type: "sleep", obj: null });
      }
    }

    // rozrywka
    const uf = urg(n.fun);
    for (const tv of w.ofType("tv")) if (tv.data.users < 2 && ok("tv:" + tv.id)) add(uf * 0.95 * (night && hour < 23.5 ? 1.2 : 1) - dist(tv) * 0.3 + (inHome(tv) ? 5 : 0), { type: "tv", obj: tv });
    if (hour >= 8 && hour < 23) for (const p of w.ofType("piano")) if (ok("piano:" + p.id) && !isChild) add(uf * 0.85 * this.m("piano") - dist(p) * 0.3, { type: "piano", obj: p });
    for (const fl of w.ofType("flowers")) if (ok("flowers:" + fl.id) && dist(fl) < 18) add(uf * 0.3 + 3 - dist(fl) * 0.3 - wet(fl), { type: "flowers", obj: fl });
    for (const c of w.ofType("campfire")) if (ok("fire:" + c.id)) add(uf * 0.5 + urg(n.social) * 0.45 + (night && hour < 24 ? 12 : 0) - dist(c) * 0.25 - wet(c), { type: "fire", obj: c });
    for (const b of w.ofType("bench")) if (ok("bench:" + b.id) && dist(b) < 25) add(urg(n.energy) * 0.3 + urg(n.social) * 0.2 + 3 - dist(b) * 0.3 - wet(b), { type: "bench", obj: b });
    if (w.shoreSpots().length && !raining && !night) add(uf * 0.55 * this.m("fish") + (this.m("fish") > 1 ? 10 : 0) - 6, { type: "fish" });

    // towarzystwo
    const us = urg(n.social);
    for (const o of sim.chars) {
      if (o === this || o.dead || o.sleeping || o.carried || o.stage === "baby") continue;
      if (o.task && (o.task.type === "talk" || o.task.type === "panic")) continue;
      if (!ok("talk:" + o.id)) continue;
      const r = this.rel[o.id], f = r ? r.f : 0;
      let s = us * 1.05 * this.m("talk") + f * 0.12 + (r && r.met ? 0 : 5) - dist(o) * 0.28;
      if (r && r.r > 30 && this.attractedTo(o)) s += r.r * 0.12;
      if (f < -30) s -= this.m("argue") > 1.5 ? -4 : 38;
      if (isChild && (o.stage === "child" || this.family.has(o.id))) s += 10;
      if (o.stage === "child" && this.adult && !this.family.has(o.id)) s -= 6;
      add(s, { type: "talk", partner: o });
    }

    // praca
    if (this.stage === "adult" || this.stage === "elder") {
      if (this.inWorkTime(hour) && this.money < 600 && ok("work")) {
        const desks = w.ofType("desk").concat(w.ofType("workbench"));
        const u = this.money < 30 ? 60 : this.money < 90 ? 38 : this.money < 200 ? 20 : 8;
        for (const d of desks) add(u * this.m("work") - (n.energy < 25 ? 30 : 0) - (n.hunger < 30 ? 20 : 0) - dist(d) * 0.2 + (inHome(d) ? 5 : 0) - wet(d), { type: "work", obj: d });
      }
    }

    // schronienie przed deszczem
    if (raining && sim.party === null) add(58, { type: "shelter" });

    // spacer zawsze możliwy
    add(8 + urg(n.fun) * 0.3, { type: "wander" });

    cands.sort((a, b) => b.score - a.score);
    const best = cands[0];
    this.startTask(best.task);
    this.updateThought();
  }

  updateThought() {
    const n = this.needs;
    const low = Object.entries(n).sort((a, b) => a[1] - b[1])[0];
    let t = "";
    if (low[1] < 20) t = { hunger: "Umieram z głodu…", energy: "Padam z nóg…", fun: "Strasznie się nudzę.", social: "Ale mi samotnie…" }[low[0]];
    else if (this.mood > 82) t = pick(["Życie jest piękne!", "Cudowny dzień!", "Czuję się świetnie."]);
    else if (this.task) t = pick(["Hm, co teraz…", "Zobaczymy, co z tego wyjdzie.", "Do dzieła!", "Pora na " + (TASK_LABEL[this.task.type] || ["", "coś"])[1].toLowerCase() + "."]);
    this.thought = t;
  }

  /* ---------- zadania ---------- */
  startTask(task) {
    this.abortTask(true);
    const t = Object.assign({ phase: "goto", t: 0, dur: 0, repath: 0 }, task);
    this.task = t;
    this.pver = -1;
    const goal = this.goalFor(t);
    if (!goal) { this.failTask(t.type === "talk" ? "talk:" + (t.partner && t.partner.id) : t.type + ":" + (t.obj ? t.obj.id : "")); return; }
    t.goal = goal;
    this.setPath(goal);
    if (this.path === null) { this.failTask(t.type + ":" + (t.obj ? t.obj.id : "")); return; }
    if (t.type === "sleep" && t.obj) t.obj.data.res = this.id;
    this.icon = (TASK_LABEL[t.type] || ["", ""])[0];
  }

  goalFor(t) {
    const w = this.sim.world;
    const near = (x, y) => w.nearestWalkable(x, y);
    switch (t.type) {
      case "talk": { const p = t.partner; if (!p) return null; return near(p.tx, p.ty); }
      case "wander": {
        for (let i = 0; i < 8; i++) {
          const a = rand(0, Math.PI * 2), r = rand(3, 13);
          const g = [Math.round(this.x + Math.cos(a) * r), Math.round(this.y + Math.sin(a) * r)];
          if (w.walkable(g[0], g[1]) && (w.isIndoor(g[0], g[1]) === w.isIndoor(this.x, this.y) || chance(0.4))) return g;
        }
        return near(this.tx, this.ty);
      }
      case "shelter": {
        const own = w.homes[this.home];
        const homes = own ? [own, ...w.homes.filter(h => h !== own)] : w.homes;
        let best = null, bd = 1e9;
        for (const h of homes) {
          const d = Math.hypot(h.door[0] - this.x, h.door[1] - this.y) + (h === own ? -6 : 0);
          if (d < bd) { bd = d; best = h; }
        }
        if (!best) return null;
        for (let i = 0; i < 20; i++) {
          const x = randInt(best.x + 1, best.x + best.w - 2), y = randInt(best.y + 1, best.y + best.h - 2);
          if (w.walkable(x, y)) return [x, y];
        }
        return best.door;
      }
      case "party": {
        const p = this.sim.party; if (!p) return null;
        for (let i = 0; i < 20; i++) {
          const x = Math.round(p.x + rand(-3, 3)), y = Math.round(p.y + rand(-3, 3));
          if (w.walkable(x, y)) return [x, y];
        }
        return near(p.x, p.y);
      }
      case "goto": return near(t.tile[0], t.tile[1]);
      case "panic": {
        const a = rand(0, Math.PI * 2);
        return near(Math.round(this.x + Math.cos(a) * 8), Math.round(this.y + Math.sin(a) * 8));
      }
      case "fish": {
        const s = w.shoreSpots(); if (!s.length) return null;
        const sorted = s.slice().sort((a, b) => Math.hypot(a[0] - this.x, a[1] - this.y) - Math.hypot(b[0] - this.x, b[1] - this.y));
        return pick(sorted.slice(0, 8));
      }
      case "sleep":
        if (!t.obj) return [this.tx, this.ty];
        return w.bestSpot(t.obj, this.x, this.y);
      default:
        if (!t.obj) return null;
        return w.bestSpot(t.obj, this.x, this.y);
    }
  }

  setPath(goal) {
    const w = this.sim.world;
    const p = w.findPath(this.tx, this.ty, goal[0], goal[1]);
    if (p === null) { this.path = null; return; }
    this.path = p;
    this.pver = w.version;
  }

  failTask(key) {
    const t = this.task;
    this.avoid[key] = this.sim.min + 90;
    this.cleanup(t);
    this.task = null; this.path = []; this.walking = false; this.icon = "";
    this.nextThink = this.sim.min + 5;
    if (t && t.forced) this.say("Nie mogę tam dojść…");
  }

  abortTask(silent) {
    if (!this.task) return;
    this.cleanup(this.task);
    const t = this.task;
    this.task = null; this.path = []; this.walking = false; this.pose = "stand"; this.icon = "";
    if (t.type === "talk" && t.phase === "do" && t.partner && t.partner.task && t.partner.task.partner === this) t.partner.finishTask();
    if (!silent) this.nextThink = this.sim.min + rand(0, 4);
  }

  finishTask() {
    const t = this.task;
    if (!t) return;
    const D = DO[t.type];
    if (D && D.end && t.phase === "do") D.end(this, t);
    this.cleanup(t);
    this.task = null; this.path = []; this.walking = false; this.pose = "stand"; this.icon = "";
    this.nextThink = this.sim.min + rand(0, 8);
  }

  cleanup(t) {
    if (!t) return;
    if (t.type === "sleep") {
      if (t.obj && (t.obj.data.sleeper === this.id)) {
        t.obj.data.sleeper = null;
        const s = this.sim.world.bestSpot(t.obj, t.obj.x, t.obj.y);
        if (s) { this.x = s[0] + 0.5; this.y = s[1] + 0.5; }
      }
      if (t.obj && t.obj.data.res === this.id) t.obj.data.res = null;
      this.sleeping = false;
    }
    if (t.type === "tv" && t.counted) { t.obj.data.users = Math.max(0, t.obj.data.users - 1); t.counted = false; }
    this.pose = "stand";
  }

  speed() {
    const st = this.stage;
    let s = st === "child" ? 2.4 : st === "teen" ? 2.7 : st === "elder" ? 1.9 : 2.6;
    if (this.task && this.task.type === "panic") s *= 1.7;
    return s * (0.9 + this.mood / 500);
  }

  /** zwraca true, gdy ścieżka skończona */
  followPath(dt) {
    const w = this.sim.world;
    if (this.path && this.path.length && this.pver !== w.version && this.task && this.task.goal) {
      this.setPath(this.task.goal);
      if (this.path === null) { this.failTask(this.task.type + ":x"); return false; }
    }
    if (!this.path || !this.path.length) { this.walking = false; return true; }
    let budget = this.speed() * dt;
    while (budget > 0 && this.path.length) {
      const p = this.path[0], tx = p[0] + 0.5, ty = p[1] + 0.5;
      const dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy);
      if (Math.abs(dx) > 0.05) this.face = dx > 0 ? 1 : -1;
      if (d <= budget) { this.x = tx; this.y = ty; this.path.shift(); budget -= d; }
      else { this.x += (dx / d) * budget; this.y += (dy / d) * budget; budget = 0; }
    }
    this.walking = true;
    if (!this.path.length) { this.walking = false; return true; }
    return false;
  }

  runTask(dt, dtMin) {
    const t = this.task;
    if (t.phase === "goto") {
      t.t += dt;
      if (t.type === "talk") {
        const p = t.partner;
        if (!p || p.dead || p.sleeping || p.carried || (p.task && p.task.type === "talk" && p.task.partner !== this)) { this.failTask("talk:" + (p && p.id)); return; }
        const d = Math.hypot(p.x - this.x, p.y - this.y);
        if (d < 1.5) { this.beginDo(); return; }
        t.repath += dt;
        if (t.repath > 0.8) { t.repath = 0; t.goal = [p.tx, p.ty]; this.setPath(t.goal); if (this.path === null) { this.failTask("talk:" + p.id); return; } }
      }
      const arrived = this.followPath(dt);
      if (!this.task) return;
      if (arrived && t.type !== "talk") this.beginDo();
      else if (arrived && t.type === "talk") this.beginDo();
      else if (t.t > 90) this.failTask(t.type + ":" + (t.obj ? t.obj.id : ""));
    } else {
      t.t += dtMin;
      const D = DO[t.type];
      if (D && D.tick) D.tick(this, t, dtMin, dt);
      if (this.task === t && t.t >= t.dur) this.finishTask();
    }
  }

  beginDo() {
    const t = this.task, D = DO[t.type];
    t.phase = "do"; t.t = 0;
    this.walking = false;
    if (D && D.begin) {
      const res = D.begin(this, t);
      if (res === false) { this.failTask(t.type + ":" + (t.obj ? t.obj.id : "")); return; }
    }
    if (t.obj) this.face = (t.obj.x + t.obj.w / 2) >= this.x ? 1 : -1;
  }

  /* ---------- interakcje społeczne ---------- */
  bump(o, df, dr) {
    const a = this.mkRel(o), b = o.mkRel(this);
    const first = !a.met;
    a.met = b.met = true;
    a.f = clamp(a.f + df, -100, 100); b.f = clamp(b.f + df * rand(0.8, 1.2), -100, 100);
    if (dr) { a.r = clamp(a.r + dr, 0, 100); b.r = clamp(b.r + dr * rand(0.5, 1.1), 0, 100); }
    if (first) { this.memo(`Poznał${this.g("em", "am")} ${o.name}.`); o.memo(`Poznał${o.g("em", "am")} ${this.name}.`); this.sim.addLog(`👋 ${this.name} i ${o.name} poznają się`, this); }
    this.checkStatus(o); o.checkStatus(this);
  }

  checkStatus(o) {
    const r = this.rel[o.id], sim = this.sim;
    if (!r) return;
    let s = "";
    if (r.f >= 65) s = "bff"; else if (r.f >= 25) s = "friends"; else if (r.f <= -30) s = "enemy";
    r.fl = r.fl || {};
    if (s !== r.s) {
      const prev = r.s; r.s = s;
      const first = s && !r.fl[s]; if (s) r.fl[s] = 1;
      if (!first) return;
      if (s === "friends" && prev !== "bff" && this.id < o.id) { sim.addLog(`🙂 ${this.name} i ${o.name} zostają przyjaciółmi`, this); this.memo(`${o.name} został${o.g("", "a")} moim przyjacielem.`); }
      if (s === "bff" && this.id < o.id) { sim.addLog(`🤝 ${this.name} i ${o.name} to teraz najlepsi przyjaciele!`, this, "good"); }
      if (s === "enemy" && this.id < o.id) { sim.addLog(`😠 ${this.name} i ${o.name} są wrogami`, this, "bad"); this.memo(`Nie cierpię ${o.name}.`); }
    }
    // para
    const ro = o.rel[this.id];
    if (!this.partner && !o.partner && ro && r.r >= 70 && ro.r >= 55 && r.f >= 40 && this.attractedTo(o) && o.attractedTo(this)) {
      this.partner = o.id; o.partner = this.id;
      sim.addLog(`💞 ${this.name} i ${o.name} zostają parą!`, this, "love");
      this.memo(`Zostaliśmy parą z ${o.name}!`); o.memo(`Zostaliśmy parą z ${this.name}!`);
      this.moodlet("love", "Zakochan" + this.g("y", "a"), 18, 1500); o.moodlet("love", "Zakochan" + o.g("y", "a"), 18, 1500);
      sim.heartBurst(this); sim.heartBurst(o);
      sim.moveIn(this, o);
    }
  }

  conversationBeat(b) {
    const a = this, sim = this.sim;
    const ra = a.mkRel(b), comp = a.compat(b);
    const romance = a.attractedTo(b) && b.attractedTo(a);
    const taken = a.partner !== null && a.partner !== b.id;
    const kid = a.stage === "child" || b.stage === "child";
    const W = {
      chat: 5, joke: 3 * (a.m("kind") > 1 ? 1.3 : 1), compliment: 2 * a.m("kind"), story: 2.5, gossip: 1 * a.m("gossip"),
      flirt: romance && !taken && !kid ? 2.2 * a.m("flirt") * (ra.f > 10 ? 1.7 : 0.6) + (ra.r > 25 ? 3 : 0) : 0,
      hug: ra.f > 30 ? 2 + (a.partner === b.id ? 3 : 0) : 0,
      argue: 0.4 * a.m("argue") * (a.mood < 40 ? 2.2 : 1) + (ra.f < -20 ? 5 : 0) + (comp < -8 ? 1.2 : 0),
      play: kid ? 8 : 0,
    };
    if (kid) { W.flirt = 0; W.gossip = 0; }
    let tot = 0; for (const k in W) tot += W[k];
    let r = Math.random() * tot, id = "chat";
    for (const k in W) { if ((r -= W[k]) <= 0) { id = k; break; } }

    const succ = chance(clamp(0.58 + comp / 70 + (b.mood - 50) / 220 + ra.f / 320, 0.12, 0.95));
    const me = a.name, other = b.name;
    const fx = sim.fxAt.bind(sim);
    const n = a.needs;
    let line = "", reply = "";

    switch (id) {
      case "chat": {
        let pool = SAY.chat;
        if (chance(0.55)) {
          if (n.hunger < 35) pool = SAY.chatNeed.hunger; else if (n.energy < 35) pool = SAY.chatNeed.energy;
          else if (n.fun < 35) pool = SAY.chatNeed.fun; else if (a.money < 25) pool = SAY.chatNeed.money;
          else if (sim.rain > 0.3) pool = SAY.chatNeed.rain; else if (a.isNight()) pool = SAY.chatNeed.night;
        }
        line = pick(pool); a.bump(b, succ ? 3 : 1, 0);
        break;
      }
      case "joke":
        line = pick(SAY.joke);
        if (succ) { reply = pick(SAY.jokeGood); a.bump(b, 4, 0); a.needs.fun = clamp(a.needs.fun + 8, 0, 100); b.needs.fun = clamp(b.needs.fun + 10, 0, 100); b.moodlet("laugh", "Dobry żart", 6, 120); fx(b, "😂"); }
        else { reply = pick(SAY.jokeBad); a.bump(b, -1, 0); }
        break;
      case "compliment":
        line = pick(SAY.compliment); reply = pick(SAY.complimentRe); a.bump(b, 4, romance ? 1.5 : 0);
        b.moodlet("compl", "Komplement", 7, 180); fx(b, "✨");
        break;
      case "story":
        line = pick(SAY.story); reply = pick(SAY.storyRe); a.bump(b, 2, 0);
        a.needs.social = clamp(a.needs.social + 5, 0, 100);
        break;
      case "gossip": {
        const others = sim.chars.filter(c => c !== a && c !== b && !c.dead && c.stage !== "baby");
        if (!others.length) { line = pick(SAY.chat); a.bump(b, 1, 0); break; }
        const x = pick(others);
        line = pick(SAY.gossip).replace("{X}", x.name); reply = pick(SAY.gossipRe);
        a.bump(b, 3, 0);
        const r1 = a.mkRel(x), r2 = b.mkRel(x);
        r1.f = clamp(r1.f - 1, -100, 100); r2.f = clamp(r2.f - 2, -100, 100);
        break;
      }
      case "flirt": {
        line = pick(SAY.flirt);
        const rb = b.mkRel(a);
        const bTaken = b.partner !== null && b.partner !== a.id;
        const ok = !bTaken && chance(clamp(0.45 + comp / 60 + ra.f / 200 + (b.m("flirt") > 1 ? 0.15 : 0), 0.08, 0.92));
        if (ok) {
          reply = pick(SAY.flirtGood); a.bump(b, 2, 8);
          sim.heartBurst(a); b.moodlet("flirt", "Ktoś się mną interesuje", 8, 240);
        } else {
          reply = bTaken ? "Mam już kogoś…" : pick(SAY.flirtBad);
          a.bump(b, -1, -4); a.moodlet("rej", "Odrzucenie", -9, 240);
        }
        break;
      }
      case "hug":
        line = pick(SAY.hug); reply = pick(SAY.hugRe); a.bump(b, 3, ra.r > 20 ? 1.5 : 0);
        a.moodlet("hug", "Uścisk", 6, 180); b.moodlet("hug", "Uścisk", 6, 180); fx(b, "🤗");
        break;
      case "argue":
        line = pick(SAY.argue); reply = pick(SAY.argueRe);
        a.bump(b, -7, -3); a.moodlet("fight", "Kłótnia", -12, 300); b.moodlet("fight", "Kłótnia", -12, 300);
        fx(a, "💢"); fx(b, "💢");
        if (a.id < b.id && chance(0.5)) sim.addLog(`💢 Kłótnia: ${me} i ${other}`, a, "bad");
        break;
      case "play":
        line = pick(SAY.play); reply = pick(SAY.playRe); a.bump(b, 4, 0);
        a.needs.fun = clamp(a.needs.fun + 10, 0, 100); b.needs.fun = clamp(b.needs.fun + 10, 0, 100);
        break;
    }
    a.say(line, 3); a.needs.social = clamp(a.needs.social + (id === "argue" ? 2 : 9), 0, 100);
    b.needs.social = clamp(b.needs.social + (id === "argue" ? 2 : 9), 0, 100);
    if (reply) setTimeout(() => { if (!b.dead) b.say(reply, 2.6); }, 900);
    else if (chance(0.3)) setTimeout(() => { if (!b.dead) b.say(pick(["Mhm.", "Aha.", "No właśnie.", "Hm."]), 2); }, 900);
  }

  /* ---------- rozmowa z graczem ---------- */
  commandTask(kind) {
    const sim = this.sim, w = sim.world, n = this.needs;
    if (this.stage === "baby") return "(gaworzy)";
    const sleepyRefuse = this.sleeping && n.energy < 55;
    if (sleepyRefuse) return "Mmm… daj mi jeszcze pospać…";
    const go = task => { this.abortTask(true); this.startTask(Object.assign({ forced: true }, task)); return !!this.task; };
    const nearest = type => { const l = w.ofType(type).sort((p, q) => Math.hypot(p.x - this.x, p.y - this.y) - Math.hypot(q.x - this.x, q.y - this.y)); return l; };
    switch (kind) {
      case "sleep": {
        const bed = nearest("bed").find(b => !b.data.sleeper);
        return go({ type: "sleep", obj: bed || null }) ? "Dobrze, idę się zdrzemnąć. 😴" : "Nie mam gdzie się położyć…";
      }
      case "eat": {
        const fr = nearest("fridge").find(f => f.data.food > 0);
        if (fr) return go({ type: "eat", obj: fr }) ? "Pewnie, coś przekąszę! 🍽️" : "Nie mogę dojść do lodówki.";
        const bu = nearest("bush").find(b => b.data.berries > 0);
        if (bu) return go({ type: "berry", obj: bu }) ? "Lodówka pusta, pójdę po jagody." : "Nie dojdę.";
        return "Nie mam co jeść… Brakuje zakupów!";
      }
      case "work": {
        if (this.stage === "child" || this.stage === "teen" || this.stage === "baby") return "Jestem za młod" + this.g("y", "a") + " do pracy!";
        if (this.m("work") < 0.5 && chance(0.55)) return "Eee… nie chce mi się. Może później.";
        const d = nearest("desk").concat(nearest("workbench"))[0];
        return d && go({ type: "work", obj: d }) ? "No dobra, idę zarabiać. 💼" : "Nie mam gdzie pracować.";
      }
      case "tv": { const t = nearest("tv")[0]; return t && go({ type: "tv", obj: t }) ? "Seans czas zacząć! 📺" : "Nie ma telewizora…"; }
      case "piano": { const t = nearest("piano")[0]; return t && go({ type: "piano", obj: t }) ? "Zagram coś specjalnie dla ciebie. 🎹" : "Nie mam pianina."; }
      case "fire": { const t = nearest("campfire")[0]; return t && go({ type: "fire", obj: t }) ? "Ognisko? Świetny pomysł! 🔥" : "Nie ma ogniska."; }
      case "fish": return go({ type: "fish" }) ? "Idę łowić! 🎣" : "Nie ma gdzie łowić.";
      case "walk": return go({ type: "wander" }) ? "Przejdę się chwilę." : "Nie dam rady.";
    }
    return "Hm?";
  }

  reply(text) {
    const s = text.toLowerCase();
    const sim = this.sim;
    const has = re => re.test(s);
    let out = "";
    const personality = () => {
      if (this.traits.includes("klotliwy")) return pick(["No i co mi powiesz?", "Hm. Mów szybciej.", "Mam własne sprawy."]);
      if (this.traits.includes("mily")) return pick(["Miło, że ze mną rozmawiasz!", "Opowiedz mi coś jeszcze 😊", "Dziękuję, że pytasz!"]);
      if (this.traits.includes("samotnik")) return pick(["Hm… nie jestem zbyt rozmown" + this.g("y", "a") + ".", "Wolę ciszę, ale posłucham."]);
      if (this.traits.includes("artysta")) return pick(["Wiesz, ostatnio komponuję w głowie…", "Świat jest pełen barw."]);
      return pick(["Rozumiem.", "Ciekawe…", "Mhm, opowiadaj.", "Hm, nigdy o tym nie myśl" + this.g("ałem", "ałam") + "."]);
    };
    if (has(/jak (się )?(masz|czujesz|leci|tam)|co słychać|co u ciebie/)) out = this.describeMood();
    else if (has(/jak (masz na imię|się nazywasz)|kim jesteś/)) out = `Nazywam się ${this.name}.`;
    else if (has(/ile masz lat|jaki wiek|wiek/)) out = `Mam ${ageYears(this.age)} lat.`;
    else if (has(/głupi|idiot|brzydk|nienawidz|kretyn|tępy|beznadziejn|frajer|debil/)) {
      this.moodlet("insult", "Ktoś mnie obraził", -14, 240);
      out = this.traits.includes("klotliwy") ? "Sam jesteś głupi! 💢" : this.traits.includes("mily") ? "To… przykre. 😢" : "Nie rozmawiaj tak ze mną!";
      sim.fxAt(this, "💢");
    } else if (has(/kocham|lubię cię|lubie cie|jesteś (super|świetn|fajn|kochan|wspania|piękn|ładn|najlepsz)|ładnie wyglądasz|dobra robota/)) {
      this.moodlet("praise", "Ktoś mnie pochwalił", 10, 240);
      out = this.traits.includes("romantyk") ? "Rumienię się… dziękuję 💕" : this.traits.includes("klotliwy") ? "Hm… no, dzięki." : "Aww, dziękuję! To miłe. 😊";
      sim.fxAt(this, "💖");
    } else if (has(/dzięk|dzieki|thx/)) out = pick(["Nie ma za co!", "Proszę bardzo!", "Drobiazg."]);
    else if (has(/prosz|chodź|chodz|idź|idz|zrób|zrob|zjedz|jedz|śpij|spij|spać|pracuj|zagraj|graj|pooglądaj|oglądaj|wędk|ryb|ognisk|spacer|obiad|kolacj|telewiz|film|pianin/)) {
      if (has(/śpi|spij|spać|spac|drzemk|kładź/)) out = this.commandTask("sleep");
      else if (has(/jedz|zjedz|obiad|kolacj|głodn|śniadani/)) out = this.commandTask("eat");
      else if (has(/prac|zarób|zarob/)) out = this.commandTask("work");
      else if (has(/telewiz|film|serial|oglądaj|ogladaj|tv/)) out = this.commandTask("tv");
      else if (has(/pianin|zagraj|graj|muzyk/)) out = this.commandTask("piano");
      else if (has(/ognisk|grill/)) out = this.commandTask("fire");
      else if (has(/ryb|wędk|wedk|staw/)) out = this.commandTask("fish");
      else if (has(/spacer|przejdź|przejdz/)) out = this.commandTask("walk");
      else {
        const nm = sim.chars.find(c => c !== this && !c.dead && has(new RegExp(c.name.toLowerCase().slice(0, Math.max(3, c.name.length - 1)))));
        if (nm && nm.stage !== "baby") {
          this.abortTask(true); this.startTask({ type: "talk", partner: nm, forced: true });
          out = this.task ? `Dobrze, pogadam z ${nm.name}.` : "Nie mogę do niej/niego dojść.";
        } else out = personality();
      }
    } else if (has(/cze|hej|siema|witaj|dzień dobry|dobry wiecz|yo\b/)) out = pick(SAY.greet);
    else if (has(/głodn|jedz/)) out = this.commandTask("eat");
    else if (has(/\?$/)) out = pick(["Hmm, dobre pytanie…", "Nie jestem pewn" + this.g("y", "a") + ".", "Chyba tak?", "Muszę się zastanowić."]);
    else out = personality();
    this.say(out, 3.5);
    return this.f(out);
  }
}

/* ===== definicje czynności ===== */
const nearCount = (ch, r = 5) => ch.sim.chars.filter(o => o !== ch && !o.dead && !o.sleeping && Math.hypot(o.x - ch.x, o.y - ch.y) < r).length;

const DO = {
  eat: {
    begin(ch, t) { if (!t.obj || t.obj.data.food <= 0) return false; t.obj.data.food--; t.dur = 22; if (chance(0.25)) ch.say("Mniam!"); },
    tick(ch, t, m) { ch.needs.hunger = clamp(ch.needs.hunger + (55 / 22) * m, 0, 100); },
    end(ch) { ch.moodlet("meal", "Smaczny posiłek", 5, 150); },
  },
  berry: {
    begin(ch, t) { if (!t.obj || t.obj.data.berries <= 0) return false; t.obj.data.berries--; t.dur = 8; },
    tick(ch, t, m) { ch.needs.hunger = clamp(ch.needs.hunger + 3 * m, 0, 100); },
    end(ch) { ch.moodlet("berry", "Słodkie jagody", 3, 100); },
  },
  shop: {
    begin(ch, t) { if (ch.money < 15) return false; t.dur = 8; },
    end(ch, t) {
      ch.money -= 15;
      const w = ch.sim.world, home = w.homes[ch.home];
      const fr = w.ofType("fridge");
      const f = fr.find(x => home && x.x >= home.x && x.x < home.x + home.w && x.y >= home.y && x.y < home.y + home.h) || fr.sort((p, q) => Math.hypot(p.x - ch.x, p.y - ch.y) - Math.hypot(q.x - ch.x, q.y - ch.y))[0];
      if (f) f.data.food += 5;
      ch.memo("Zrobił" + ch.g("em", "am") + " zakupy.");
      ch.say("Lodówka znów pełna!");
    },
  },
  sleep: {
    begin(ch, t) {
      const o = t.obj;
      if (o) {
        if (o.data.sleeper && o.data.sleeper !== ch.id) return false;
        o.data.sleeper = ch.id; o.data.res = null;
        if (o.type === "bed") { ch.x = o.x + 1; ch.y = o.y + 0.55; ch.pose = "sleep"; }
        else { ch.x = o.x + o.w / 2; ch.y = o.y + 0.5; ch.pose = "sleepsit"; }
        ch.sleepBed = o.type === "bed";
      } else { ch.pose = "sleep"; ch.moodlet("outside", "Spał" + ch.g("em", "am") + " na dworze", -9, 360); }
      ch.sleeping = true; ch.path = [];
      t.dur = 99999; t.rate = o && o.type === "bed" ? 1 : o ? 0.6 : 0.5;
    },
    tick(ch, t, m) {
      const n = ch.needs;
      if (t.rate < 1) n.energy -= 0.22 * m * (1 - t.rate);           // gorszy sen poza łóżkiem
      const done = n.energy >= 97 || (!ch.isNight() && n.energy >= 88);
      t.zt = (t.zt || 0) + m;
      if (t.zt > 30) { t.zt = 0; ch.sim.fxAt(ch, "💤"); }
      if (done) { t.dur = 0; ch.finishTask(); }
    },
    end(ch) { ch.moodlet("rested", "Wyspan" + ch.g("y", "a"), 6, 240); },
  },
  tv: {
    begin(ch, t) { t.dur = rand(60, 150); t.obj.data.users++; t.counted = true; ch.pose = "stand"; },
    tick(ch, t, m) { ch.needs.fun = clamp(ch.needs.fun + 0.38 * m, 0, 100); ch.needs.social = clamp(ch.needs.social + 0.03 * nearCount(ch, 3) * m, 0, 100); },
  },
  piano: {
    begin(ch, t) { t.dur = rand(40, 110); t.nt = 0; },
    tick(ch, t, m) {
      ch.needs.fun = clamp(ch.needs.fun + 0.42 * m, 0, 100);
      t.nt += m;
      if (t.nt > 5) {
        t.nt = 0; ch.sim.fxAt(ch, pick(["🎵", "🎶", "♪"]));
        for (const o of ch.sim.chars) if (o !== ch && !o.sleeping && !o.dead && Math.hypot(o.x - ch.x, o.y - ch.y) < 7) { o.needs.fun = clamp(o.needs.fun + 1.5, 0, 100); o.moodlet("music", "Miła muzyka", 5, 90); }
      }
    },
    end(ch) { ch.moodlet("played", "Gra sprawiła radość", 5, 120); },
  },
  flowers: {
    begin(ch, t) { t.dur = rand(8, 15); ch.sim.fxAt(ch, "🌸"); },
    tick(ch, t, m) { ch.needs.fun = clamp(ch.needs.fun + 0.5 * m, 0, 100); },
    end(ch) { ch.moodlet("flowers", "Piękne kwiaty", 4, 120); },
  },
  fire: {
    begin(ch, t) { t.dur = rand(60, 160); ch.pose = "sit"; },
    tick(ch, t, m) { const k = nearCount(ch, 5); ch.needs.fun = clamp(ch.needs.fun + 0.18 * m, 0, 100); ch.needs.social = clamp(ch.needs.social + (0.06 + 0.05 * Math.min(k, 3)) * m, 0, 100); },
  },
  bench: {
    begin(ch, t) { t.dur = rand(30, 80); ch.pose = "sit"; },
    tick(ch, t, m) { ch.needs.energy = clamp(ch.needs.energy + 0.07 * m, 0, 100); ch.needs.social = clamp(ch.needs.social + (0.04 + 0.04 * Math.min(nearCount(ch, 4), 3)) * m, 0, 100); },
  },
  work: {
    begin(ch, t) { t.dur = rand(180, 330); t.earn = 0; },
    tick(ch, t, m) {
      const e = 0.14 * (1 + (ch.m("work") - 1) * 0.35) * m;
      ch.money += e; t.earn += e; ch.needs.fun = clamp(ch.needs.fun - 0.02 * m, 0, 100);
    },
    end(ch, t) {
      ch.moodlet("worked", t.earn > 30 ? "Dobrze zarobił" + ch.g("em", "am") : "Ciężka praca", t.earn > 30 ? 5 : -3, 180);
      ch.memo(`Pracował${ch.g("em", "am")} i zarobił${ch.g("em", "am")} ${Math.round(t.earn)} monet.`);
    },
  },
  fish: {
    begin(ch, t) { t.dur = rand(70, 140); ch.pose = "stand"; const w = ch.sim.world; for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (w.inb(ch.tx + d[0], ch.ty + d[1]) && w.terrain[w.idx(ch.tx + d[0], ch.ty + d[1])] === T.WATER) { ch.face = d[0] >= 0 ? 1 : -1; break; } },
    tick(ch, t, m) { ch.needs.fun = clamp(ch.needs.fun + 0.3 * m, 0, 100); },
    end(ch) {
      if (chance(0.4 * Math.min(2, ch.m("fish")))) { ch.needs.hunger = clamp(ch.needs.hunger + 30, 0, 100); ch.say("Mam rybę! 🐟"); ch.moodlet("fish", "Udany połów", 6, 180); ch.memo("Złowił" + ch.g("em", "am") + " rybę."); ch.sim.fxAt(ch, "🐟"); }
      else ch.say("Nic nie bierze…");
    },
  },
  wander: {
    begin(ch, t) { t.dur = rand(3, 20); },
    tick(ch, t, m) { ch.needs.fun = clamp(ch.needs.fun + 0.05 * m, 0, 100); },
  },
  shelter: {
    begin(ch, t) { t.dur = 240; ch.say("Ale leje!"); },
    tick(ch, t) { if (ch.sim.rain < 0.1 && t.t > 20) t.dur = 0; },
  },
  goto: { begin(ch, t) { t.dur = 12; } },
  panic: { begin(ch, t) { t.dur = 4; ch.say("AAA!"); } },
  party: {
    begin(ch, t) { const p = ch.sim.party; t.dur = p ? Math.max(5, p.until - ch.sim.min) : 5; ch.pose = "dance"; },
    tick(ch, t, m) {
      ch.needs.fun = clamp(ch.needs.fun + 0.4 * m, 0, 100); ch.needs.social = clamp(ch.needs.social + 0.3 * m, 0, 100);
      if (Math.random() < 0.01) ch.say(pick(["Ale impreza!", "Tańczmy!", "Woohoo! 🎉", "Najlepsza zabawa!"]));
      if (!ch.sim.party) t.dur = 0;
    },
    end(ch) { ch.moodlet("party", "Super impreza!", 10, 300); },
  },
  talk: {
    begin(ch, t) {
      const p = t.partner;
      if (!p || p.dead || p.sleeping) return false;
      t.dur = rand(24, 62); t.beat = 6; t.leader = true;
      p.abortTask(true);
      p.task = { type: "talk", partner: ch, phase: "do", t: 0, dur: t.dur, passive: true };
      p.path = []; p.walking = false; p.pose = "stand"; p.icon = "💬";
      ch.face = p.x >= ch.x ? 1 : -1; p.face = -ch.face;
    },
    tick(ch, t, m) {
      const p = t.partner;
      if (t.passive) { if (!p || p.dead || !p.task || p.task.partner !== ch) ch.finishTask(); return; }
      if (!p || p.dead || !p.task || p.task.partner !== ch) { ch.finishTask(); return; }
      t.beat += m;
      if (t.beat >= 8) {
        t.beat = 0;
        const sp = t.turn ? p : ch, li = t.turn ? ch : p;
        t.turn = !t.turn;
        sp.conversationBeat(li);
      }
      if (t.t >= t.dur - 1 && p.task) p.task.dur = 0;
    },
    end(ch, t) { if (!t.passive) { ch.nextThink = ch.sim.min + rand(2, 15); } },
  },
};
