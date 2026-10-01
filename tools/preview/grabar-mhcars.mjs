// Graba la vista previa en vídeo de MHCars (proyecto de DAW) para el portfolio.
// Uso: cd tools/preview && npm install && npm run grabar:mhcars
// Necesita Microsoft Edge instalado. Graba la demo publicada en GitHub Pages.
import { abrirGrabador, codificar } from "./comun.mjs";

const BASE = "https://mohasb.github.io/MHCars-React/";
const g = await abrirGrabador();
const { page, record, glide, pulsar, smoothScroll } = g;

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
  await pulsar();
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

await g.browser.close();
codificar(g, "mhcars");
