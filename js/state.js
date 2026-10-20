/* wspólny stan gry / symulacji */
const G = {
  boost: 1, boostT: 1,          // mnożnik ruchu sieciowego (zależy od scenariusza)
  integrity: 100, score: 0, high: 0,
  wave: 1, combo: 0, blocked: 0, breached: 0,
  active: 0, over: false,
  shieldUntil: 0, autoUntil: 0, lockUntil: 0,
  scenario: null,
  threatLevel: 30, cpu: 35, bpm: 72,
};
try { G.high = +localStorage.getItem("cyberops-high") || 0; } catch (e) { /* brak storage */ }
