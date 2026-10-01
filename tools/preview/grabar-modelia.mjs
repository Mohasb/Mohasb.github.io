// Graba la vista previa en vídeo de Modelia (proyecto de DAM) para el portfolio.
// Uso: cd tools/preview && npm install && npm run grabar:modelia
// Necesita Microsoft Edge instalado. Graba la demo publicada en GitHub Pages
// con la sesión del administrador de la demo (para poder enseñar el editor de temas).
import { abrirGrabador, codificar } from "./comun.mjs";

const BASE = "https://mohasb.github.io/modeliaWeb/";
const g = await abrirGrabador({
  // Sesión de administrador de la demo, tal como la guarda shared_preferences en web
  initScript: () => {
    const s = (k, v) => localStorage.setItem("flutter." + k, JSON.stringify(v));
    s("access_token", "demo-access-token-modelia.1");
    s("refresh_token", "demo-refresh-token-modelia.1");
    s("usuario_email", "admin@example.com");
    s("usuario_nombre", "Admin Demo");
    s("usuario_rol", "ADMIN");
    s("usuario_id", 1);
  },
});
const { page, record, glide, pulsar } = g;

// Flutter pinta en un canvas: se activa su capa de accesibilidad para localizar elementos
const semantica = async () => {
  await page.waitForSelector("flt-semantics-placeholder", { state: "attached", timeout: 15000 }).catch(() => {});
  await page.evaluate(() => document.querySelector("flt-semantics-placeholder")?.click());
  await page.waitForTimeout(600);
};
const centro = async (locator) => {
  const r = await locator.boundingBox();
  return [r.x + r.width / 2, r.y + r.height / 2];
};
const ir = async (ruta, espera = 6000) => {
  await page.goto(BASE + ruta);
  await page.waitForTimeout(espera);
  await semantica();
};

// ---------- 1. Visor 3D (inicio con los destacados) ----------
// Precarga: el iPhone y el siguiente destacado (patinete) quedan en la caché del navegador
await ir("#/", 12000);
await page.mouse.move(1040, 778);
await pulsar();
await page.waitForTimeout(9000);
await ir("#/", 12000);
await page.mouse.move(1200, 600);
await record("1-visor3d", async () => {
  await page.waitForTimeout(600);
  await glide(1200, 600, 600, 430, 800);
  await glide(600, 430, 260, 450, 2200, true); // girar el iPhone
  await page.waitForTimeout(300);
  await glide(260, 450, 1040, 778, 900);
  await pulsar(); // siguiente destacado
  await page.waitForTimeout(2600);
});

// ---------- 2. Catálogo: filtrar y abrir un producto en 3D ----------
await ir("#/producto/13/ar", 12000); // precarga del modelo de las zapatillas
await ir("#/catalogo", 6000);
const chip = await centro(page.getByRole("checkbox", { name: "Calzado" }));
await page.mouse.move(1100, 700);
await record("2-catalogo", async () => {
  await page.waitForTimeout(500);
  await glide(1100, 700, ...chip, 900);
  await pulsar();
  await page.waitForTimeout(1300);
  // Bajar con la rueda hasta que la tarjeta quede a la vista
  await glide(...chip, 640, 520, 600);
  // La tarjeta es «button» fuera de la vista y «group» dentro: se buscan ambos roles
  const nombre = { name: /Zapatillas Running Ultralight/ };
  const zapatillas = page.getByRole("group", nombre).or(page.getByRole("button", nombre)).first();
  const posicion = async () => ((await zapatillas.count()) ? (await zapatillas.boundingBox())?.y : null);
  for (let i = 0; i < 60; i++) {
    const y = await posicion();
    if (y != null && y > 120 && y < 520) break;
    await page.mouse.wheel(0, y != null && y < 120 ? -50 : 50);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(500);
  const tarjeta = await centro(zapatillas);
  await glide(640, 520, ...tarjeta, 700);
  await pulsar();
  await page.waitForTimeout(1500);
  await page.waitForTimeout(300); // la capa de accesibilidad sigue activa
  const ver3d = await centro(page.getByRole("button", { name: /Ver en 3D/ }));
  await glide(...tarjeta, ...ver3d, 800);
  await pulsar();
  await page.waitForTimeout(3200);
  await glide(760, 420, 460, 440, 1600, true); // girar las zapatillas
  await page.waitForTimeout(500);
});

// ---------- 3. Editor de temas (administrador) ----------
await ir("#/admin/tema", 6000);
const color = await centro(page.getByRole("button", { name: /^Color principal/ }));
await page.mouse.move(1100, 300);
await record("3-temas", async () => {
  await page.waitForTimeout(500);
  await glide(1100, 300, ...color, 900);
  await pulsar();
  await page.waitForTimeout(900);
  await glide(...color, 733, 362, 700);
  await glide(733, 362, 860, 362, 1500, true); // tono hacia el azul
  await page.waitForTimeout(400);
  await page.waitForTimeout(300); // la capa de accesibilidad sigue activa
  const aplicar = await centro(page.getByRole("button", { name: "Aplicar", exact: true }));
  await glide(860, 362, ...aplicar, 600);
  await pulsar();
  await page.waitForTimeout(900);
  await page.waitForTimeout(300); // la capa de accesibilidad sigue activa
  const aplicarApp = await centro(page.getByRole("button", { name: /Aplicar cambios a la app/ }));
  await glide(...aplicar, ...aplicarApp, 600);
  await pulsar();
  await page.waitForTimeout(1200);
  await glide(...aplicarApp, 40, 100, 900); // ir a Inicio con el nuevo color
  await pulsar();
  await page.waitForTimeout(2600);
});

await g.browser.close();
codificar(g, "modelia");
