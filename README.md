
# N.E.X.U.S - Base de Données de Super-Héros

Application Single Page Application (SPA) pour explorer, noter et favoriser des super-héros.

## Installation et Démarrage

```bash
cd nexus-database
npm install
npm start
```

Visite `http://localhost:8080`

**Autres commandes**:
- `npm run build` - Compilation production (minifiée)
- `npm run dev` - Compilation développement
- `npm run watch` - Watch mode
- `npm run fetch-heroes` - Régénère `data/heroes.json` (instantané de l'API chargé en une seule requête), à relancer puis rebuilder si les données de l'API changent

## Routes

| Route | Page |
|-------|------|
| `/#/` | Accueil (stats globales) |
| `/#/heroes` | Listing paginé (9 héros/page) |
| `/#/hero/1` | Détail d'un héros |
| `/#/favorites` | Mes favoris |

**Paramètres**: `?publisher=Marvel` pour filtrer par éditeur

## Configuration

Fichier `config.js`:
- API: superheroapi.com (731 héros)
- PageSize: 9 héros par page
- Débounce recherche: 500ms

## Structure

```
js/
├── app.js              # Routeur SPA
├── config.js           # Config globale
├── services/
│   ├── HeroProvider.js # Gestion données + API
│   ├── ImageLoader.js  # Lazy loading images
│   └── Utils.js        # Utilitaires
└── views/pages/        # Home, HeroesList, HeroDetail, Favorites
```

## Fonctionnalités

Plusieurs vues (Home, Liste, Détail, Favoris)  
Pagination (9 héros/page)  
Recherche temps réel avec debounce  
Notation 1-5 étoiles (localStorage)  
Favoris (localStorage)  
Lazy loading images (IntersectionObserver)  
Routeur SPA avec hash  
Webpack bundler + hot reload  

## Stockage Local

- `hero_cache` - Cache des héros
- `hero_favorites` - IDs favoris
- `hero_ratings` - Notes et commentaires

## Design

Interface thématisée "système d'espionnage NEXUS" avec animations et gradient sombre.  
**Aide design & quelques éléments visuels** : Claude IA

## API Utilisée

[superheroapi.com](https://www.superheroapi.com/) - 731 super-héros avec stats complètes



