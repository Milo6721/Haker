/* zegar, uptime, status nagłówka, sekwencja startowa */
(function () {
  const clock = $("#clock"), uptime = $("#uptime"), session = $("#session");
  const start = Date.now();
  session.textContent = "0x" + hex(randInt(0, 0xffff), 4);

  setInterval(() => {
    const d = new Date();
    clock.textContent = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
    const s = Math.floor((Date.now() - start) / 1000) + 86400 * 3 + 7 * 3600;
    const dd = Math.floor(s / 86400);
    uptime.textContent = `${dd}d ${pad(Math.floor(s / 3600) % 24)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
  }, 250);

  // status pigułki zależy od poziomu zagrożenia i liczby padniętych serwerów
  const pill = $("#statusPill"), text = $("#statusText");
  let level = 40, down = 0, critUntil = 0, integ = 100;
  const refresh = () => {
    pill.classList.remove("warn", "crit");
    if (G.over || integ < 30 || Date.now() < critUntil || level >= 75 || down >= 3) { pill.classList.add("crit"); text.textContent = "ALERT — ZAGROŻENIE KRYTYCZNE"; }
    else if (integ < 65 || level >= 55 || down >= 1) { pill.classList.add("warn"); text.textContent = "PODWYŻSZONA CZUJNOŚĆ"; }
    else text.textContent = "SYSTEM SECURE";
  };
  bus.on("threatLevel", v => { level = v; refresh(); });
  bus.on("integrity", v => { integ = v; refresh(); });
  bus.on("serversUp", s => { down = s.total - s.up; refresh(); });
  

  // sekwencja bootowania
  const lines = [
    "CYBER//OPS BIOS v7.31  [OK]",
    "Inicjalizacja jądra ................ [OK]",
    "Ładowanie modułów IDS/IPS .......... [OK]",
    "Uzgadnianie kluczy TLS ............. [OK]",
    "Synchronizacja mapy zagrożeń ....... [OK]",
    "Łączenie z siecią sensorów ......... [OK]",
    "",
    "> DOSTĘP PRZYZNANY. WITAJ, OPERATORZE.",
  ];
  const pre = $("#bootText"), boot = $("#boot");
  let i = 0;
  const step = () => {
    if (i < lines.length) { pre.textContent += lines[i++] + "\n"; setTimeout(step, 150); }
    else setTimeout(() => { boot.classList.add("done"); setTimeout(() => boot.remove(), 900); }, 450);
  };
  step();
  boot.addEventListener("click", () => boot.classList.add("done"));
})();
