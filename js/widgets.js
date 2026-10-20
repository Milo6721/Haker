/* top źródła ataków, strumień hex, ticker */
(function () {
  // ---------- ataki ----------
  const wrap = $("#attackers");
  const ALL = ["CN", "RU", "US", "BR", "IN", "IR", "KP", "VN", "DE", "NG", "TR", "UA", "ID", "PK", "EG", "RO", "NL", "KR"];
  const src = ALL.slice().sort(() => Math.random() - 0.5).slice(0, 12).map(cc => ({
    cc, n: randInt(2000, 30000), ip: randIp(), el: null,
  }));
  src.forEach(s => {
    const el = document.createElement("div");
    el.className = "att";
    el.innerHTML = `<span class="cc">${s.cc}</span><div class="meter"><i></i></div><span class="ip"></span><span class="n"></span>`;
    s.el = el;
  });
  function renderAtt() {
    const hot = (G.scenario && G.scenario.cc) || [];
    src.forEach(s => { s.n += randInt(0, 250) + (hot.includes(s.cc) ? randInt(150, 900) : 0); if (Math.random() < 0.15) s.ip = randIp(); });
    src.sort((a, b) => b.n - a.n);
    const top = src[0].n;
    src.slice(0, 7).forEach((s, i) => {
      s.el.classList.toggle("hot", i < 2);
      $(".meter i", s.el).style.width = (s.n / top * 100) + "%";
      $(".ip", s.el).textContent = s.ip;
      $(".n", s.el).textContent = s.n.toLocaleString("pl-PL");
      wrap.appendChild(s.el);   // appendChild przestawia istniejący węzeł → sortowanie
    });
    src.slice(7).forEach(s => { if (s.el.parentNode) s.el.remove(); });
  }
  renderAtt();
  setInterval(renderAtt, 1200);

  // ---------- hex ----------
  const hexEl = $("#hex");
  const rows = [];
  let addr = randInt(0x1000, 0xf000);
    function hexRow() {
    const bytes = Array.from({ length: 8 }, () => randInt(0, 255));
    const hot = Math.random() < 0.18 ? randInt(0, 7) : -1;
    const h = bytes.map((b, i) => (i === hot ? `<b>${hex(b)}</b>` : hex(b))).join(" ");
    const a = bytes.map((b, i) => {
      const ch = b > 32 && b < 127 ? String.fromCharCode(b) : ".";
      const e = ch === "<" ? "&lt;" : ch === "&" ? "&amp;" : ch;
      return i === hot ? `<u>${e}</u>` : e;
    }).join("");
    const out = `<span class="addr">${hex(addr, 8)}</span>  ${h}  |${a}|`;
    addr += 8;
    return out;
  }
  for (let i = 0; i < 14; i++) rows.push(hexRow());
  setInterval(() => {
    rows.push(hexRow());
    while (rows.length > 14) rows.shift();
    hexEl.innerHTML = rows.join("\n");
  }, 140);
  setInterval(() => { $("#hexKey").textContent = "KEY:" + hex(randInt(0, 0xffff), 4) + hex(randInt(0, 0xffff), 4); }, 700);

  // ---------- ticker (generowany na bieżąco) ----------
  const track = $("#ticker");
  const gen = [
    () => ["", `SKANOWANIE SIECI WEWNĘTRZNEJ — ${randInt(0, 3)} NIEZNANYCH URZĄDZEŃ`],
    () => ["i", `TUNEL VPN ZESTAWIONY: NODE-${randInt(1, 9)} ⇄ NODE-${randInt(1, 9)}`],
    () => ["w", `WZMOŻONY RUCH Z REGIONU ${pick(["APAC", "EMEA", "LATAM", "NA-EAST", "CIS"])} (+${randInt(12, 240)}%)`],
    () => ["", `KOPIA ZAPASOWA ZWERYFIKOWANA — INTEGRALNOŚĆ ${randInt(97, 100)}%`],
    () => ["c", `ALERT: BRUTE-FORCE NA PORCIE ${pick([22, 3389, 445, 5432])} — ZABLOKOWANO ${randIp()}`],
    () => ["w", `NIETYPOWA GODZINA LOGOWANIA: KONTO ${pick(["svc_backup", "admin", "j.nowak", "deploy"])}`],
    () => ["i", `ROTACJA KLUCZY ZAPLANOWANA ZA ${pad(randInt(0, 3))}:${pad(randInt(0, 59))}:00`],
    () => ["c", `BLOKADA ZAKRESU ${randInt(1, 223)}.${randInt(0, 255)}.x.x — LISTA TOR EXIT`],
    () => ["", `AKTUALIZACJA SYGNATUR: +${randInt(120, 4000)} NOWYCH REGUŁ`],
    () => ["i", `WYNIK OPERATORA: ${G.score.toLocaleString("pl-PL")} · FALA ${G.wave} · INTEGRALNOŚĆ ${Math.round(G.integrity)}%`],
  ];
  const queue = [];
  bus.on("scenario", s => queue.unshift(["w", `INTEL: ${s.name} — ${s.intro.toUpperCase()}`]));
  bus.on("serverDown", n => queue.unshift(["c", `SERWER ${n.name.toUpperCase()} OFFLINE — WYMAGANY RESTART`]));
  const items = [];
  let x = innerWidth;
  const spawnItem = () => {
    const [c, t] = queue.length ? queue.shift() : pick(gen)();
    const el = document.createElement("span");
    el.className = c; el.textContent = "▌" + t;
    track.appendChild(el);
    items.push({ el, w: el.offsetWidth + 60 });
  };
  const tickerStyle = track.style;
  tickerStyle.animation = "none"; tickerStyle.paddingLeft = "0"; tickerStyle.position = "absolute"; tickerStyle.left = "0";
  tickerStyle.willChange = "transform";
  for (let i = 0; i < 4; i++) spawnItem();
  loop(dt => {
    x -= 70 * dt;
    while (items.length && x + items[0].w < 0) { x += items[0].w; items[0].el.remove(); items.shift(); }
    let total = items.reduce((a, i) => a + i.w, 0);
    while (x + total < innerWidth + 400) { spawnItem(); total += items[items.length - 1].w; }
    tickerStyle.transform = `translateX(${x}px)`;
  });
})();
