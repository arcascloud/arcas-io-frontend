/**
 * Comprueba que todo "assets/..." que citan tus estilos, HTML y TS exista de verdad, y que lo haga
 * con las MISMAS mayúsculas/minúsculas. Windows no distingue y Cloudflare (Linux) sí:
 * una fuente guardada como "mukta-regular.ttf" y pedida como "Mukta-Regular.ttf" funciona en tu PC
 * y devuelve 404 en producción.
 *
 * Uso (desde la raíz del frontend):   node scripts/check-assets.mjs
 * Sale con código 1 si algo falta (sirve para ponerlo antes del build en CI).
 */
import fs from 'node:fs';
import path from 'node:path';

const raiz = process.cwd();
const carpetasAssets = [
  path.join(raiz, 'src', 'assets'),
  path.join(raiz, 'public', 'assets'),
  path.join(raiz, 'public')
];
const exts = new Set(['.scss', '.css', '.html', '.ts']);

function* archivos(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* archivos(p);
    else if (exts.has(path.extname(e.name)) && !/copia|backup/i.test(e.name)) yield p;
  }
}

// "assets/..." tras comilla, paréntesis, "=" o espacio; con o sin "/" inicial
const patron = /(?:url\(\s*['"]?|['"`(=\s])\/?(assets\/[^'"`)\s?#$]+)/g;
const referencias = new Map(); // ruta → archivos que la citan

for (const f of archivos(path.join(raiz, 'src'))) {
  const txt = fs.readFileSync(f, 'utf8');
  for (const m of txt.matchAll(patron)) {
    const ruta = m[1].replace(/[),;]+$/, '');
    // Rutas armadas con variables (`assets/images/${x}.png`) o carpetas: no se pueden comprobar
    const siguiente = txt[m.index + m[0].length];
    if (siguiente === '$' || ruta.endsWith('/')) continue;
    if (!referencias.has(ruta)) referencias.set(ruta, new Set());
    referencias.get(ruta).add(path.relative(raiz, f));
  }
}

/** Resuelve la ruta segmento a segmento comparando mayúsculas exactas. */
function resolver(ruta) {
  const [, ...partes] = ruta.split('/'); // quita "assets"
  for (const base of carpetasAssets) {
    let actual = base;
    let diferencia = null;
    let ok = fs.existsSync(base);
    for (const seg of partes) {
      if (!ok) break;
      const hijos = fs.readdirSync(actual);
      if (hijos.includes(seg)) { actual = path.join(actual, seg); continue; }
      const alterno = hijos.find((h) => h.toLowerCase() === seg.toLowerCase());
      if (alterno) { diferencia = `${seg} ≠ ${alterno}`; actual = path.join(actual, alterno); continue; }
      ok = false;
    }
    if (ok) return diferencia ? { estado: 'MAYUSCULAS', detalle: diferencia } : { estado: 'OK' };
  }
  return { estado: 'FALTA' };
}

let problemas = 0;
for (const [ruta, usos] of [...referencias].sort()) {
  const r = resolver(ruta);
  if (r.estado === 'OK') continue;
  problemas++;
  const etiqueta = r.estado === 'FALTA' ? 'NO EXISTE        ' : 'MAYÚSCULAS (404 en Linux)';
  console.log(`✖ ${etiqueta} /${ruta}${r.detalle ? '   [' + r.detalle + ']' : ''}`);
  console.log(`    citado en: ${[...usos].slice(0, 3).join(', ')}${usos.size > 3 ? ` (+${usos.size - 3})` : ''}`);
}

console.log(problemas === 0
  ? `✔ ${referencias.size} rutas de assets verificadas: todas existen con las mayúsculas correctas.`
  : `\n${problemas} de ${referencias.size} rutas con problema.`);
process.exit(problemas === 0 ? 0 : 1);
