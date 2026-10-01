// Graba el clip en formato móvil de Modelia para el teléfono de la cabecera del portfolio:
// el iPhone y el patinete en 3D en el inicio y, al pulsar «Ver en realidad aumentada», el patinete
// colocado en un salón. La realidad aumentada real solo funciona en la app de Android; aquí se
// recrea con ar-simulada.html (mismo modelo GLB, entorno HDRI de Poly Haven).
// Uso: cd tools/preview && npm install && npm run grabar:modelia-movil
// Resultado: img/modelia-movil-preview.{mp4,webm} e img/modelia-movil-poster.webp (390 × 844)
import { abrirGrabador, codificar } from "./comun.mjs";
import path from "node:path";

const BASE = "https://mohasb.github.io/modeliaWeb/";
const AR = "file:///" + path.join(path.dirname(new URL(import.meta.url).pathname.slice(1)), "ar-simulada.html").replace(/\\/g, "/");
const g = await abrirGrabador({ ancho: 390, alto: 844, escala: 2 });
const { page, record, glide, pulsar } = g;

const ir = async (ruta, espera = 6000) => {
  await page.goto(BASE + ruta);
  await page.waitForTimeout(espera);
};

// Precarga del patinete y de la escena (modelo y entorno) en la caché del navegador
await page.goto(AR);
await page.waitForSelector("body[data-listo]", { timeout: 90000 });
await page.waitForTimeout(4000);
await ir("#/producto/22/ar", 9000);
await page.goto("about:blank"); // el inicio se carga desde cero (un cambio de # no recarga la app)
await ir("#/", 12000);

// ---------- 1. Inicio: girar el iPhone y pasar al patinete ----------
await page.mouse.move(330, 640);
await record("1-destacados", async () => {
  await page.waitForTimeout(400);
  await glide(330, 640, 300, 200, 500);
  await glide(300, 200, 140, 210, 1500, true); // girar el iPhone
  await glide(140, 210, 235, 822, 700);
  await pulsar(); // flecha «siguiente destacado»
  await page.waitForTimeout(1800);
  await glide(235, 822, 300, 200, 500);
  await glide(300, 200, 150, 215, 1300, true); // girar el patinete
  await page.waitForTimeout(300);
  await glide(150, 215, 170, 313, 600); // «Ver en realidad aumentada»
  await pulsar();
  await page.waitForTimeout(300);
});

// ---------- 2. Realidad aumentada (recreada): el patinete en un salón ----------
await page.goto(AR);
await page.waitForSelector("body[data-listo]", { timeout: 90000 });
await page.waitForTimeout(3000);
await page.mouse.move(300, 760);
await record("2-ar", async () => {
  await page.waitForTimeout(1300); // apuntando al suelo
  await glide(300, 760, 195, 600, 500);
  await pulsar();
  await page.evaluate(() => window.colocar());
  await page.waitForTimeout(900);
  await glide(250, 520, 110, 530, 1900, true); // girar el patinete
  await page.waitForTimeout(400);
  await glide(110, 530, 230, 515, 1300, true);
  await page.waitForTimeout(800);
});

await g.browser.close();
codificar(g, "modelia-movil", { master: "780:1688", salida: "390:844" });
