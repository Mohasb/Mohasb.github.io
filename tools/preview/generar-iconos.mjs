// Genera los iconos fijos de la web (favicon.ico, icono de iOS y de Android): «MH» en
// Bricolage Grotesque sobre un degradado del color de acento original. En la pestaña, el JS
// de index.html redibuja el icono con el acento activo (paleta sorpresa y tema). Uso: npm run iconos
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import ffmpeg from "ffmpeg-static";

const HERE = path.dirname(new URL(import.meta.url).pathname.slice(1));
const ROOT = path.join(HERE, "..", "..");
const ICONS = path.join(ROOT, "img", "icons");
fs.mkdirSync(ICONS, { recursive: true });

// Mismo degradado que dibuja index.html: acento aclarado → acento oscurecido (--accent = #4331e0)
const ACCENT = "#4331e0", INK = "#ffffff";
const BG = `linear-gradient(135deg, color-mix(in srgb, ${ACCENT}, #fff 22%), color-mix(in srgb, ${ACCENT}, #000 12%))`;

// size: px del PNG · pad: margen interior (los «maskable» necesitan zona segura) · radius: esquinas
const salidas = [
  { file: "icon-16.png", size: 16, pad: 0.1, radius: 0.18 },
  { file: "icon-32.png", size: 32, pad: 0.14, radius: 0.2 },
  { file: "icon-48.png", size: 48, pad: 0.14, radius: 0.2 },
  { file: "apple-touch-icon.png", size: 180, pad: 0.2, radius: 0 }, // iOS redondea las esquinas
  { file: "icon-192.png", size: 192, pad: 0.2, radius: 0.22 },
  { file: "icon-512.png", size: 512, pad: 0.2, radius: 0.22 },
  { file: "icon-maskable-512.png", size: 512, pad: 0.3, radius: 0 },
];

const html = ({ size, pad, radius }) => `<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&display=block" rel="stylesheet">
<style>
  html,body{margin:0;background:transparent}
  .t{width:${size}px;height:${size}px;border-radius:${radius * size}px;background:${BG};
     display:flex;align-items:center;justify-content:center;box-sizing:border-box;padding:${pad * size}px}
  .l{font-family:"Bricolage Grotesque";font-weight:800;color:${INK};white-space:nowrap;
     letter-spacing:-0.04em;line-height:1}
</style></head><body><div class="t"><span class="l">MH</span></div>
<script>
  document.fonts.ready.then(() => {
    const t = document.querySelector(".t"), l = document.querySelector(".l");
    const max = ${size} * (1 - 2 * ${pad});
    let fs = ${size};
    l.style.fontSize = fs + "px";
    while (l.getBoundingClientRect().width > max && fs > 4) l.style.fontSize = (fs -= 0.5) + "px";
    document.body.dataset.ok = 1;
  });
</script></body></html>`;

const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--disable-lcd-text"] }); // sin bordes de colores (ClearType)
for (const s of salidas) {
  const page = await browser.newPage({ viewport: { width: s.size, height: s.size } });
  await page.setContent(html(s), { waitUntil: "load" });
  await page.waitForSelector("body[data-ok]");
  await page.locator(".t").screenshot({ path: path.join(ICONS, s.file), omitBackground: true });
  await page.close();
  console.log("✓", s.file);
}
await browser.close();

// favicon.ico en la raíz: lo piden algunos navegadores y buscadores aunque no esté enlazado
fs.rmSync(path.join(ROOT, "favicon.ico"), { force: true });
execFileSync(ffmpeg, ["-y", "-loglevel", "error", "-i", path.join(ICONS, "icon-48.png"), path.join(ROOT, "favicon.ico")]);
console.log("✓ favicon.ico");
