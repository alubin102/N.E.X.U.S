import HeroProvider from './services/HeroProvider.js';
import Utils from './services/Utils.js';
import CONFIG from './config.js';
import imageLoader, { getImageUrl } from './services/ImageLoader.js';

import Home from './views/pages/Home.js';
import HeroesList from './views/pages/HeroesList.js';
import HeroDetail from './views/pages/HeroDetail.js';
import Favorites from './views/pages/Favorites.js';
import Error404 from './views/pages/Error404.js';



const routes = {
    '/': Home,
    '/home': Home,
    '/heroes': HeroesList,
    '/heroes/:id': HeroesList,
    '/hero/:id': HeroDetail,
    '/favorites': Favorites
};



let appElement = null;
let searchInput = null;
let mainNav = null;
let dataLoaded = false;

function initDomReferences() {
    if (appElement) return;
    appElement = document.getElementById('app');
    searchInput = document.getElementById('search-input');
    mainNav = document.getElementById('main-nav');
}


function attachCardNavigation() {
    if (!appElement) return;
    appElement.addEventListener('click', async (e) => {
 
        if (e.target.closest('.favorite-btn')) return;

        const card = e.target.closest('.hero-card');
        if (!card) return;

        const heroId = card.dataset.heroId || card.getAttribute('data-hero-id');
        if (!heroId) return;


        window.location.hash = `#/hero/${heroId}`;
        setTimeout(router, 50);
    });
}

async function ensureDataLoaded() {
    if (dataLoaded) return;

    console.log(` ${CONFIG.app.name} v${CONFIG.app.version}`);

    const heroes = await HeroProvider.loadHeroes();
    HeroProvider.loadRatings();
    dataLoaded = true;

    console.log(` ${heroes.length} super-héros chargés`);
}


function navigate(path) {
    if (!path.startsWith('/')) path = '/' + path;
    window.location.hash = `#${path}`;
}

function updateNavigation() {
    const hash = window.location.hash.substring(1) || '/';
    if (!mainNav) return;

    mainNav.querySelectorAll('a').forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href').substring(1);

        if ((hash === '' || hash === '/') && href === '') {
            link.classList.add('active');
        } else if (hash.startsWith(href) && href !== '') {
            link.classList.add('active');
        }
    });
}

function setupNavigation() {
    if (!mainNav) return;

    mainNav.addEventListener('click', (e) => {
        if (e.target.hasAttribute('data-link')) {
            e.preventDefault();
            const href = e.target.getAttribute('href').substring(1);
            navigate(href);
        }
    });
}



function performSearch(query) {
    const results = HeroProvider.searchHeroes(query);

    if (!results || results.length === 0) {
        if (appElement) {
            appElement.innerHTML = `
                <section class="search-results">
                    <div class="message info">
                        📭 Aucun super-héro trouvé pour "${Utils.escapeHtml(query)}"
                    </div>
                </section>
            `;
        }
        return;
    }

    displaySearchResults(results, query);
}

function displaySearchResults(results, query) {
    if (!appElement) return;

    let html = `
        <section class="search-results">
            <div class="search-header">
                <h2>Résultats pour "${Utils.escapeHtml(query)}"</h2>
                <p>${results.length} super-héro${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''}</p>
            </div>
            <div class="heroes-grid">
    `;

    results.forEach(hero => {
        const isFav = HeroProvider.isFavorite(hero.id);
        const avgRating = hero.averageRating || 0;

        html += `
            <article class="hero-card" data-hero-id="${hero.id}">
                <div class="hero-card-image">
                    <img 
                        src="${getImageUrl(hero.image) || 'https://via.placeholder.com/300x400?text=No+Image'}"
                        alt="${hero.name}"
                        class="lazy-load"
                        data-src="${getImageUrl(hero.image) || 'https://via.placeholder.com/300x400?text=No+Image'}"
                        loading="lazy"
                    >
                    <button class="favorite-btn ${isFav ? 'active' : ''}" 
                            data-hero-id="${hero.id}"
                            title="${isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                        ♥
                    </button>
                </div>
                <div class="hero-card-body">
                    <h3>${Utils.escapeHtml(hero.name)}</h3>
                    <p class="hero-publisher">${Utils.escapeHtml(hero.publisher)}</p>
                    ${avgRating > 0 ? `
                        <div class="hero-rating">
                            <span class="stars">★${avgRating.toFixed(1)}</span>
                        </div>
                    ` : ''}
                    <a href="#/hero/${hero.id}" class="btn btn-small">Détails</a>
                </div>
            </article>
        `;
    });

    html += '</div></section>';
    appElement.innerHTML = html;

    // Initialiser le lazy loading pour les images de recherche
    if ('IntersectionObserver' in window) {
        imageLoader.reload();
        imageLoader.observeAll(appElement);
    }

    attachSearchListeners();
}

function attachSearchListeners() {
    if (!appElement) return;

    appElement.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const heroId = parseInt(btn.dataset.heroId, 10);
            const hero = HeroProvider.getHeroById(heroId);

            if (hero) {
                HeroProvider.toggleFavorite(hero);
                btn.classList.toggle('active');
            }
        });
    });
}

function setupSearch() {
    if (!searchInput) return;

    const debouncedSearch = Utils.debounce((query) => {
        performSearch(query);
    }, CONFIG.ui.debounceSearchDelay);

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (query.length === 0) {
            navigate('/heroes');
            return;
        }
        debouncedSearch(query);
    });
}


async function router() {
    initDomReferences();
    await ensureDataLoaded();

    if (!appElement) return;

    const request = Utils.parseRequestURL();


    let routeKey;
    if (!request.resource) {
        routeKey = '/';
    } else if (request.resource === 'hero' && request.id) {
        routeKey = '/hero/:id';
    } else {
        routeKey = `/${request.resource}`;
    }

    const PageClass = routes[routeKey] || Error404;

    let pageInstance;
    if (PageClass === HeroesList) {
        const pageNum = request.id || 1;
        const publisher = request.queryParams?.publisher || null;
        pageInstance = new HeroesList(pageNum, publisher);
    } else if (PageClass === HeroDetail) {
        const heroId = request.id;
        pageInstance = new HeroDetail(heroId);
    } else {
        pageInstance = new PageClass();
    }

    updateNavigation();
    if (searchInput) {
        searchInput.value = '';
    }

    appElement.innerHTML = await pageInstance.render();
}



window.addEventListener('hashchange', router);
window.addEventListener('load', () => {
    initDomReferences();
    setupNavigation();
    setupSearch();
    attachCardNavigation();
    router();
});
