// Genera og-image.jpg (1200 × 630): la imagen que muestran LinkedIn, WhatsApp, etc. al compartir
// el enlace del portfolio. Usa las imágenes fijas de los vídeos del escaparate. Uso: npm run og
import { chromium } from "playwright-core";
import path from "node:path";
import fs from "node:fs";

const HERE = path.dirname(new URL(import.meta.url).pathname.slice(1));
const ROOT = path.join(HERE, "..", "..");
// Las imágenes van incrustadas: la página se crea en memoria y no puede leer archivos locales
const img = (f) => "data:image/webp;base64," + fs.readFileSync(path.join(ROOT, "img", f)).toString("base64");

const html = `<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700..800&family=Instrument+Sans:wght@500;600&display=block" rel="stylesheet">
<style>
  :root { --bg: #f1f2f6; --ink: #16171d; --muted: #5a5e6d; --line: #d9dce5; --accent: #4331e0; --daw: #c8102e; --dam: #0b6bdb; }
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; overflow: hidden; background: var(--bg); font-family: "Instrument Sans"; color: var(--ink); position: relative; }
  /* Panal de puntos, como el fondo del hero */
  body::before { content: ""; position: absolute; inset: 0;
    background-image: radial-gradient(color-mix(in srgb, var(--accent) 45%, var(--line)) 1.6px, transparent 1.7px);
    background-size: 26px 26px;
    mask-image: radial-gradient(ellipse 60% 75% at 78% 50%, #000 25%, transparent 75%); }
  .txt { position: absolute; left: 72px; top: 0; bottom: 0; width: 560px; display: flex; flex-direction: column; justify-content: center; }
  .logo { font: 800 30px "Bricolage Grotesque"; letter-spacing: -0.03em; margin-bottom: 34px; }
  .logo i { font-style: normal; color: var(--accent); }
  h1 { font: 800 86px/0.95 "Bricolage Grotesque"; letter-spacing: -0.045em; margin-bottom: 28px; }
  .rol { font-size: 27px; color: var(--muted); font-weight: 500; margin-bottom: 30px; }
  .rol b { color: var(--ink); font-weight: 600; }
  .url { display: inline-flex; align-items: center; gap: 10px; align-self: flex-start; padding: 10px 18px; border-radius: 999px;
    background: var(--accent); color: #fff; font-weight: 600; font-size: 21px; }
  /* Escaparate */
  .sc { position: absolute; right: 40px; top: 70px; width: 560px; height: 500px; perspective: 1600px; }
  .win { position: absolute; border-radius: 12px; overflow: hidden; background: #fff; border: 1px solid var(--line);
    box-shadow: 0 34px 60px -26px rgba(10, 12, 30, .45); transform: rotateY(-10deg) rotateX(4deg); }
  .bar { height: 26px; display: flex; align-items: center; gap: 5px; padding: 0 10px; background: #eceef3; border-bottom: 1px solid var(--line);
    font: 500 11px Consolas, monospace; color: var(--muted); }
  .bar i { width: 8px; height: 8px; border-radius: 50%; background: var(--line); }
  .bar span { margin-left: 6px; }
  .win img { display: block; width: 100%; aspect-ratio: 16 / 10; object-fit: cover; }
  .dam { right: 40px; top: 0; width: 330px; filter: brightness(.97); }
  .daw { left: 0; bottom: 30px; width: 420px; z-index: 2; }
  .phone { position: absolute; right: 0; top: 90px; width: 118px; aspect-ratio: 390 / 844; padding: 4px; border-radius: 18px;
    background: #0d0e12; box-shadow: -10px 18px 30px -12px rgba(10, 12, 30, .45); transform: rotateY(-10deg) rotateX(4deg); }
  .phone img { display: block; width: 100%; height: 100%; object-fit: cover; border-radius: 14px; }
  .tag { position: absolute; display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px; border-radius: 999px; background: rgba(255,255,255,.92);
    border: 1px solid var(--line); font-size: 14px; color: var(--muted); white-space: nowrap; }
  .tag::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--p); }
  .tag b { color: var(--ink); font-weight: 600; }
  .daw .tag { left: 12px; bottom: 12px; --p: var(--daw); }
  .dam .tag { left: 10px; top: 34px; --p: var(--dam); }
</style></head><body>
  <div class="txt">
    <div class="logo">MH²<i>.</i></div>
    <h1>Muhammad<br>Hicho Haidor</h1>
    <p class="rol"><b>Desarrollador de software</b><br>Alicante · remoto</p>
    <span class="url">mohasb.github.io</span>
  </div>
  <div class="sc">
    <div class="win dam"><div class="bar"><i></i><i></i><i></i><span>mohasb.github.io/modeliaWeb</span></div><img src="${img("modelia-poster.webp")}"><span class="tag"><b>Modelia</b> Flutter · Spring Boot</span></div>
    <div class="phone"><img src="${img("modelia-movil-poster.webp")}"></div>
    <div class="win daw"><div class="bar"><i></i><i></i><i></i><span>mohasb.github.io/MHCars-React</span></div><img src="${img("mhcars-poster.webp")}"><span class="tag"><b>MHCars</b> React · ASP.NET Core</span></div>
  </div>
</body></html>`;

const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--disable-lcd-text"] });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(ROOT, "og-image.jpg"), type: "jpeg", quality: 88 });
await browser.close();
console.log("✓ og-image.jpg");
