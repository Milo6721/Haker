/* liczniki tykające w górę w czasie rzeczywistym */
(function () {
  const items = [...document.querySelectorAll(".counter")].map(el => ({
    num: $(".num", el),
    rateEl: $(".rate", el),
    value: parseFloat(el.dataset.start),
    rate: parseFloat(el.dataset.rate),
    jitter: parseFloat(el.dataset.jitter),
    cur: parseFloat(el.dataset.rate),
  }));

  const fmt = n => Math.floor(n).toLocaleString("pl-PL");

  // wszystkie tempa lekko "oddychają", a od czasu do czasu następuje skok (burst)
  loop(dt => {
    items.forEach(it => {
      const target = it.rate * (1 + (Math.random() - 0.5) * it.jitter);
      it.cur += (target - it.cur) * Math.min(1, dt * 6);
      it.value += it.cur * dt;
      it.num.textContent = fmt(it.value);
    });
  });

  setInterval(() => {
    items.forEach(it => {
      it.rateEl.textContent = "+" + (it.cur < 10 ? it.cur.toFixed(1) : fmt(it.cur)) + "/s";
    });
  }, 400);

  // losowy burst – podbija licznik zagrożeń i rozświetla go na chwilę
  setInterval(() => {
    const it = items[0];
    if (Math.random() < 0.5) {
      it.value += randInt(3, 25);
      it.num.style.textShadow = "0 0 16px #ff2a4d, 0 0 30px #ff2a4d";
      it.num.style.color = "#ffd0d8";
      setTimeout(() => { it.num.style.textShadow = ""; it.num.style.color = ""; }, 220);
    }
  }, 4500);
})();
