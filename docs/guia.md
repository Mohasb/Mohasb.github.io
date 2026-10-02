# Guía de mantenimiento del portfolio

Todo lo necesario para entender, modificar y volver a publicar el portfolio y sus demos.

---

## 1. Visión general

```
           Visitante (navegador)
                   │
                   ▼
   mohasb.github.io  ←── repo Mohasb.github.io (este)
   ├─ index.html + assets/ + img/
   │
   ├─ iframe ─► mohasb.github.io/modeliaWeb/    ←── repo modeliaWeb (rama gh-pages)
   │            (Flutter web compilado, backend simulado)
   │
   └─ iframe ─► mohasb.github.io/MHCars-React/  ←── repo MHCars-React (rama gh-pages)
                (React compilado, backend simulado)
```

- **No hay servidor.** GitHub Pages solo entrega archivos y todo se ejecuta en el navegador del visitante.
- **No hay proceso de build en el portfolio.** Lo que hay en el repo es exactamente lo que se publica.
- **Python y Node.js no se ejecutan en la web.** Son herramientas que uso en mi ordenador: generan un archivo (un vídeo, unos colores, unos iconos) y ese archivo es lo que se sube.

## 2. Dónde está cada cosa

| Qué | Dónde | ¿En GitHub? |
|---|---|---|
| Web del portfolio | Repo `Mohasb.github.io` (rama `main`) | Sí |
| App Modelia (código) | Repo `Mohasb/Modelia`: rama `main` (normal) y rama `demo` (modo demo) | Sí |
| Demo Modelia publicada | Repo `modeliaWeb`, rama `gh-pages` | Sí |
| API Modelia | Repo `Mohasb/ModeliaBackend` | Sí |
| App MHCars (código) | Repo `Mohasb/MHCars-React`: rama `demo` (modo demo) y rama `gh-pages` (publicada) | Sí |
| API MHCars | Repo `GestorAlquilerApi` | Sí |
| `CLAUDE.md` (contexto para Claude Code) | Solo en local, excluido con `.gitignore` | **No** |
| CV (`cv.pdf`, `.docx`) | Solo en local | **No** |
| Carpetas `DAW/` y `DAM/` (código original con datos personales) | Solo en local | **No** |

> ⚠️ Haz una copia de seguridad de lo que no está en GitHub (OneDrive, Google Drive o un repo **privado**). Las bases de datos y el SQL originales contienen datos personales reales: no los subas a ningún repo público.

## 3. Las capas de la web (`index.html`)

### 3.1 Estructura (HTML)
Secciones semánticas en este orden: barra (`<header>`), hero, `#experiencia`, `#proyectos` (MHCars primero y Modelia después), `#formacion`, `#habilidades` y `#contacto`. Al final están los diálogos: la ventana de demo (`#demoSheet`) y el formulario del CV.

### 3.2 Diseño (CSS, en el `<style>`)
- **Variables de diseño en `:root`**, como `--bg`, `--surface`, `--ink`, `--muted`, `--line`, `--accent`, `--daw` y `--dam`. Ningún color va escrito directamente en los componentes.
- **Modo oscuro:** cada variable está en tres sitios:
  1. `:root`, con los valores del modo claro;
  2. `@media (prefers-color-scheme: dark)` → `:root:not([data-theme="light"])`, que sigue la preferencia del sistema salvo que el visitante haya elegido el modo claro;
  3. `:root[data-theme="dark"]`, cuando el visitante elige el modo oscuro con el botón.

  **Un color nuevo se añade en los tres.**
- **Tipografías:** Bricolage Grotesque en los títulos (`--display`) e Instrument Sans en el texto (`--body`), cargadas desde Google Fonts.
- **Puntos de corte:** 900 px (menú ☰ y una sola columna), 560 px (botones del hero en rejilla 2 × 2) y 480 px (ajustes finos).

### 3.3 Scripts del `<head>`: antes de pintar
Van arriba a propósito. Si se ejecutaran después, el visitante vería un parpadeo (la web en español que pasa a inglés, o los colores originales que cambian).
- **`window.PALETTES` y `applyPalette`:** si la paleta sorpresa está activada, eligen una paleta distinta a la de la visita anterior y cambian las variables CSS.
- **Idioma:** se decide con este orden de prioridad:
  1. `?lang=xx` en la URL;
  2. la elección guardada en `localStorage`;
  3. el idioma del navegador: es, ca, gl o eu → español; cualquier otro → inglés.

  Mientras se carga el inglés, la clase `i18n-wait` oculta la página para que no se vea el cambio de idioma.

### 3.4 JavaScript principal (al final del `<body>`)
Bloques independientes dentro de una única función:

| Bloque | Qué hace | Dónde buscarlo |
|---|---|---|
| `DEMOS` | URL de cada demo. Si está vacía, el botón sale desactivado | `const DEMOS` |
| `src` | Textos que pone el propio JavaScript (claves `js.*` y `cv.*`) | `const src` |
| i18n | Recorre `data-i18n` y `data-i18n-attr` y aplica el diccionario | «Idioma: banderas» |
| Menú móvil | Botón ☰ por debajo de 900 px | «Menú de secciones» |
| Panal del hero | Canvas 2D de puntos con olas al mover el cursor o tocar, y una ola suave cada ~7 s. Solo se anima mientras hay olas | «Ola ambiental» |
| Escaparate del hero | MHCars en una ventana de navegador (delante) y Modelia en otra ventana y un teléfono (detrás), con sus vídeos. Solo se reproducen mientras se ven | «Escaparate del hero» |
| Diagramas | `buildFlow(svg, cfg)` dibuja y anima los diagramas de «Cómo funciona» a partir del objeto `flows` (`dam` y `daw`) | `function buildFlow`, `const flows` |
| Vídeos | Reproducción automática solo cuando son visibles (IntersectionObserver), capítulos y pausa | `data-start` |
| Ventana de demo | `openDemo` abre el `<dialog>` con el iframe. `setMode` alterna entre ordenador (1280 px escalados) y móvil (390 px) | `function openDemo`, `function setMode` |
| Formulario del CV | Construye un enlace `mailto:` con los datos. No envía nada a ningún servidor | «No hay descarga directa» |

**Movimiento:** todo respeta `prefers-reduced-motion`. Con el movimiento reducido activado, el panal queda quieto y los diagramas no se animan.

### 3.5 Traducciones
- El **español** es la fuente y está escrito en el propio HTML.
- El **inglés** está en `assets/i18n/en.js` como un diccionario `clave → texto`.
- Cada texto visible lleva `data-i18n="clave"`. Para atributos se usa `data-i18n-attr="aria-label:clave"`.
- Las etiquetas de los diagramas usan claves `flow.<texto en español>`.

### 3.6 Iconos
Los iconos con el logo «MH².» están en `img/icons/` y en `favicon.ico`, y se declaran en `site.webmanifest`, que da el nombre y el icono al guardar la web en el móvil. Se generan con la tipografía real de la web (ver la sección 5).

## 4. Las demos en vivo

GitHub Pages no puede ejecutar los backends (Spring Boot y ASP.NET Core). Por eso cada app tiene un **modo demo**: el código de la app es el mismo, pero las peticiones HTTP las responde un backend simulado en el navegador, con el mismo formato que la API real.

| | MHCars (React) | Modelia (Flutter) |
|---|---|---|
| Simulación | `src/demo/mockApi.js` intercepta `window.fetch` | `lib/demo/demo_api.dart`: un `http.BaseClient` conectado con `http.runWithClient` |
| Se activa con | `vite build --mode demo` | `--dart-define=DEMO=true` |
| Escrituras (POST, PUT, DELETE) | En memoria | En memoria |
| Rama | `demo` | `demo` |
| Publicar | `npm run deploy:demo` (sube a `gh-pages`) | `demo\build_demo.bat` y copiar `build/web` al repo `modeliaWeb` |

**Regla de oro:** todo lo de la demo va detrás del flag de demo. El modo normal, con backend, nunca debe romperse.

### Publicar una nueva versión de MHCars
```bash
cd Desktop/Proyectos/MHCars-React
git checkout demo
npm install
npm run deploy:demo
```

### Publicar una nueva versión de Modelia
```bat
cd Desktop\Proyectos\Modelia
git checkout demo
demo\build_demo.bat
```
Después copia el contenido de `build\web` al repo `modeliaWeb` (rama `gh-pages`) y haz commit y push. Los modelos 3D más pesados tienen copias optimizadas en `demo/models`, que el script copia a `build\web\demo-models`.

## 5. Herramientas de desarrollo

### 5.1 Vídeos de vista previa e iconos (Node.js, `tools/preview/`)
- **Vídeos:** abren Edge controlado por código (Playwright), navegan por la demo real con un cursor visible, capturan los fotogramas y ffmpeg genera `.webm`, `.mp4` y la imagen fija `.webp` en `img/`.
- **Iconos:** dibujan «MH².» con la tipografía de la web y generan todos los tamaños.

```bash
cd tools/preview
npm install                 # solo la primera vez
npm run grabar:modelia        # vídeo de Modelia (sección del proyecto)
npm run grabar:modelia-movil  # clip de Modelia en formato móvil (teléfono de la cabecera), con la
                              # realidad aumentada recreada en ar-simulada.html
npm run grabar:mhcars         # vídeo de MHCars (sección del proyecto y cabecera)
npm run iconos              # favicon e iconos de móvil
npm run og                  # imagen al compartir el enlace (og-image.jpg)
```
Al grabar, la consola muestra el segundo en que empieza cada capítulo: cópialos en los atributos `data-start` de los botones de capítulo de `index.html`.

Requisitos: Node.js y Microsoft Edge instalado (Playwright usa el Edge del sistema).

### 5.2 Paletas de color (Python, `tools/paletas/generar.py`)
- Genera las 16 paletas de la «paleta sorpresa» en **OKLCH**, un espacio de color en el que la luminosidad se percibe de forma uniforme. Así todas las paletas tienen el mismo equilibrio.
- Comprueba el **contraste WCAG** de cada combinación de texto y fondo y descarta las que no lo cumplen.

```bash
python tools/paletas/generar.py
```
Escribe el resultado en `tools/paletas/paletas.json`, que no se sube. Esos valores se copian a `window.PALETTES` en el `<head>` de `index.html`. Solo hace falta si quieres paletas nuevas.

## 6. Tareas habituales

### Cambiar un texto
1. Edítalo en `index.html`.
2. Busca su clave `data-i18n` y cambia la traducción en `assets/i18n/en.js`.
3. Pruébalo en inglés con `?lang=en` al final de la URL.

### Añadir un texto nuevo
Ponle `data-i18n="seccion.nombre"` en el HTML y añade la misma clave en `en.js`.

### Añadir un color
Añade la variable en los tres bloques de colores (ver 3.2).

### Añadir un proyecto importante
1. Duplica un `<article class="project">` y dale un `id` propio y un color con `--p`.
2. Alterna la clase `flip` para que la imagen cambie de lado.
3. Si tiene arquitectura cliente-servidor, añade su diagrama en `flows`.
4. Si tiene demo, añade su URL en `DEMOS`.
5. Graba su vídeo con un script similar a `grabar-modelia.mjs`.

### Proyectos secundarios
Crea una sección «Otros proyectos», más compacta (título, una frase, tecnologías y enlaces), después de los dos principales.

## 7. Probar antes de publicar

1. Abre `index.html` con **Live Server** en VS Code.
2. Revisa con las herramientas de desarrollo del navegador (F12):
   - **Móvil:** el modo de dispositivo (Ctrl + Shift + M) a 360 px, en tablet y en escritorio.
   - **Tema:** modo claro y modo oscuro, con el botón ☀/☾.
   - **Idioma:** español y `?lang=en`.
   - **Consola:** que no haya errores.
3. Navega con el **teclado** (Tab): el foco tiene que verse siempre.
4. Pasa **Lighthouse** (pestaña Lighthouse en F12). El objetivo es 90 o más en todo.

> No envíes el formulario del CV durante las pruebas: abre tu programa de correo de verdad.

## 8. Publicar

```bash
git add -A
git commit -m "Describe el cambio en español"
git push
```
GitHub Pages publica en uno o dos minutos. Si no ves el cambio, recarga sin caché con Ctrl + F5.

- `.nojekyll` evita que GitHub procese los archivos con Jekyll: se sirven tal cual.
- Antes de hacer commit, revisa con `git status` que no se cuela nada privado (CV, `.db`, `.sql` o `CLAUDE.md`).

## 9. Ideas pendientes

- Recuperar la sección «Sobre mí» con algo personal y concreto.
- Opiniones de tutores o compañeros, con su permiso.
- Sección «Qué estoy aprendiendo ahora».
- Repasar los README de los repos de los proyectos: capturas, tecnologías, cómo ejecutarlo y enlace a la demo.
