/* top źródła ataków, strumień hex, ticker */
(function () {
  // ---------- ataki ----------
  const wrap = $("#attackers");
  const src = ["CN", "RU", "US", "BR", "IN", "IR", "KP", "VN", "DE", "NG"].map(cc => ({
    cc, n: randInt(2000, 30000), ip: randIp(), el: null,
  }));
  src.forEach(s => {
    const el = document.createElement("div");
    el.className = "att";
    el.innerHTML = `<span class="cc">${s.cc}</span><div class="meter"><i></i></div><span class="ip"></span><span class="n"></span>`;
    s.el = el;
  });
  function renderAtt() {
    src.forEach(s => { s.n += randInt(0, 400); if (Math.random() < 0.15) s.ip = randIp(); });
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
    const bytes = Array.from({ length: 16 }, () => randInt(0, 255));
    const hot = Math.random() < 0.18 ? randInt(0, 15) : -1;
    const h = bytes.map((b, i) => (i === hot ? `<b>${hex(b)}</b>` : hex(b))).join(" ");
    const a = bytes.map((b, i) => {
      const ch = b > 32 && b < 127 ? String.fromCharCode(b) : ".";
      const e = ch === "<" ? "&lt;" : ch === "&" ? "&amp;" : ch;
      return i === hot ? `<u>${e}</u>` : e;
    }).join("");
    const out = `<span class="addr">${hex(addr, 8)}</span>  ${h}  |${a}|`;
    addr += 16;
    return out;
  }
  for (let i = 0; i < 14; i++) rows.push(hexRow());
  setInterval(() => {
    rows.push(hexRow());
    while (rows.length > 14) rows.shift();
    hexEl.innerHTML = rows.join("\n");
  }, 140);
  setInterval(() => { $("#hexKey").textContent = "KEY:" + hex(randInt(0, 0xffff), 4) + hex(randInt(0, 0xffff), 4); }, 700);

  // ---------- ticker ----------
  const msgs = [
    ["", "SYSTEM OBRONNY AKTYWNY — WSZYSTKIE MODUŁY W TRYBIE BOJOWYM"],
    ["i", "SKANOWANIE SIECI WEWNĘTRZNEJ — 0 NIEZNANYCH URZĄDZEŃ"],
    ["w", "WYKRYTO WZMOŻONY RUCH Z REGIONU APAC"],
    ["", "AKTUALIZACJA SYGNATUR ZAKOŃCZONA POMYŚLNIE"],
    ["c", "ALERT: PRÓBA BRUTE-FORCE NA PORCIE 22 — ZABLOKOWANO"],
    ["i", "TUNEL VPN ZESTAWIONY: NODE-7 ⇄ NODE-3"],
    ["w", "NIETYPOWA GODZINA LOGOWANIA: KONTO svc_backup"],
    ["", "KOPIA ZAPASOWA ZWERYFIKOWANA — INTEGRALNOŚĆ 100%"],
    ["c", "BLOKADA ADRESU 185.220.101.x — LISTA TOR EXIT"],
    ["i", "ROTACJA KLUCZY SZYFRUJĄCYCH ZAPLANOWANA ZA 00:14:00"],
  ];
  const track = $("#ticker");
  const mk = () => msgs.concat(msgs).map(([c, t]) => `<span class="${c}">▌${t}</span>`).join("");
  track.innerHTML = mk();
})();
