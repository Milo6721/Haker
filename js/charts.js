/* wykresy "oscyloskopowe" na canvas */
class Scope {
  constructor(canvasId, opts) {
    this.o = Object.assign({ color: COLORS.cyan, step: 4, speed: 70, fill: true, gen: null, fmt: v => v.toFixed(0), out: null }, opts);
    this.f = fitCanvas($(canvasId));
    this.buf = [];
    this.acc = 0;
    this.v = 0.5;
    this.tick = 0;
    this.outEl = this.o.out ? $(this.o.out) : null;
    for (let i = 0; i < 400; i++) this.push();
    setInterval(() => { if (this.outEl) this.outEl.textContent = this.o.fmt(this.buf[this.buf.length - 1]); }, 300);
    loop(dt => this.frame(dt));
  }

  push() {
    this.buf.push(this.o.gen(this));
    const need = Math.ceil(this.f.size.w / this.o.step) + 3;
    while (this.buf.length > Math.max(need, 60)) this.buf.shift();
  }

  frame(dt) {
    const { o } = this;
    this.acc += o.speed * dt;
    while (this.acc >= o.step) { this.acc -= o.step; this.push(); }
    this.draw();
  }

  draw() {
    const { ctx, size } = this.f;
    const { w, h } = size;
    const { color, step } = this.o;
    const top = 10, bot = h - 10, rng = bot - top;
    ctx.clearRect(0, 0, w, h);

    // siatka
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(0,255,229,0.09)";
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) { const y = Math.round(top + (rng * i) / 4) + 0.5; ctx.moveTo(0, y); ctx.lineTo(w, y); }
    const off = this.acc % 40;
    for (let x = off; x < w; x += 40) { ctx.moveTo(Math.round(x) + 0.5, 0); ctx.lineTo(Math.round(x) + 0.5, h); }
    ctx.stroke();

    const n = this.buf.length;
    const X = i => this.acc + (n - 1 - i) * step;   // najnowszy po lewej, ruch w prawo
    const Y = v => bot - clamp(v, 0, 1) * rng;

    // krzywa gładka (midpoint quadratic)
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(X(n - 1), Y(this.buf[n - 1]));
      for (let i = n - 2; i >= 0; i--) {
        const x = X(i), y = Y(this.buf[i]);
        const px = X(i + 1), py = Y(this.buf[i + 1]);
        ctx.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2);
      }
    };

    if (this.o.fill) {
      path();
      ctx.lineTo(X(0), bot); ctx.lineTo(X(n - 1), bot); ctx.closePath();
      const g = ctx.createLinearGradient(0, top, 0, bot);
      g.addColorStop(0, color + "55");
      g.addColorStop(1, color + "00");
      ctx.fillStyle = g;
      ctx.fill();
    }

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    path();
    ctx.stroke();
    ctx.restore();

    // głowica
    const hx = X(n - 1), hy = Y(this.buf[n - 1]);
    ctx.save();
    ctx.shadowColor = color; ctx.shadowBlur = 16;
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(hx, hy, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = color + "55";
    ctx.beginPath(); ctx.moveTo(hx + 0.5, 0); ctx.lineTo(hx + 0.5, h); ctx.stroke();

    // zanik na prawej krawędzi
    const fade = ctx.createLinearGradient(w - 50, 0, w, 0);
    fade.addColorStop(0, "rgba(2,10,10,0)");
    fade.addColorStop(1, "rgba(2,10,10,0.95)");
    ctx.fillStyle = fade;
    ctx.fillRect(w - 50, 0, 50, h);
  }
}

(function () {
  // ruch z losowym spacerem + rzadkie piki
  const traffic = (base, spikeP) => s => {
    s.v += (Math.random() - 0.5) * 0.14 + (0.45 - s.v) * 0.04;
    let v = s.v;
    if (Math.random() < spikeP) s.spike = rand(0.2, 0.45);
    if (s.spike) { v += s.spike; s.spike *= 0.72; if (s.spike < 0.02) s.spike = 0; }
    s.v = clamp(s.v, 0.08, 0.85);
    return clamp(v * base * G.boost + (Math.random() - 0.5) * 0.04, 0.02, 1);
  };

  new Scope("#chart1", {
    color: COLORS.cyan, speed: 75, out: "#ch1val",
    gen: traffic(1, 0.03), fmt: v => (v * 940).toFixed(0) + " Mb/s",
  });

  new Scope("#chart2", {
    color: COLORS.green, speed: 60, out: "#ch2val",
    gen: traffic(0.95, 0.02), fmt: v => (v * 620).toFixed(0) + " Mb/s",
  });

  // EKG – powtarzający się kompleks QRS
  const QRS = [0, .02, .05, .1, .14, .1, .05, 0, -.04, -.1, .5, 1, .2, -.25, -.08, 0, .03, .08, .16, .24, .28, .24, .16, .08, .02, 0];
  new Scope("#chart3", {
    color: COLORS.cyan2, speed: 90, step: 3, fill: false, out: "#ch3val",
    gen: s => {
      s.i = (s.i || 0) + 1;
      if (s.pos === undefined || s.pos >= QRS.length + (s.gap || 0)) {
        s.pos = 0;
        s.gap = randInt(14, 30);
        s.amp = rand(0.85, 1.1);
        s.rate = randInt(68, 96);
      }
      const p = s.pos++;
      const base = 0.32 + Math.sin(s.i * 0.07) * 0.015;
      const wave = p < QRS.length ? QRS[p] * s.amp * 0.62 : 0;
      s.bpm = s.rate;
      return clamp(base + wave + (Math.random() - 0.5) * 0.012, 0, 1);
    },
    fmt: () => G.bpm + " bpm",
  });
})();
