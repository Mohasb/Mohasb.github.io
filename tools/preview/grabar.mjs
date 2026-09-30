// Graba la vista previa en vídeo de MHCars para el portfolio y la codifica.
// Uso: cd tools/preview && npm install && npm run grabar
// Necesita Microsoft Edge instalado. Graba la demo publicada en GitHub Pages.
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import ffmpeg from "ffmpeg-static";

const HERE = path.dirname(new URL(import.meta.url).pathname.slice(1));
const OUT = path.join(HERE, "rec");
const IMG = path.join(HERE, "..", "..", "img");
const BASE = "https://mohasb.github.io/MHCars-React/";
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--use-angle=d3d11", "--ignore-gpu-blocklist", "--mute-audio"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(90000);

// Cursor visible para que se entienda qué se pulsa
await page.addInitScript(() => {
  addEventListener("DOMContentLoaded", () => {
    const c = document.createElement("div");
    c.id = "rec-cursor";
    c.style.cssText = "position:fixed;left:0;top:0;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:rgba(255,255,255,.85);border:2px solid rgba(20,30,60,.85);box-shadow:0 2px 8px rgba(0,0,0,.35);z-index:2147483647;pointer-events:none;transition:transform .15s;opacity:0";
    document.body.appendChild(c);
    addEventListener("mousemove", (e) => { c.style.opacity = 1; c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; }, true);
    addEventListener("mousedown", () => (c.style.transform = "scale(.7)"), true);
    addEventListener("mouseup", () => (c.style.transform = ""), true);
  });
});

const cdp = await page.context().newCDPSession(page);
let frames = null;
cdp.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
  if (frames) frames.push({ data, t: metadata.timestamp });
  await cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
});

const segments = [];
async function record(name, actions) {
  frames = [];
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, everyNthFrame: 1, maxWidth: 1280, maxHeight: 800 });
  await page.waitForTimeout(150);
  await actions();
  await cdp.send("Page.stopScreencast");
  const dir = path.join(OUT, name);
  fs.mkdirSync(dir);
  const list = [];
  frames.forEach((f, i) => {
    const file = `f${String(i).padStart(5, "0")}.jpg`;
    fs.writeFileSync(path.join(dir, file), Buffer.from(f.data, "base64"));
    const next = frames[i + 1]?.t ?? f.t + 1 / 30;
    list.push(`file '${file}'\nduration ${Math.max(next - f.t, 0.001).toFixed(4)}`);
  });
  list.push(`file 'f${String(frames.length - 1).padStart(5, "0")}.jpg'`);
  fs.writeFileSync(path.join(dir, "list.txt"), list.join("\n"));
  const dur = frames.at(-1).t - frames[0].t;
  segments.push({ name, dur, n: frames.length });
  console.log(`${name}: ${frames.length} fotogramas, ${dur.toFixed(2)} s, ${(frames.length / dur).toFixed(1)} fps`);
  frames = null;
}

const glide = async (x1, y1, x2, y2, ms, down = false) => {
  await page.mouse.move(x1, y1);
  if (down) await page.mouse.down();
  const t0 = Date.now();
  for (;;) {
    const k = Math.min(1, (Date.now() - t0) / ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    await page.mouse.move(x1 + (x2 - x1) * e, y1 + (y2 - y1) * e);
    if (k >= 1) break;
    await page.waitForTimeout(8);
  }
  if (down) await page.mouse.up();
};
const smoothScroll = (y, ms) =>
  page.evaluate(([y, ms]) => new Promise((r) => {
    const y0 = scrollY, t0 = performance.now();
    const f = (now) => { const k = Math.min(1, (now - t0) / ms), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; scrollTo(0, y0 + (y - y0) * e); k < 1 ? requestAnimationFrame(f) : r(); };
    requestAnimationFrame(f);
  }), [y, ms]);

// ---------- 1. Showroom 3D ----------
await page.goto(BASE + "#/show-room", { waitUntil: "load" });
await page.waitForFunction(() => { const l = document.querySelector(".loader-main"); return l && getComputedStyle(l).display === "none"; });
await page.waitForTimeout(800);
await record("1-showroom", async () => {
  await page.waitForTimeout(700);
  await glide(820, 420, 460, 440, 2600, true);
  await page.waitForTimeout(300);
  await glide(460, 440, 700, 380, 1800, true);
  await page.mouse.move(1180, 700);
  await page.waitForTimeout(900);
});

// ---------- 2. Alquiler ----------
await page.goto(BASE + "#/", { waitUntil: "networkidle" });
await page.getByPlaceholder("Sucursal recogida").click();
await page.getByRole("option").first().click();
await page.getByPlaceholder("Selecciona el rango de fechas").click();
await page.getByRole("button", { name: /next month|siguiente/i }).first().click();
const days = page.locator('[role="dialog"] button:not([disabled])').filter({ hasText: /^\d+$/ });
await days.nth(9).click();
await days.nth(13).click();
for (const n of ["recogida", "devolución"]) {
  await page.getByPlaceholder("Hora " + n).click();
  await page.keyboard.type("1000");
  await page.getByRole("button", { name: "OK" }).click();
  await page.waitForTimeout(300);
}
await page.mouse.move(1180, 120);
await page.waitForTimeout(600);
const buscar = await page.getByRole("button", { name: "Buscar" }).boundingBox();
await record("2-alquiler", async () => {
  await page.waitForTimeout(500);
  await glide(1180, 120, buscar.x + buscar.width / 2, buscar.y + buscar.height / 2, 1100);
  await page.mouse.down(); await page.waitForTimeout(90); await page.mouse.up();
  await page.getByText("Tipo de combustible").waitFor();
  await page.waitForTimeout(1100);
  await smoothScroll(520, 1600);
  await page.waitForTimeout(700);
  const card = await page.getByRole("button", { name: /reservar/i }).first().boundingBox();
  await glide(buscar.x + buscar.width / 2, 400, card.x + card.width / 2, card.y + card.height / 2, 900);
  await page.waitForTimeout(700);
});

// ---------- 3. Venta ----------
await page.goto(BASE + "#/venta", { waitUntil: "load" });
const bmw = page.getByText("BMW M4 COMPETITION COUPÉ").first();
await bmw.scrollIntoViewIfNeeded();
await page.waitForFunction(() => document.querySelectorAll("canvas").length > 0);
await page.waitForTimeout(6000); // modelo GLB cargado y girando
await page.evaluate(() => scrollTo(0, 0));
await page.mouse.move(1180, 700);
await page.waitForTimeout(1500);
const target = await page.evaluate((y) => y + scrollY - 110, (await bmw.boundingBox()).y);
await record("3-venta", async () => {
  await page.waitForTimeout(1300);
  await smoothScroll(target, 1800);
  await page.waitForTimeout(400);
  const c = await page.locator("canvas").first().boundingBox();
  const cx = c.x + c.width / 2, cy = c.y + c.height / 2;
  await glide(1180, 700, cx + c.width * 0.25, cy, 700);
  await glide(cx + c.width * 0.25, cy, cx - c.width * 0.3, cy + 10, 1900, true);
  await page.mouse.move(cx + c.width * 0.6, cy + 180);
  await page.waitForTimeout(700);
});

fs.writeFileSync(path.join(OUT, "segments.json"), JSON.stringify(segments, null, 2));
await browser.close();

// ---------- Codificación ----------
const FADE = 0.4;
const run = (args, cwd = OUT) => execFileSync(ffmpeg, ["-loglevel", "error", "-y", ...args], { cwd, stdio: "inherit" });
const durations = segments.map(({ name }) => {
  run(["-f", "concat", "-safe", "0", "-i", "list.txt", "-vf", "fps=30,scale=1280:800,format=yuv420p", "-c:v", "libx264", "-crf", "10", "-preset", "fast", `../${name}.mp4`], path.join(OUT, name));
  const info = (() => { try { execFileSync(ffmpeg, ["-i", path.join(OUT, name + ".mp4")], { stdio: "pipe" }); } catch (e) { return String(e.stderr); } })();
  const [, h, m, s] = info.match(/Duration: (\d+):(\d+):([\d.]+)/);
  return +h * 3600 + +m * 60 + +s;
});
let offset = 0, chain = "[0]";
const filters = [], starts = [0];
durations.slice(0, -1).forEach((d, i) => {
  offset += d - FADE;
  const out = i === durations.length - 2 ? "[v]" : `[x${i}]`;
  filters.push(`${chain}[${i + 1}]xfade=transition=fade:duration=${FADE}:offset=${offset.toFixed(2)}${out}`);
  chain = out;
  starts.push(+(offset + FADE / 2).toFixed(1));
});
run([...segments.flatMap(({ name }) => ["-i", name + ".mp4"]), "-filter_complex", filters.join(";"), "-map", "[v]", "-c:v", "libx264", "-crf", "10", "-preset", "fast", "master.mp4"]);
const scale = "scale=1024:640:flags=lanczos";
run(["-i", "master.mp4", "-vf", scale, "-c:v", "libx264", "-crf", "29", "-preset", "veryslow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", path.join(IMG, "mhcars-preview.mp4")]);
run(["-i", "master.mp4", "-vf", scale, "-c:v", "libvpx-vp9", "-crf", "48", "-b:v", "0", "-row-mt", "1", "-deadline", "good", "-cpu-used", "1", "-pix_fmt", "yuv420p", "-an", path.join(IMG, "mhcars-preview.webm")]);
run(["-i", "master.mp4", "-frames:v", "1", "-vf", scale, "-c:v", "libwebp", "-quality", "78", path.join(IMG, "mhcars-poster.webp")]);
console.log("\nListo en img/. Tiempos de los capítulos para data-start en index.html:");
segments.forEach(({ name }, i) => console.log(`  ${name}: ${starts[i]}`));
