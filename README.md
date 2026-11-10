# guaitaLlenç

**CAT** · [ENG](#english)

a Canva creation app by guaita

Editor gràfic de la suite [Guaita Apps](https://github.com/subi2/guaitaApps): un sol fitxer HTML, sense instal·lació, sense CDN i amb tot el processament en local al navegador. Interfície en català.

## Característiques (v0.13.1)

- Documents d'una o diverses pàgines, amb regles, guies i quadrícula; unitats mm, cm, px, pt, in.
- Formes, línies, fletxes, ploma amb nodes Bézier, text amb camps variables (`{títol}`, `{autor}`, `{data}`, `{pàgina}`, `{pàgines}`), imatges amb retall i SVG importat com a objectes editables.
- Colors i estils de text enllaçats al document, paletes, degradats, ombres i desenfocament.
- Biblioteca amb plantilles i símbols, paquets externs `.llencpack.json` (infantil, empresa, arquitectura i enginyeria a `packs/`), «Els meus» i mode infantil.
- Desa en `.llenc`; exporta PNG, JPG, SVG, ZIP i PDF (impressió); SVG i PNG editables (el document hi va incrustat).
- **Col·laboració asíncrona amb GitHub**: instantània + registre d'operacions, fusió sense conflictes (darrer que escriu guanya per propietat), historial de versions, comparació, restauració i autoria.
- Desfés/refés, paleta d'ordres (`Ctrl+K`) i menús desplegables amb totes les eines.

## Ús

L'app és instal·lable com a aplicació (PWA) des del navegador: `pagesCAT/manifest.webmanifest` (CAT) i `pagesENG/manifest.webmanifest` (ENG).

Obre `pagesCAT/guaitaLlenc.html` al navegador o visita la pàgina de presentació (`index.html`). Ajuda: `pagesCAT/HLP guaitaLlenc-ajuda.html`.

## Desenvolupament

Codi a `src/`; `node build.mjs` genera `dist/guaitaLlenc-v<versió>.html` (cal copiar-lo a `pagesCAT/guaitaLlenc.html`). Proves: `node test/unit.test.mjs` (jsdom; cal `npm i jsdom`). Els paquets es regeneren amb els `packs/gen-*.mjs`.

## Llicència

GNU Affero General Public License v3.0 only (`AGPL-3.0-only`). © 2026 SBS BiM Consulting, Jordi Subirós.

---

## English

a Canva creation app by guaita

Graphic editor of the [Guaita Apps](https://github.com/subi2/guaitaApps) suite: a single self-contained HTML file, no install, no CDN, everything processed locally in the browser. The interface is in Catalan only.

### Features (v0.13.1)

- Single or multi-page documents with rulers, guides and grid; units mm, cm, px, pt, in.
- Shapes, lines, arrows, pen tool with Bézier nodes, text with variable fields, cropped images and imported SVG as editable objects.
- Document-linked colors and text styles, palettes, gradients, shadows and blur.
- Library with templates and symbols, external `.llencpack.json` packs (kids, business, architecture & engineering in `packs/`), a personal library and a kids mode.
- Saves `.llenc`; exports PNG, JPG, SVG, ZIP and PDF (print); editable SVG and PNG (the document is embedded).
- **Asynchronous collaboration through GitHub**: snapshot + operation log, conflict-free merging (last writer wins per property), version history, comparison, restore and authorship.
- Undo/redo, command palette (`Ctrl+K`) and full cascading menus.

### Usage

The app can be installed as a PWA from the browser: `pagesENG/manifest.webmanifest` (manifest in English; the interface stays in Catalan).

Open `pagesCAT/guaitaLlenc.html` in a browser or use the landing page (`index.html`). Help (Catalan): `pagesCAT/HLP guaitaLlenc-ajuda.html`.

### Development

Sources in `src/`; `node build.mjs` writes `dist/guaitaLlenc-v<version>.html` (copy it to `pagesCAT/guaitaLlenc.html`). Tests: `node test/unit.test.mjs` (jsdom; run `npm i jsdom` first).

### License

GNU Affero General Public License v3.0 only (`AGPL-3.0-only`). © 2026 SBS BiM Consulting, Jordi Subirós.
