// Finalise dist/ après webpack : feuille de style à nom versionné, index.html pointant
// vers les fichiers versionnés, et règles de cache Cloudflare (_headers).
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const staticDir = path.join(dist, 'static');

const bundle = readdirSync(staticDir).find(file => /^main\.[0-9a-f]+\.js$/.test(file));
if (!bundle) {
    throw new Error('Bundle main.[hash].js introuvable dans dist/static : lancer webpack --mode production avant.');
}

const css = readFileSync(path.join(root, 'assets/style.css'));
const cssName = `style.${createHash('sha256').update(css).digest('hex').slice(0, 8)}.css`;
writeFileSync(path.join(staticDir, cssName), css);

const replaceOnce = (html, from, to) => {
    if (html.split(from).length !== 2) {
        throw new Error(`index.html : "${from}" attendu exactement une fois.`);
    }
    return html.replace(from, to);
};

let html = readFileSync(path.join(root, 'index.html'), 'utf8');
html = replaceOnce(html, 'href="assets/style.css"', `href="static/${cssName}"`);
html = replaceOnce(html, 'src="./main.js"', `src="static/${bundle}"`);
writeFileSync(path.join(dist, 'index.html'), html);

// Seuls les fichiers à empreinte sont mis en cache longue durée ; index.html garde
// le comportement par défaut de Cloudflare (revalidation à chaque visite).
writeFileSync(path.join(dist, '_headers'), `/static/*
  Cache-Control: public, max-age=31536000, immutable
`);

console.log(`dist prêt : static/${bundle}, static/${cssName}`);
