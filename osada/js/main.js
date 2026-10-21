/* start aplikacji */
(function () {
  const sim = new Sim();
  const canvas = $("#view");
  const renderer = new Renderer(canvas, sim);
  const ui = new UI(sim, renderer);
  window.__osada = { sim, renderer, ui };    // do podglądu w konsoli przeglądarki

  // wczytaj poprzedni zapis (jeśli jest)
  try { if (localStorage.getItem("osada-save-v1")) ui.loadSave(false); } catch (e) { /* brak storage */ }
  ui.updateTop();

  let last = performance.now(), saveT = 0;
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    sim.update(dt);
    ui.frame(dt);
    renderer.draw(ui, dt);
    saveT += dt;
    if (saveT > 30) { saveT = 0; ui.save(); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.addEventListener("pagehide", () => ui.save());
})();
