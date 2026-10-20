/* warstwa interaktywna: zagrożenia, punkty, zdolności, scenariusze */

const Sfx = (function () {
  let ctx = null, on = false;
  const btn = $("#sfxBtn");
  const beep = (f, d = 0.1, type = "square", vol = 0.05, slideTo) => {
    if (!on) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = f;
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + d);
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + d);
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + d);
    } catch (e) { /* audio niedostępne */ }
  };
  btn.addEventListener("click", () => {
    on = !on;
    btn.textContent = "DŹWIĘK: " + (on ? "ON" : "OFF");
    btn.classList.toggle("on", on);
    beep(660, 0.08);
  });
  return {
    block: () => { beep(880, 0.07, "square", 0.05); setTimeout(() => beep(1320, 0.09, "square", 0.05), 70); },
    hit: () => beep(440, 0.05, "triangle", 0.05),
    breach: () => beep(160, 0.5, "sawtooth", 0.09, 40),
    ability: () => beep(300, 0.25, "sine", 0.07, 900),
    alert: () => { beep(520, 0.12, "square", 0.04); setTimeout(() => beep(520, 0.12, "square", 0.04), 180); },
  };
})();

const Game = (function () {
  const TYPES = {
    ddos:   { name: "DDoS",        sev: 1, hp: 1, dur: [5.5, 8.5],   w: 3,   from: 1 },
    phish:  { name: "PHISHING",    sev: 1, hp: 1, dur: [9, 13],      w: 3,   from: 1 },
    brute:  { name: "BRUTE-FORCE", sev: 2, hp: 2, dur: [8, 11],      w: 3,   from: 1 },
    botnet: { name: "BOTNET",      sev: 3, hp: 3, dur: [10, 14],     w: 1.6, from: 2 },
    ransom: { name: "RANSOMWARE",  sev: 4, hp: 4, dur: [12, 16],     w: 1.1, from: 3 },
    zero:   { name: "ZERO-DAY",    sev: 5, hp: 2, dur: [4.8, 6.5],   w: 0.6, from: 4 },
  };

  const SCEN = [
    { id: "calm", name: "SPOKOJNA NOC", rate: 0.55, boost: 0.7, w: {}, src: null, cc: [],
      intro: "Niski poziom aktywności w sieci. Wykorzystaj czas na naprawy." },
    { id: "ddos", name: "KAMPANIA DDoS", rate: 1.25, boost: 1.9, w: { ddos: 6 }, cc: ["CN", "RU"],
      src: ["MOSCOW", "BEIJING", "NOVOSIBIRSK", "SHANGHAI", "KYIV"],
      intro: "Skoordynowana kampania DDoS ze wschodu – ruch rośnie lawinowo!" },
    { id: "ransom", name: "FALA RANSOMWARE", rate: 0.9, boost: 1.25, w: { ransom: 5, phish: 3 }, cc: ["NG", "BR"],
      src: ["LAGOS", "SAO PAULO", "BOGOTA", "LIMA", "NAIROBI"],
      intro: "Wykryto falę ransomware przenoszoną przez phishing." },
    { id: "zero", name: "ALERT ZERO-DAY", rate: 0.8, boost: 1.1, w: { zero: 7, brute: 1.5 }, cc: ["KP", "IR"],
      src: ["TEHRAN", "SEOUL", "DUBAI", "ISTANBUL"],
      intro: "Ujawniono lukę zero-day – szybkie, groźne exploity w drodze." },
    { id: "scan", name: "MASOWE SKANOWANIE", rate: 1.6, boost: 1.45, w: { brute: 5, botnet: 3, ddos: 2 }, cc: ["IN", "VN"],
      src: ["MUMBAI", "DELHI", "JAKARTA", "SINGAPORE", "TOKYO"],
      intro: "Botnet masowo skanuje porty – spodziewaj się gęstego ruchu." },
  ];

  const AB = {
    fw:    { key: 1, name: "FIREWALL",  cd: 25, run() {
      G.shieldUntil = Date.now() + 8000;
      Log.add("OK", "Firewall rule set LOCKDOWN-A active: threat velocity -70% for 8s"); } },
    purge: { key: 2, name: "PURGE",     cd: 45, run() {
      const list = MapAPI.threats.slice();
      list.forEach(t => MapAPI.hit(t, 99));
      Log.add("OK", `PURGE executed: ${list.length} hostile process(es) terminated`); } },
    auto:  { key: 3, name: "AUTO-DEF",  cd: 40, run() {
      G.autoUntil = Date.now() + 10000;
      Log.add("OK", "AI defence routine engaged for 10s"); } },
    patch: { key: 4, name: "NAPRAWA",   cd: 35, run() {
      G.integrity = Math.min(100, G.integrity + 25);
      const off = Servers.nodes.find(n => !n.on && !n.boot);
      if (off) Servers.restart(off, 800);
      Log.add("OK", `Emergency patch applied: HQ integrity +25%${off ? ", rebooting " + off.name : ""}`); } },
  };
  const ready = { fw: 0, purge: 0, auto: 0, patch: 0 };

  const $id = id => document.getElementById(id);
  const hud = {
    score: $id("hScore"), high: $id("hHigh"), wave: $id("hWave"), combo: $id("hCombo"),
    blocked: $id("hBlocked"), int: $id("hInt"), intFill: $id("hIntFill"), scen: $id("hScen"),
  };
  const abBtns = [...document.querySelectorAll(".ab")];
  let lastBlock = 0, lastAuto = 0, scenTimer = null;

  // ---------- zdarzenia gry ----------
  MapAPI.onBlock = t => {
    const now = Date.now();
    G.combo = now - lastBlock < 6000 ? G.combo + 1 : 1;
    lastBlock = now;
    const pts = Math.round(t.type.sev * 10 * (1 + G.combo * 0.15));
    G.score += pts; G.blocked++;
    G.integrity = Math.min(100, G.integrity + t.type.sev * 0.6);
    if (G.score > G.high) { G.high = G.score; try { localStorage.setItem("cyberops-high", G.high); } catch (e) { /* ok */ } }
    Log.add("OK", `Blocked ${t.type.name} from ${t.ip} (${t.city})  +${pts}${G.combo > 2 ? "  COMBO x" + G.combo : ""}`);
    Sfx.block();
    return pts;
  };

  MapAPI.onBreach = t => {
    if (G.over) return;
    const dmg = t.type.sev * 7;
    G.integrity = Math.max(0, G.integrity - dmg);
    G.combo = 0; G.breached++;
    Log.add("CRITICAL", `BREACH: ${t.type.name} from ${t.ip} reached HQ  (integrity -${dmg}%)`);
    if (Math.random() < 0.45 + t.type.sev * 0.08) {
      const n = Servers.downRandom();
      if (n) Log.add("CRITICAL", `${n.name} went OFFLINE – click it to reboot`);
    }
    shake();
    Sfx.breach();
    if (G.integrity <= 0) gameOver();
  };

  function shake() {
    document.body.classList.remove("shake"); void document.body.offsetWidth;
    document.body.classList.add("shake");
    const fl = $id("flash"); fl.classList.remove("on"); void fl.offsetWidth; fl.classList.add("on");
  }

  // ---------- generator zagrożeń ----------
  function pickType() {
    const sc = G.scenario;
    const entries = Object.entries(TYPES).filter(([, t]) => G.wave >= t.from)
      .map(([k, t]) => [k, t.w * ((sc && sc.w[k]) || 1)]);
    let r = Math.random() * entries.reduce((a, [, w]) => a + w, 0);
    for (const [k, w] of entries) { if ((r -= w) <= 0) return TYPES[k]; }
    return TYPES.ddos;
  }
  function spawnDelay() {
    const sc = G.scenario ? G.scenario.rate : 1;
    const base = clamp(4.2 - G.wave * 0.25, 1.1, 4.2);
    return (base / sc) * rand(0.7, 1.3) * 1000;
  }
  function spawnLoop() {
    if (!G.over && MapAPI.threats.length < 9) {
      const t = pickType();
      const src = G.scenario && G.scenario.src;
      const th = MapAPI.spawnThreat(t, src && Math.random() < 0.8 ? pick(src) : null);
      Log.add("WARN", `Incoming ${t.name} detected from ${th.ip} (${th.city}) – intercept on map!`);
      if (t.sev >= 4) Sfx.alert();
    }
    setTimeout(spawnLoop, spawnDelay());
  }

  // ---------- scenariusze ----------
  function setScenario(s) {
    G.scenario = s; G.boostT = s.boost;
    hud.scen.textContent = s.name;
    hud.scen.className = "scen " + s.id;
    Log.add("WARN", `INTEL // SCENARIO: ${s.name} – ${s.intro}`);
    if (s.id !== "calm") Sfx.alert();
    bus.emit("scenario", s);
  }
  function nextScenario() {
    let s; do { s = pick(SCEN); } while (s === G.scenario);
    setScenario(s);
    scenTimer = setTimeout(nextScenario, rand(40, 65) * 1000);
  }

  // ---------- zdolności ----------
  function use(id) {
    const a = AB[id];
    if (!a || G.over) return false;
    const now = Date.now();
    if (ready[id] > now) {
      Log.add("WARN", `${a.name} recharging: ${Math.ceil((ready[id] - now) / 1000)}s`);
      return false;
    }
    ready[id] = now + a.cd * 1000;
    a.run();
    Sfx.ability();
    return true;
  }
  abBtns.forEach(b => b.addEventListener("click", () => use(b.dataset.ab)));
  document.addEventListener("keydown", e => {
    if (e.target.tagName === "INPUT" || e.ctrlKey || e.metaKey || e.altKey) return;
    const id = Object.keys(AB).find(k => String(AB[k].key) === e.key);
    if (id) use(id);
    if (e.key === "/") { e.preventDefault(); $id("cmd").focus(); }
  });

  // ---------- koniec gry ----------
  function gameOver() {
    G.over = true;
    MapAPI.clear();
    Log.add("CRITICAL", "SYSTEM COMPROMISED – all defences down. Press RESTART.");
    $id("goScore").textContent = G.score.toLocaleString("pl-PL");
    $id("goStats").textContent = `FALA ${G.wave} · ZABLOKOWANO ${G.blocked} · WŁAMANIA ${G.breached}`;
    $id("gameover").classList.add("show");
  }
  function restart() {
    Object.assign(G, { integrity: 100, score: 0, wave: 1, combo: 0, blocked: 0, breached: 0, over: false, shieldUntil: 0, autoUntil: 0, lockUntil: 0 });
    Object.keys(ready).forEach(k => ready[k] = 0);
    Servers.restartAll();
    MapAPI.clear();
    $id("gameover").classList.remove("show");
    Log.add("OK", "System rebooted. Defence grid online. Good luck, operator.");
    waveClock = 0;
  }
  $id("restartBtn").addEventListener("click", restart);

  // ---------- lista zagrożeń ----------
  const listEl = $id("threatList");
  const rows = new Map();
  listEl.addEventListener("click", e => {
    const b = e.target.closest("[data-block]");
    if (!b) return;
    const t = MapAPI.threats.find(x => x.id === +b.dataset.block);
    if (t) MapAPI.hit(t, 1);
  });
  function renderList() {
    const ths = MapAPI.threats.slice().sort((a, b) => (b.t / b.dur) - (a.t / a.dur));
    const ids = new Set(ths.map(t => t.id));
    rows.forEach((el, id) => { if (!ids.has(id)) { el.remove(); rows.delete(id); } });
    $id("threatCount").textContent = ths.length + " AKTYWNYCH";
    if (!ths.length && !listEl.querySelector(".none")) {
      const n = document.createElement("div"); n.className = "none"; n.textContent = "— brak zagrożeń · sieć czysta —"; listEl.appendChild(n);
    } else if (ths.length) { const n = listEl.querySelector(".none"); if (n) n.remove(); }
    ths.forEach(t => {
      let el = rows.get(t.id);
      if (!el) {
        el = document.createElement("div");
        el.className = "th";
        el.innerHTML = `<div class="top"><b></b><span class="hp"></span><button data-block="${t.id}">BLOKUJ</button></div><div class="sub"></div><div class="eta"><i></i></div>`;
        rows.set(t.id, el);
      }
      listEl.appendChild(el);     // porządkuje wg pilności
      $("b", el).textContent = t.type.name;
      $(".hp", el).textContent = "■".repeat(Math.max(0, t.hp)) + "□".repeat(t.hp0 - Math.max(0, t.hp));
      $(".sub", el).textContent = `${t.ip} · ${t.city}`;
      const k = clamp(t.t / t.dur, 0, 1);
      const bar = $(".eta i", el);
      bar.style.width = (k * 100) + "%";
      el.classList.toggle("urgent", k > 0.7);
    });
  }

  // ---------- główny tick ----------
  let waveClock = 0;
  setInterval(() => {
    const now = Date.now();
    G.active = MapAPI.threats.length;
    G.boost += (G.boostT - G.boost) * 0.06;

    if (!G.over) {
      const ratio = Servers.up() / Servers.nodes.length;
      G.integrity = Math.min(100, G.integrity + 0.03 * ratio);

      waveClock += 0.1;
      if (waveClock >= 28) {
        waveClock = 0; G.wave++;
        G.score += G.wave * 25;
        Log.add("WARN", `=== WAVE ${G.wave} === threat intensity rising (+${G.wave * 25} pts bonus)`);
        Sfx.alert();
      }

      if (now < G.autoUntil && now - lastAuto > 900 && MapAPI.threats.length) {
        lastAuto = now;
        const t = MapAPI.threats.reduce((a, b) => (b.t / b.dur > a.t / a.dur ? b : a));
        MapAPI.hit(t, 1);
      }
    }

    const sev = MapAPI.threats.reduce((a, t) => a + t.type.sev, 0);
    G.threatLevel = clamp(8 + sev * 5 + G.active * 4 + (100 - G.integrity) * 0.45, 4, 99);
    G.cpu = clamp(22 + G.active * 6 + (now < G.autoUntil ? 18 : 0) + (now < G.shieldUntil ? 10 : 0) + rand(-4, 4), 5, 98);
    G.bpm = Math.round(clamp(62 + G.active * 5 + (100 - G.integrity) * 0.3 + rand(-2, 2), 55, 170));

    hud.score.textContent = G.score.toLocaleString("pl-PL");
    hud.high.textContent = G.high.toLocaleString("pl-PL");
    hud.wave.textContent = G.wave;
    hud.combo.textContent = G.combo > 1 ? "x" + (1 + G.combo * 0.15).toFixed(2) : "x1.00";
    hud.blocked.textContent = G.blocked;
    hud.int.textContent = Math.round(G.integrity) + "%";
    hud.intFill.style.width = G.integrity + "%";
    hud.intFill.parentNode.className = "track " + (G.integrity < 25 ? "crit" : G.integrity < 55 ? "warn" : "");

    abBtns.forEach(b => {
      const id = b.dataset.ab, left = Math.max(0, ready[id] - now);
      b.style.setProperty("--p", left / (AB[id].cd * 1000));
      b.classList.toggle("cd", left > 0);
      b.querySelector(".t").textContent = left > 0 ? Math.ceil(left / 1000) + "s" : "GOTOWE";
      const active = (id === "fw" && now < G.shieldUntil) || (id === "auto" && now < G.autoUntil);
      b.classList.toggle("active", active);
    });
    bus.emit("integrity", G.integrity);
  }, 100);
  setInterval(renderList, 200);

  // start
  setTimeout(() => setScenario(SCEN[0]), 100);
  scenTimer = setTimeout(nextScenario, 22000);
  setTimeout(spawnLoop, 3500);
  setTimeout(() => $id("hint").classList.add("fade"), 14000);

  return { TYPES, SCEN, AB, use, restart, setScenario, ready };
})();
