/* konsola poleceń operatora */
(function () {
  const form = $("#cli"), input = $("#cmd");
  const hist = [];
  let hi = 0;
  const out = (t, lvl = "SYS") => Log.add(lvl, t);
  const later = (fn, ms) => setTimeout(fn, ms);

  const findThreat = q => {
    q = String(q || "").toLowerCase();
    return MapAPI.threats.find(t => t.ip === q || String(t.id) === q.replace("#", ""))
      || MapAPI.threats.find(t => t.type.name.toLowerCase() === q);
  };

  const CMDS = {
    help() {
      out("Dostępne polecenia:");
      [
        "status              – stan systemu i punktacja",
        "scan                – lista aktywnych zagrożeń",
        "block <ip|id|typ>   – zablokuj zagrożenie (np. block ddos)",
        "block all           – zablokuj wszystkie (= purge)",
        "firewall | purge | auto | patch   – zdolności (klawisze 1-4)",
        "lockdown            – spowalnia zagrożenia o 50% na 15 s (cd 60 s)",
        "servers             – lista systemów",
        "restart <nazwa|all> – restart serwera",
        "ping <host> · trace <ip> · nmap <ip>   – narzędzia sieciowe",
        "intel               – bieżący scenariusz",
        "clear · whoami · history",
      ].forEach(l => out("  " + l));
    },
    status() {
      out(`Integralność HQ: ${Math.round(G.integrity)}%  · Fala: ${G.wave}  · Wynik: ${G.score}  · Rekord: ${G.high}`);
      out(`Zablokowano: ${G.blocked}  · Włamania: ${G.breached}  · Aktywne zagrożenia: ${MapAPI.threats.length}  · Serwery: ${Servers.up()}/${Servers.nodes.length}`);
    },
    scan() {
      if (!MapAPI.threats.length) return out("Skan zakończony: brak aktywnych zagrożeń.", "OK");
      out(`Skan: ${MapAPI.threats.length} aktywnych zagrożeń`, "SCAN");
      MapAPI.threats.forEach(t => out(`  #${t.id}  ${t.type.name.padEnd(12)} ${t.ip.padEnd(16)} ${t.city.padEnd(14)} hp ${t.hp}/${t.hp0}  ETA ${Math.max(0, t.dur - t.t).toFixed(1)}s`, "SCAN"));
    },
    block(a) {
      if (G.over) return out("System niedostępny.", "WARN");
      if (a === "all") return Game.use("purge");
      if (!a) return out("Użycie: block <ip|id|typ|all>", "WARN");
      const t = findThreat(a);
      if (!t) return out(`Nie znaleziono zagrożenia '${a}'. Użyj 'scan'.`, "WARN");
      later(() => MapAPI.hit(t, 99), 300);
      out(`Wstrzykiwanie reguły DROP dla ${t.ip}...`, "SCAN");
    },
    firewall() { Game.use("fw"); },
    purge() { Game.use("purge"); },
    auto() { Game.use("auto"); },
    patch() { Game.use("patch"); },
    lockdown() {
      const now = Date.now();
      if (CMDS._lockReady && CMDS._lockReady > now) return out(`lockdown recharging: ${Math.ceil((CMDS._lockReady - now) / 1000)}s`, "WARN");
      CMDS._lockReady = now + 60000;
      G.lockUntil = now + 15000;
      out("LOCKDOWN: ruch zewnętrzny dławiony przez 15 s.", "OK");
    },
    servers() {
      Servers.nodes.forEach(n => out(`  ${n.name.padEnd(14)} ${n.boot ? "REBOOT" : n.on ? "ONLINE " + n.ms + "ms" : "OFFLINE"}`, n.on ? "OK" : "WARN"));
    },
    restart(a) {
      if (!a) return out("Użycie: restart <nazwa|all>", "WARN");
      if (a === "all") { const c = Servers.restartAll(); return out(`Restart ${c} serwer(ów)...`, c ? "OK" : "INFO"); }
      const n = Servers.find(a);
      if (!n) return out(`Brak serwera '${a}'.`, "WARN");
      if (n.on) return out(`${n.name} już działa.`, "INFO");
      Servers.restart(n);
      out(`Restart ${n.name}...`, "OK");
    },
    intel() {
      const s = G.scenario;
      out(s ? `${s.name}: ${s.intro}` : "Brak danych.", "INFO");
    },
    ping(h) {
      if (!h) return out("Użycie: ping <host>", "WARN");
      for (let i = 0; i < 4; i++) later(() => out(`64 bytes from ${h}: icmp_seq=${i + 1} ttl=${randInt(48, 64)} time=${(rand(4, 90)).toFixed(1)} ms`), i * 350);
    },
    trace(ip) {
      ip = ip || randIp();
      out(`traceroute to ${ip}, 30 hops max`);
      for (let i = 1; i <= 7; i++) later(() => out(` ${i}  ${randIp()}  ${rand(1, 40 + i * 20).toFixed(2)} ms`), i * 300);
      later(() => out(`Trace complete – origin geolocated: ${pick(MapAPI.cities)[0]}`, "OK"), 2500);
    },
    nmap(ip) {
      ip = ip || randIp();
      out(`Starting nmap on ${ip}...`, "SCAN");
      const ports = [[22, "ssh"], [80, "http"], [443, "https"], [3306, "mysql"], [8080, "http-proxy"], [445, "smb"]];
      ports.filter(() => Math.random() < 0.6).forEach(([p, n], i) =>
        later(() => out(`  ${p}/tcp  ${Math.random() < 0.8 ? "open  " : "filtered"}  ${n}`, "SCAN"), 350 * (i + 1)));
      later(() => out("Nmap done: 1 IP address scanned.", "OK"), 2500);
    },
    whoami() { out("root @ node-7  (operator, clearance LEVEL-5)"); },
    clear() { Log.clear(); },
    history() { hist.forEach((h, i) => out(`  ${i + 1}  ${h}`)); },
    hack() { out("Nice try. Przecież to TY bronisz systemu.", "WARN"); },
    sudo() { out("operator is not in the sudoers file. This incident will be reported.", "WARN"); },
    exit() { out("Nie ma ucieczki z centrum dowodzenia.", "WARN"); },
  };

  form.addEventListener("submit", e => {
    e.preventDefault();
    const line = input.value.trim();
    input.value = "";
    if (!line) return;
    hist.push(line); hi = hist.length;
    Log.add("CMD", "$ " + line);
    const [c, ...args] = line.split(/\s+/);
    const fn = CMDS[c.toLowerCase()];
    if (fn && !c.startsWith("_")) fn(...args);
    else out(`${c}: command not found. Wpisz 'help'.`, "WARN");
  });

  input.addEventListener("keydown", e => {
    if (e.key === "ArrowUp") { hi = Math.max(0, hi - 1); input.value = hist[hi] || ""; e.preventDefault(); }
    else if (e.key === "ArrowDown") { hi = Math.min(hist.length, hi + 1); input.value = hist[hi] || ""; e.preventDefault(); }
    else if (e.key === "Tab") {
      e.preventDefault();
      const m = Object.keys(CMDS).filter(k => !k.startsWith("_") && k.startsWith(input.value.toLowerCase()));
      if (m.length === 1) input.value = m[0] + " ";
    } else if (e.key === "Escape") input.blur();
  });

  Log.add("INFO", "Konsola gotowa. Wpisz 'help' · klawisz / ustawia fokus · 1-4 zdolności · klikaj czerwone cele na mapie.");
})();
