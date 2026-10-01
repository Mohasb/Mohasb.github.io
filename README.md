# Mi portfolio

Portfolio personal publicado con GitHub Pages.

## Estructura
- `index.html`: toda la web (HTML, CSS y JS en un solo archivo).
- `img/modelia-*` e `img/mhcars-*`: vídeos de vista previa de Modelia (DAM) y MHCars (DAW), con su imagen fija. Se regeneran con `cd tools/preview && npm install && npm run grabar:modelia` (o `grabar:mhcars`).
- `assets/i18n/en.js`: traducción al inglés. El español está en `index.html`.
- `cv.pdf`: currículum. No se publica (`.gitignore`): se pide con el formulario de la web.

## Demos en vivo
Las URL de las demos están en el objeto `DEMOS` de `index.html`: Modelia en `mohasb.github.io/modeliaWeb` y MHCars en `mohasb.github.io/MHCars-React`.

Busca `✏️ EDITA` en `index.html` para encontrar todo lo que falta personalizar.
