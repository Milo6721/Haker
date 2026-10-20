/* wskaźniki kołowe + paski zasobów */
class Gauge {
  constructor(canvasId, label, opts = {}) {
    this.label = label;
    this.value = rand(20, 60);
    this.target = this.value;
    this.sub = opts.sub || (v => "");
    this.hot = opts.hot || 101;
    this.f = fitCanvas($(canvasId));
    this.t = 0;
    this.every = opts.every || 2600;
    const retarget = () => { this.target = clamp(this.target + rand(-35, 35), 6, 97); };
    setInterval(retarget, this.every);
    loop(dt => this.draw(dt));
  }

  draw(dt) {
    const { ctx, size } = this.f;
    const { w, h } = size;
    this.t += dt;
    this.value += (this.target - this.value) * Math.min(1, dt * 2.2);
    const v = this.value / 100;

    ctx.clearRect(0, 0, w, h);
    const r = Math.max(24, Math.min(w, h - 26) / 2 - 12);
    const cx = w / 2, cy = (h - 18) / 2 + 8;
    const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25;
    const hot = this.value >= this.hot;

    // tło toru
    ctx.lineCap = "round";
    ctx.lineWidth = 9;
    ctx.strokeStyle = "rgba(0,255,229,0.1)";
    ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1); ctx.stroke();

    // podziałka
    ctx.lineWidth = 1;
    for (let i = 0; i <= 40; i++) {
      const a = a0 + (a1 - a0) * (i / 40);
      const long = i % 5 === 0;
      const r1 = r + 9, r2 = r + (long ? 15 : 12);
      ctx.strokeStyle = i / 40 <= v ? "rgba(0,255,229,0.8)" : "rgba(0,255,229,0.2)";
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      ctx.stroke();
    }

    // łuk wartości – gradient turkus → zieleń (przy wysokim poziomie → czerwień)
    const grad = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
    if (hot) { grad.addColorStop(0, COLORS.yellow); grad.addColorStop(1, COLORS.red); }
    else { grad.addColorStop(0, COLORS.cyan); grad.addColorStop(1, COLORS.green); }
    ctx.save();
    ctx.shadowColor = hot ? COLORS.red : COLORS.green;
    ctx.shadowBlur = 14;
    ctx.strokeStyle = grad;
    ctx.lineWidth = 9;
    ctx.beginPath(); ctx.arc(cx, cy, r, a0, a0 + (a1 - a0) * v); ctx.stroke();
    ctx.restore();

    // wirujący wewnętrzny pierścień
    ctx.strokeStyle = "rgba(0,255,102,0.35)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 6]);
    ctx.lineDashOffset = -this.t * 12;
    ctx.beginPath(); ctx.arc(cx, cy, r - 12, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);

    // wartość
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.save();
    ctx.shadowColor = hot ? COLORS.red : COLORS.cyan;
    ctx.shadowBlur = 12;
    ctx.fillStyle = hot ? "#ff8da0" : COLORS.cyan;
    ctx.font = `${Math.round(r * 0.55)}px "Share Tech Mono","Courier New",monospace`;
    ctx.fillText(Math.round(this.value) + "%", cx, cy - 2);
    ctx.restore();
    ctx.fillStyle = "#4f8f86";
    ctx.font = `10px "Share Tech Mono","Courier New",monospace`;
    ctx.fillText(this.sub(this.value) || "", cx, cy + r * 0.38);

    ctx.fillStyle = hot ? COLORS.red : COLORS.green;
    ctx.font = `12px "Share Tech Mono","Courier New",monospace`;
    ctx.fillText(this.label, cx, h - 8);
  }
}

(function () {
  new Gauge("#gaugeCpu", "CPU LOAD", {
    every: 2400,
    sub: v => `${(1.2 + v / 25).toFixed(2)} GHz`,
  });
  const threat = new Gauge("#gaugeThreat", "THREAT LEVEL", {
    every: 3200, hot: 70,
    sub: v => (v < 30 ? "LOW" : v < 55 ? "GUARDED" : v < 70 ? "ELEVATED" : "SEVERE"),
  });
  // poziom zagrożenia steruje statusem w nagłówku
  setInterval(() => bus.emit("threatLevel", threat.value), 1000);

  // paski zasobów
  const defs = ["PAMIĘĆ RAM", "DYSK I/O", "SIEĆ", "ENTROPIA", "TEMP. RDZENIA"];
  const wrap = $("#bars");
  const bars = defs.map(name => {
    const el = document.createElement("div");
    el.className = "bar";
    el.innerHTML = `<div class="row"><span>${name}</span><span>0%</span></div><div class="track"><div class="fill"></div></div>`;
    wrap.appendChild(el);
    return { fill: $(".fill", el), val: el.querySelectorAll(".row span")[1], v: rand(20, 80) };
  });
  const update = () => bars.forEach(b => {
    b.v = clamp(b.v + rand(-30, 30), 5, 98);
    b.fill.style.width = b.v + "%";
    b.val.textContent = Math.round(b.v) + "%";
  });
  update();
  setInterval(update, 2200);
})();
