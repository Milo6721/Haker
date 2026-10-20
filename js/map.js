/* mapa świata (kropkowa) z pulsami i łukami ataków */
(function () {
  const canvas = $("#map");
  const evLabel = $("#mapEvents");

  const LAT_MAX = 84, LAT_MIN = -58, SPAN_LON = 360, SPAN_LAT = LAT_MAX - LAT_MIN;

  // uproszczone zarysy kontynentów [lon, lat]
  const LAND = [
    // Ameryka Północna
    [[-168,66],[-162,70],[-141,70],[-125,70],[-110,72],[-95,72],[-82,68],[-78,62],[-92,57],[-82,52],[-78,57],[-68,60],[-62,58],[-56,52],[-60,47],[-66,45],[-70,42],[-74,40],[-76,35],[-81,31],[-80,26],[-82,26],[-84,30],[-90,29],[-94,29],[-97,26],[-97,21],[-95,18],[-91,18],[-87,21],[-88,16],[-84,15],[-83,10],[-79,9],[-78,8],[-80,7],[-85,10],[-88,13],[-92,14],[-96,16],[-105,20],[-106,23],[-112,29],[-110,23],[-115,30],[-118,33],[-121,35],[-124,40],[-124,48],[-130,54],[-135,58],[-148,60],[-153,58],[-158,57],[-165,60],[-166,64]],
    // Wyspy kanadyjskie
    [[-120,72],[-110,76],[-95,80],[-80,83],[-62,82],[-70,77],[-80,73],[-95,74],[-105,70]],
    [[-85,70],[-75,72],[-62,67],[-68,63],[-78,64]],
    // Grenlandia
    [[-55,60],[-44,60],[-40,66],[-22,70],[-18,77],[-20,82],[-40,83],[-62,82],[-72,78],[-58,75],[-55,68]],
    // Ameryka Południowa
    [[-78,8],[-72,12],[-62,10],[-52,5],[-50,0],[-44,-2],[-35,-5],[-37,-12],[-39,-18],[-41,-22],[-48,-26],[-53,-33],[-58,-35],[-57,-39],[-65,-41],[-66,-47],[-69,-52],[-72,-54],[-75,-50],[-74,-42],[-72,-30],[-70,-18],[-76,-14],[-81,-5],[-80,0],[-77,4]],
    // Eurazja
    [[-10,36],[-9,43],[-2,44],[-4,48],[2,51],[8,54],[10,57],[8,57],[10,59],[5,62],[12,66],[15,69],[25,71],[31,70],[40,67],[44,68],[60,69],[69,73],[80,73],[90,76],[105,78],[113,74],[130,72],[142,72],[160,70],[170,70],[180,69],[180,65],[170,60],[163,58],[156,51],[156,57],[143,59],[137,54],[141,49],[140,46],[135,43],[130,42],[129,37],[126,35],[126,38],[122,40],[118,38],[122,36],[122,31],[120,26],[116,22],[110,20],[108,15],[109,11],[105,9],[100,13],[101,6],[104,1],[99,8],[98,16],[94,19],[92,22],[88,22],[85,20],[80,15],[78,8],[73,16],[72,21],[67,25],[62,25],[57,26],[56,27],[50,30],[48,29],[51,25],[56,24],[59,22],[55,17],[52,16],[43,13],[39,21],[35,28],[34,31],[36,36],[30,36],[27,37],[26,40],[29,41],[34,42],[41,41],[40,44],[37,46],[33,45],[30,46],[28,42],[24,40],[23,36],[21,38],[19,42],[16,38],[18,40],[16,42],[13,44],[12,42],[9,44],[3,43],[-1,37],[-6,36]],
    // Afryka
    [[-17,21],[-13,28],[-10,30],[-6,36],[10,37],[11,33],[20,31],[25,32],[32,31],[34,28],[38,20],[43,12],[51,12],[48,5],[41,-2],[39,-8],[40,-15],[35,-24],[32,-29],[27,-34],[20,-35],[18,-32],[14,-23],[12,-17],[13,-6],[9,4],[5,6],[-4,5],[-8,4],[-13,9],[-17,14]],
    // Australia
    [[114,-22],[122,-18],[129,-15],[131,-12],[137,-12],[137,-16],[142,-11],[146,-19],[150,-23],[153,-26],[151,-34],[150,-37],[141,-38],[138,-35],[135,-34],[130,-31],[124,-33],[115,-34],[113,-26]],
    // Wielka Brytania, Irlandia
    [[-5,50],[1,51],[2,53],[-2,57],[-3,58.5],[-6,58],[-5,55],[-3,54],[-4,52]],
    [[-10,52],[-6,52],[-6,55],[-9,54.5]],
    // Islandia
    [[-24,64],[-18,63.5],[-14,65],[-18,66],[-22,66]],
    // Japonia
    [[130,31],[132,34],[136,34],[140,35],[142,39],[142,42],[145,43],[141,45],[140,40],[137,37],[133,36],[130,34]],
    // Sumatra, Borneo, Jawa, Sulawesi, Nowa Gwinea
    [[95,5],[98,4],[104,-1],[106,-6],[102,-4],[98,0]],
    [[109,1],[111,2],[117,7],[119,5],[118,1],[116,-4],[111,-3]],
    [[106,-6],[114,-7],[114,-8.5],[106,-7.5]],
    [[119,0],[125,1],[122,-3],[120,-5]],
    [[131,-1],[141,-3],[148,-7],[141,-9],[135,-4]],
    // Filipiny
    [[120,18],[122,18],[124,12],[126,7],[122,8],[121,14]],
    // Madagaskar
    [[44,-25],[47,-25],[50,-15],[49,-12],[44,-17]],
    // Nowa Zelandia
    [[172,-34],[178,-38],[175,-41],[173,-41]],
    [[172,-41],[174,-42],[170,-46],[167,-46]],
    // Kuba, Sri Lanka, Tajwan
    [[-85,22],[-80,23],[-74,20],[-78,20]],
    [[80,9],[82,7],[81,6],[80,6]],
    [[120,22],[122,25],[121,25.5],[120,23]],
    // Spitsbergen, Nowa Ziemia
    [[11,78],[20,80],[27,79],[18,77]],
    [[52,71],[58,76],[68,77],[60,73]],
  ];

  // miasta / węzły [nazwa, lon, lat]
  const CITIES = [
    ["NEW YORK", -74, 40.7], ["SAN FRANCISCO", -122.4, 37.8], ["TORONTO", -79.4, 43.7], ["MEXICO CITY", -99, 19.4],
    ["BOGOTA", -74, 4.7], ["SAO PAULO", -46.6, -23.5], ["BUENOS AIRES", -58.4, -34.6], ["LIMA", -77, -12],
    ["LONDON", -0.1, 51.5], ["PARIS", 2.3, 48.9], ["BERLIN", 13.4, 52.5], ["WARSAW", 21, 52.2], ["MADRID", -3.7, 40.4],
    ["MOSCOW", 37.6, 55.8], ["ISTANBUL", 29, 41], ["KYIV", 30.5, 50.4], ["CAIRO", 31.2, 30], ["LAGOS", 3.4, 6.5],
    ["NAIROBI", 36.8, -1.3], ["JOHANNESBURG", 28, -26.2], ["DUBAI", 55.3, 25.2], ["TEHRAN", 51.4, 35.7],
    ["MUMBAI", 72.9, 19.1], ["DELHI", 77.2, 28.6], ["SINGAPORE", 103.8, 1.4], ["BEIJING", 116.4, 39.9],
    ["SHANGHAI", 121.5, 31.2], ["SEOUL", 127, 37.6], ["TOKYO", 139.7, 35.7], ["SYDNEY", 151.2, -33.9],
    ["JAKARTA", 106.8, -6.2], ["NOVOSIBIRSK", 82.9, 55], ["REYKJAVIK", -21.9, 64.1], ["ANCHORAGE", -149.9, 61.2],
  ];
  const HQ = CITIES.find(c => c[0] === "WARSAW");

  let layer = null;       // wyrenderowana warstwa kropek
  let view = { sx: 1, sy: 1, ox: 0, oy: 0 };
  const pulses = [];      // pierścienie
  const arcs = [];        // łuki ataków
  const labels = [];      // krótkie etykiety
  let eventCount = 0;
  let hqPhase = 0;

  const f = fitCanvas(canvas, build);

  function proj(lon, lat) {
    return [view.ox + (lon + 180) * view.sx, view.oy + (LAT_MAX - lat) * view.sy];
  }

  function build(size) {
    const { w, h, dpr } = size;
    // mapa wypełnia cały panel (lekko rozciągnięta, jak w centrach dowodzenia)
    view.sx = (w - 16) / SPAN_LON;
    view.sy = (h - 34) / SPAN_LAT;
    view.ox = 8;
    view.oy = 10;

    // maska lądu: 4 px na stopień
    const K = 4;
    const mask = document.createElement("canvas");
    mask.width = SPAN_LON * K;
    mask.height = SPAN_LAT * K;
    const mctx = mask.getContext("2d");
    mctx.fillStyle = "#fff";
    LAND.forEach(poly => {
      mctx.beginPath();
      poly.forEach(([lon, lat], i) => {
        const x = (lon + 180) * K, y = (LAT_MAX - lat) * K;
        i ? mctx.lineTo(x, y) : mctx.moveTo(x, y);
      });
      mctx.closePath();
      mctx.fill();
    });
    const data = mctx.getImageData(0, 0, mask.width, mask.height).data;

    layer = document.createElement("canvas");
    layer.width = Math.round(w * dpr);
    layer.height = Math.round(h * dpr);
    const l = layer.getContext("2d");
    l.setTransform(dpr, 0, 0, dpr, 0, 0);

    // południki / równoleżniki
    l.strokeStyle = "rgba(0,255,229,0.07)";
    l.lineWidth = 1;
    l.beginPath();
    for (let lon = -180; lon <= 180; lon += 30) {
      const [x, y1] = proj(lon, LAT_MAX), [, y2] = proj(lon, LAT_MIN);
      l.moveTo(x, y1); l.lineTo(x, y2);
    }
    for (let lat = LAT_MIN + 4; lat <= LAT_MAX; lat += 30) {
      const [x1, y] = proj(-180, lat), [x2] = proj(180, lat);
      l.moveTo(x1, y); l.lineTo(x2, y);
    }
    l.stroke();

    // kropki lądu
    const stepPx = clamp(w / 150, 4.5, 8);
    const stepLon = stepPx / view.sx, stepLat = stepPx / view.sy;
    l.shadowColor = COLORS.cyan;
    l.shadowBlur = 4;
    for (let lat = LAT_MAX; lat > LAT_MIN; lat -= stepLat) {
      for (let lon = -180; lon < 180; lon += stepLon) {
        const mx = Math.floor((lon + 180) * K), my = Math.floor((LAT_MAX - lat) * K);
        if (data[(my * mask.width + mx) * 4 + 3] > 128) {
          const [x, y] = proj(lon, lat);
          const green = ((Math.floor(lon / stepLon) + Math.floor(lat / stepLat)) % 11) === 0;
          l.fillStyle = green ? "rgba(0,255,102,0.7)" : "rgba(0,255,229,0.5)";
          l.beginPath();
          l.arc(x, y, stepPx * 0.2, 0, Math.PI * 2);
          l.fill();
        }
      }
    }
  }

  function spawn() {
    const city = pick(CITIES);
    const [x, y] = proj(city[1] + rand(-2, 2), city[2] + rand(-1.5, 1.5));
    const threat = Math.random() < 0.3;
    const color = threat ? COLORS.red : Math.random() < 0.5 ? COLORS.cyan : COLORS.green;
    pulses.push({ x, y, t: 0, dur: rand(1.8, 2.8), max: rand(14, 28), color });
    eventCount++;
    evLabel.textContent = eventCount.toLocaleString("pl-PL") + " ZDARZEŃ";

    if (city !== HQ) {
      const [hx, hy] = proj(HQ[1], HQ[2]);
      arcs.push({ x0: x, y0: y, x1: hx, y1: hy, t: 0, dur: rand(1.1, 2), color, threat });
    }
    if (threat) {
      labels.push({ x: x + 8, y: y - 8, text: `${city[0]} ▸ HQ`, t: 0, dur: 2.6 });
      if (Math.random() < 0.4) bus.emit("threat", city[0]);
    }
  }

  // startowy wsad + stałe tempo zdarzeń
  function schedule() {
    spawn();
    setTimeout(schedule, rand(220, 700));
  }
  for (let i = 0; i < 6; i++) spawn();
  schedule();

  function drawRing(ctx, p, k) {
    const e = 1 - Math.pow(1 - k, 2);
    ctx.globalAlpha = (1 - k) * 0.9;
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.max * e, 0, Math.PI * 2);
    ctx.stroke();
    // drugi, opóźniony pierścień
    const k2 = k - 0.25;
    if (k2 > 0) {
      const e2 = 1 - Math.pow(1 - k2 / 0.75, 2);
      ctx.globalAlpha = (1 - k2 / 0.75) * 0.6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.max * 0.7 * e2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  loop(dt => {
    const { ctx, size } = f;
    ctx.clearRect(0, 0, size.w, size.h);
    if (layer) ctx.drawImage(layer, 0, 0, size.w, size.h);

    ctx.save();
    ctx.font = "10px 'Share Tech Mono','Courier New',monospace";
    ctx.textBaseline = "middle";

    // łuki
    for (let i = arcs.length - 1; i >= 0; i--) {
      const a = arcs[i];
      a.t += dt;
      const k = a.t / a.dur;
      if (k >= 1) {
        // uderzenie w HQ
        pulses.push({ x: a.x1, y: a.y1, t: 0, dur: 1.2, max: a.threat ? 22 : 12, color: a.color });
        arcs.splice(i, 1);
        continue;
      }
      const cx = (a.x0 + a.x1) / 2;
      const cy = Math.min(a.y0, a.y1) - Math.abs(a.x1 - a.x0) * 0.25 - 12;
      const pt = u => {
        const m = 1 - u;
        return [m * m * a.x0 + 2 * m * u * cx + u * u * a.x1, m * m * a.y0 + 2 * m * u * cy + u * u * a.y1];
      };
      const tail = Math.max(0, k - 0.35);
      ctx.shadowColor = a.color;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = a.color;
      ctx.lineWidth = a.threat ? 1.6 : 1.1;
      ctx.beginPath();
      const steps = 14;
      for (let s = 0; s <= steps; s++) {
        const [x, y] = pt(tail + (k - tail) * (s / steps));
        s ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.globalAlpha = 0.85;
      ctx.stroke();
      const [hx, hy] = pt(k);
      ctx.globalAlpha = 1;
      ctx.fillStyle = a.color;
      ctx.beginPath();
      ctx.arc(hx, hy, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // pierścienie
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.t += dt;
      const k = p.t / p.dur;
      if (k >= 1) { pulses.splice(i, 1); continue; }
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      drawRing(ctx, p, k);
      ctx.globalAlpha = 1;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // HQ – stały marker
    hqPhase += dt;
    const [qx, qy] = proj(HQ[1], HQ[2]);
    const hk = (hqPhase % 2.4) / 2.4;
    ctx.shadowColor = COLORS.green2;
    ctx.shadowBlur = 12;
    ctx.globalAlpha = 1 - hk;
    ctx.strokeStyle = COLORS.green2;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(qx, qy, 4 + hk * 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = COLORS.green2;
    ctx.fillRect(qx - 3, qy - 3, 6, 6);
    ctx.fillStyle = COLORS.green2;
    ctx.shadowBlur = 6;
    ctx.fillText("HQ", qx + 8, qy + 10);

    // etykiety zagrożeń
    for (let i = labels.length - 1; i >= 0; i--) {
      const L = labels[i];
      L.t += dt;
      if (L.t >= L.dur) { labels.splice(i, 1); continue; }
      ctx.globalAlpha = Math.min(1, (L.dur - L.t) * 2, L.t * 5);
      ctx.fillStyle = COLORS.red;
      ctx.shadowColor = COLORS.red;
      ctx.shadowBlur = 8;
      ctx.fillText("⚠ " + L.text, L.x, L.y);
    }
    ctx.restore();
  });
})();
