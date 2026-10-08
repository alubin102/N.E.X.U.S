import HeroProvider from './services/HeroProvider.js';
import Utils from './services/Utils.js';
import CONFIG from './config.js';
import imageLoader, { getImageUrl } from './services/ImageLoader.js';
import { runLoader } from './loader.js';

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
let dataLoadingPromise = null;
let navigationId = 0;
let searchObserver = null;

// Nombre de cartes ajoutées à la fois dans les résultats de recherche
const SEARCH_CHUNK_SIZE = 24;

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


        // Un seul rendu : le changement de hash déclenche déjà le routeur.
        // Si le hash est identique (carte ouverte depuis la recherche), on le relance à la main.
        const target = `#/hero/${heroId}`;
        if (window.location.hash === target) {
            router();
        } else {
            window.location.hash = target;
        }
    });
}

function ensureDataLoaded() {
    if (!dataLoadingPromise) {
        dataLoadingPromise = (async () => {
            console.log(` ${CONFIG.app.name} v${CONFIG.app.version}`);

            const heroes = await HeroProvider.loadHeroes();
            HeroProvider.loadRatings();

            console.log(` ${heroes.length} super-héros chargés`);
        })();
    }
    return dataLoadingPromise;
}

function stopSearchObserver() {
    if (searchObserver) {
        searchObserver.disconnect();
        searchObserver = null;
    }
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
    navigationId += 1;
    stopSearchObserver();

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

function renderSearchCard(hero) {
    const isFav = HeroProvider.isFavorite(hero.id);
    const avgRating = hero.averageRating || 0;

    return `
            <article class="hero-card" data-hero-id="${hero.id}">
                <div class="hero-card-image">
                    <img 
                        src="${getImageUrl(hero.image) || 'https://via.placeholder.com/300x400?text=No+Image'}"
                        alt="${hero.name}"
                        class="lazy-load"
                        data-src="${getImageUrl(hero.image) || 'https://via.placeholder.com/300x400?text=No+Image'}"
                        loading="lazy"
                        decoding="async"
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
}

function displaySearchResults(results, query) {
    if (!appElement) return;

    // Sans IntersectionObserver, tout est rendu d'un coup comme avant
    const chunkSize = 'IntersectionObserver' in window ? SEARCH_CHUNK_SIZE : results.length;

    appElement.innerHTML = `
        <section class="search-results">
            <div class="search-header">
                <h2>Résultats pour "${Utils.escapeHtml(query)}"</h2>
                <p>${results.length} super-héro${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''}</p>
            </div>
            <div class="heroes-grid"></div>
        </section>
    `;

    const grid = appElement.querySelector('.heroes-grid');
    let rendered = 0;

    // Ajoute le lot suivant de cartes : seules les cartes proches de l'écran existent dans le DOM
    const appendNextChunk = () => {
        const template = document.createElement('template');
        template.innerHTML = results
            .slice(rendered, rendered + chunkSize)
            .map(renderSearchCard)
            .join('');
        rendered += chunkSize;

        attachSearchListeners(template.content);
        const images = Array.from(template.content.querySelectorAll('img'));
        grid.appendChild(template.content);
        images.forEach(img => imageLoader.observe(img));
    };

    appendNextChunk();
    if (rendered >= results.length) return;

    const sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    grid.after(sentinel);

    searchObserver = new IntersectionObserver((entries, observer) => {
        if (!entries.some(entry => entry.isIntersecting)) return;

        appendNextChunk();
        if (rendered >= results.length) {
            observer.disconnect();
            sentinel.remove();
            return;
        }
        // Ré-observe pour enchaîner tant que la fin de la grille reste proche de l'écran
        observer.unobserve(sentinel);
        observer.observe(sentinel);
    }, { rootMargin: '1000px 0px' });
    searchObserver.observe(sentinel);
}

function attachSearchListeners(container) {
    container.querySelectorAll('.favorite-btn').forEach(btn => {
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
    if (!appElement) return;

    const currentNavigation = ++navigationId;
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

    // L'accueil et la page 404 n'utilisent pas les données : inutile de les attendre
    if (PageClass !== Home && PageClass !== Error404) {
        await ensureDataLoaded();
    }

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

    const html = await pageInstance.render();

    // Une navigation plus récente a démarré entre-temps : on n'écrase pas son affichage
    if (currentNavigation !== navigationId) return;

    stopSearchObserver();
    updateNavigation();
    if (searchInput) {
        searchInput.value = '';
    }

    // Un seul passage dans le DOM par navigation, puis branchement des événements
    appElement.innerHTML = html;
    if (typeof pageInstance.afterRender === 'function') {
        pageInstance.afterRender();
    }
}



async function start() {
    initDomReferences();
    setupNavigation();
    setupSearch();
    attachCardNavigation();

    document.documentElement.style.overflow = 'hidden';
    try {
        await Promise.all([
            runLoader(),
            router()
        ]);
    } finally {
        document.documentElement.style.overflow = '';
    }
}

// Les données sont demandées dès l'exécution du script, en parallèle du reste
ensureDataLoaded();

window.addEventListener('hashchange', router);
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
} else {
    start();
}
