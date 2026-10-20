/* przewijający się log terminala */
const Log = (function () {
  const box = $("#log");
  const MAX = 60;
  const ports = [22, 53, 80, 443, 445, 3306, 3389, 5432, 8080, 8443, 9200, 27017];
  const users = ["root", "admin", "svc_backup", "deploy", "j.kowalski", "guest", "oracle"];
  const procs = ["sshd", "nginx", "kernel", "iptables", "snort", "fail2ban", "auditd"];

  const T = [
    ["OK",       () => `Firewall rule #${randInt(100, 999)} updated`],
    ["OK",       () => `Signature database synced (v${randInt(4, 9)}.${randInt(0, 99)}.${randInt(0, 999)})`],
    ["OK",       () => `Backup snapshot ${hex(randInt(0, 65535), 4)} verified`],
    ["OK",       () => `Certificate renewed for node-${randInt(1, 12)}.internal`],
    ["INFO",     () => `${pick(procs)}[${randInt(300, 9999)}]: session opened for user ${pick(users)}`],
    ["INFO",     () => `Route table refreshed, ${randInt(120, 900)} entries`],
    ["SCAN",     () => `Port ${pick(ports)} checked on ${randPrivateIp()}`],
    ["SCAN",     () => `Sweep ${randPrivateIp()}/24 — ${randInt(3, 64)} hosts alive`],
    ["SCAN",     () => `Deep packet inspection: ${randInt(1000, 99999)} pkts clean`],
    ["WARN",     () => `Suspicious connection from ${randIp()}`],
    ["WARN",     () => `Failed login x${randInt(3, 40)} for ${pick(users)} from ${randIp()}`],
    ["WARN",     () => `Port scan detected from ${randIp()} (${randInt(20, 900)} ports)`],
    ["WARN",     () => `Anomalous outbound traffic on eth${randInt(0, 3)}: ${randInt(120, 900)} Mb/s`],
    ["CRITICAL", () => `Intrusion attempt blocked: ${randIp()} → ${pick(ports)}/tcp`],
    ["CRITICAL", () => `Malware signature ${hex(randInt(0, 0xffffff), 6)} quarantined`],
    ["CRITICAL", () => `DDoS burst ${randInt(40, 400)}k req/s mitigated`],
  ];
  // wagi: częściej OK/SCAN niż CRITICAL
  const weight = { OK: 3, INFO: 2, SCAN: 4, WARN: 2.2, CRITICAL: 0.7 };
  const pool = [];
  T.forEach(t => { for (let i = 0; i < Math.round(weight[t[0]] * 3); i++) pool.push(t); });

  function add(level, text) {
    const d = new Date();
    const ts = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.${pad(d.getUTCMilliseconds(), 3)}`;
    const line = document.createElement("div");
    line.className = "line " + level;
    line.innerHTML = `<span class="ts">${ts}</span> <span class="lvl ${level}">[${level}]</span> <span class="msg"></span>`;
    $(".msg", line).textContent = text;
    box.appendChild(line);
    while (box.children.length > MAX) box.removeChild(box.firstChild);
  }

  for (let i = 0; i < 12; i++) { const t = pick(pool); add(t[0], t[1]()); }

  (function next() {
    const t = pick(pool);
    add(t[0], t[1]());
    if (t[0] === "CRITICAL") bus.emit("critical");
    setTimeout(next, rand(150, 800));
  })();

  return { add, clear() { box.innerHTML = ""; } };
})();
