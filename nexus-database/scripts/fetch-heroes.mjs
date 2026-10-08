// Génère data/heroes.json : un instantané des réponses brutes de superheroapi.com.
// L'application le charge en une seule requête au lieu d'une requête par héros
// (elle retombe sur l'API si le fichier est absent ou invalide).
// Usage : npm run fetch-heroes
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configSource = readFileSync(path.join(root, 'js/config.js'), 'utf8');
const read = (key) => configSource.match(new RegExp(`${key}:\\s*'?([^',\\s]+)`))[1];

const baseUrl = read('baseUrl');
const apiKey = read('apiKey');
const maxHeroId = parseInt(read('maxHeroId'), 10);
const concurrency = 8;
const retries = 4;

async function fetchHero(id) {
    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            const response = await fetch(`${baseUrl}/${apiKey}/${id}`, {
                signal: AbortSignal.timeout(15000)
            });
            if (response.ok) {
                const hero = await response.json();
                if (hero?.response === 'success') return hero;
            }
        } catch (error) {
            // nouvelle tentative
        }
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
    }
    return null;
}

const heroes = new Array(maxHeroId);
let nextId = 1;
await Promise.all(Array.from({ length: concurrency }, async () => {
    while (nextId <= maxHeroId) {
        const id = nextId;
        nextId += 1;
        heroes[id - 1] = await fetchHero(id);
        if (id % 100 === 0) console.log(`${id}/${maxHeroId}`);
    }
}));

const missing = heroes.map((hero, index) => (hero ? null : index + 1)).filter(Boolean);
if (missing.length > 0) {
    console.error(`Échec : ${missing.length} héros manquants (${missing.join(', ')}). Fichier non modifié.`);
    process.exit(1);
}

mkdirSync(path.join(root, 'data'), { recursive: true });
writeFileSync(path.join(root, 'data/heroes.json'), JSON.stringify(heroes));
console.log(`${heroes.length} héros écrits dans data/heroes.json`);
