/* tło: siatka + ścieżki "płytki drukowanej" */
(function () {
  const canvas = $("#bg");
  const f = fitCanvas(canvas, draw);

  function draw(size, ctx) {
    const { w, h } = size;
    ctx.clearRect(0, 0, w, h);

    // cienka siatka
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(0,255,229,0.045)";
    ctx.beginPath();
    for (let x = 0; x < w; x += 40) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); }
    for (let y = 0; y < h; y += 40) { ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); }
    ctx.stroke();

    // deterministyczny generator, żeby układ nie skakał przy resize
    let seed = 1337;
    const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

    const traces = Math.floor((w * h) / 18000);
    for (let i = 0; i < traces; i++) {
      const col = r() > 0.5 ? "0,255,229" : "0,255,102";
      let x = Math.floor(r() * (w / 20)) * 20;
      let y = Math.floor(r() * (h / 20)) * 20;
      ctx.strokeStyle = `rgba(${col},${0.07 + r() * 0.07})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      const segs = 2 + Math.floor(r() * 4);
      let dir = r() > 0.5 ? 0 : 1;
      for (let s = 0; s < segs; s++) {
        const len = (1 + Math.floor(r() * 6)) * 20;
        const sign = r() > 0.5 ? 1 : -1;
        if (dir === 0) x += len * sign; else y += len * sign;
        ctx.lineTo(x, y);
        // czasem skos 45°
        if (r() > 0.7) { x += 20 * sign; y += 20 * sign; ctx.lineTo(x, y); }
        dir ^= 1;
      }
      ctx.stroke();
      // pad na końcu ścieżki
      ctx.fillStyle = `rgba(${col},0.22)`;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(${col},0.25)`;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    // kilka "chipów"
    for (let i = 0; i < Math.floor(w / 260); i++) {
      const x = Math.floor(r() * (w / 20)) * 20, y = Math.floor(r() * (h / 20)) * 20;
      ctx.strokeStyle = "rgba(0,255,229,0.12)";
      ctx.strokeRect(x, y, 60, 40);
      for (let p = 0; p < 5; p++) {
        ctx.beginPath();
        ctx.moveTo(x + 6 + p * 12, y); ctx.lineTo(x + 6 + p * 12, y - 8);
        ctx.moveTo(x + 6 + p * 12, y + 40); ctx.lineTo(x + 6 + p * 12, y + 48);
        ctx.stroke();
      }
    }
  }
})();
