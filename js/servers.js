/* lista statusów serwerów – klikalna: kliknij offline, by zrestartować */
const Servers = (function () {
  const list = $("#servers");
  const pool = [
    ["core-fw", "Firewall"], ["auth-gw", "SSO Gateway"], ["db-prime", "PostgreSQL"], ["web-edge", "Nginx Edge"],
    ["vpn-hub", "WireGuard"], ["mail-relay", "SMTP"], ["ids-sensor", "Snort IDS"], ["vault", "Secrets"],
    ["dns-root", "Resolver"], ["k8s-ctrl", "Control Plane"], ["log-sink", "ELK Stack"], ["proxy-dmz", "Squid Proxy"],
    ["git-mirror", "Git Mirror"], ["cdn-node", "CDN Edge"], ["ldap-01", "Directory"],
  ];
  // za każdym razem inny zestaw 8 systemów
  const defs = pool.slice().sort(() => Math.random() - 0.5).slice(0, 8);

  const nodes = defs.map(([base, role]) => {
    const name = `${base}-${pad(randInt(1, 12))}`;
    const li = document.createElement("li");
    li.innerHTML = `<span class="led"></span><span class="name">${name}<small>${role} · ${randPrivateIp()}</small></span><span class="st"></span>`;
    list.appendChild(li);
    const n = { li, name, st: $(".st", li), on: true, boot: false, ms: randInt(2, 40) };
    li.addEventListener("click", () => api.restart(n));
    return n;
  });

  function render(n, flash) {
    n.li.classList.toggle("off", !n.on);
    n.li.classList.toggle("boot", n.boot);
    n.st.innerHTML = n.boot ? `REBOOT<small>…</small>`
      : n.on ? `ONLINE<small>${n.ms} ms</small>`
      : `OFFLINE<small>kliknij: restart</small>`;
    if (flash) { n.li.classList.remove("flash"); void n.li.offsetWidth; n.li.classList.add("flash"); }
    summary();
  }
  function summary() {
    const up = nodes.filter(x => x.on).length;
    $("#srvSummary").textContent = `${up}/${nodes.length} UP`;
    bus.emit("serversUp", { up, total: nodes.length });
  }

  const api = {
    nodes,
    up: () => nodes.filter(n => n.on).length,
    find: q => nodes.find(n => n.name === q || n.name.startsWith(q)),
    down(n, silent) {
      if (!n.on) return false;
      n.on = false; n.boot = false;
      render(n, true);
      if (!silent) bus.emit("serverDown", n);
      return true;
    },
    downRandom() {
      const up = nodes.filter(n => n.on);
      if (up.length <= 1) return null;
      const n = pick(up); api.down(n); return n;
    },
    restart(n, ms = 2600) {
      if (n.on || n.boot) return false;
      n.boot = true; render(n, true);
      setTimeout(() => { n.boot = false; n.on = true; n.ms = randInt(5, 60); render(n, true); bus.emit("serverUp", n); }, ms);
      return true;
    },
    restartAll() { return nodes.reduce((c, n) => c + (api.restart(n) ? 1 : 0), 0); },
  };
  nodes.forEach(n => render(n));

  setInterval(() => {
    nodes.forEach(n => { if (n.on) { n.ms = clamp(n.ms + randInt(-4, 5), 1, 120); n.st.innerHTML = `ONLINE<small>${n.ms} ms</small>`; } });
  }, 900);

  // rzadkie, samoistne awarie – reszta awarii to skutek włamań
  setInterval(() => {
    if (G.over || Math.random() > 0.12) return;
    api.downRandom();
  }, 3000);

  return api;
})();
