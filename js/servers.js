/* lista statusów serwerów */
(function () {
  const list = $("#servers");
  const defs = [
    ["core-fw-01", "Firewall"], ["auth-gw", "SSO Gateway"], ["db-prime", "PostgreSQL"], ["web-edge-03", "Nginx Edge"],
    ["vpn-hub", "WireGuard"], ["mail-relay", "SMTP"], ["ids-sensor-7", "Snort IDS"], ["vault-02", "Secrets"],
  ];
  const nodes = defs.map(([name, role]) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="led"></span><span class="name">${name}<small>${role} · ${randPrivateIp()}</small></span><span class="st"></span>`;
    list.appendChild(li);
    return { li, st: $(".st", li), on: true, ms: randInt(2, 40), back: 0 };
  });

  function render(n, flash) {
    n.li.classList.toggle("off", !n.on);
    n.st.innerHTML = n.on ? `ONLINE<small>${n.ms} ms</small>` : `OFFLINE<small>— ms</small>`;
    if (flash) { n.li.classList.remove("flash"); void n.li.offsetWidth; n.li.classList.add("flash"); }
    const up = nodes.filter(x => x.on).length;
    $("#srvSummary").textContent = `${up}/${nodes.length} UP`;
    bus.emit("serversUp", { up, total: nodes.length });
  }
  nodes.forEach(n => render(n));

  setInterval(() => {
    nodes.forEach(n => { if (n.on) { n.ms = clamp(n.ms + randInt(-4, 5), 1, 120); n.st.firstChild.nodeValue = "ONLINE"; $("small", n.st).textContent = n.ms + " ms"; } });
  }, 900);

  // losowe przełączanie (rzadziej padają niż wracają)
  setInterval(() => {
    const n = pick(nodes);
    const down = nodes.filter(x => !x.on).length;
    if (n.on && down < 3 && Math.random() < 0.35) {
      n.on = false;
      render(n, true);
    } else if (!n.on) {
      n.on = true; n.ms = randInt(5, 60);
      render(n, true);
    }
  }, 1300);
})();
