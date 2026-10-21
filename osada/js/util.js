/* narzędzia wspólne */
const TILE = 28, GW = 64, GH = 40;
const MIN_PER_SEC = 3;            // minut gry na sekundę symulacji przy x1

const $ = (s, r = document) => r.querySelector(s);
const rand = (a, b) => Math.random() * (b - a) + a;
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const chance = p => Math.random() < p;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const hash2 = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
const pad2 = n => String(n).padStart(2, "0");
const fmtClock = min => `${pad2(Math.floor(min / 60) % 24)}:${pad2(Math.floor(min % 60))}`;

const NAMES_F = ["Ola", "Kasia", "Magda", "Zosia", "Hania", "Marta", "Ania", "Basia", "Iga", "Lena", "Julia", "Maja", "Ewa", "Weronika", "Alicja", "Klara", "Nina", "Pola", "Tola", "Gosia", "Roksana", "Dorota"];
const NAMES_M = ["Tomek", "Marek", "Kuba", "Paweł", "Jan", "Michał", "Bartek", "Filip", "Staś", "Olek", "Adam", "Piotr", "Wojtek", "Leon", "Krzysiek", "Maciek", "Igor", "Hubert", "Dawid", "Franek", "Rysiek", "Bruno"];
const SKINS = ["#f6d2b0", "#e8b98d", "#c68a5c", "#8d5a3b", "#5e3a28"];
const HAIRS = ["#2b1d14", "#5a3a22", "#a0522d", "#d9a441", "#c0392b", "#2c3e50", "#e67ea8", "#7a4bd1"];
const SHIRTS = ["#e74c3c", "#3498db", "#2ecc71", "#f1c40f", "#9b59b6", "#e67e22", "#1abc9c", "#ecf0f1", "#fd79a8", "#6c5ce7"];
const PANTS = ["#34495e", "#2d3436", "#6d4c41", "#455a64", "#283593", "#4e342e"];

/* mała kolejka priorytetowa (A*) */
class Heap {
  constructor() { this.a = []; }
  get size() { return this.a.length; }
  push(k, v) {
    const a = this.a; a.push([k, v]);
    let i = a.length - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (a[p][0] <= a[i][0]) break; [a[p], a[i]] = [a[i], a[p]]; i = p; }
  }
  pop() {
    const a = this.a, top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        let l = 2 * i + 1, r = l + 1, m = i;
        if (l < a.length && a[l][0] < a[m][0]) m = l;
        if (r < a.length && a[r][0] < a[m][0]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]]; i = m;
      }
    }
    return top[1];
  }
}
