/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;// ./js/config.js
const CONFIG = {
    app: {
        name: 'Super-Héros Directory',
        version: '1.0.0',
        description: 'Application de répertoire de super-héros avec notation et favoris'
    },
    
    api: {
        baseUrl: 'https://www.superheroapi.com/api.php',
        apiKey: '7bea7e85f7979785a2773ca78db33d53',
        maxHeroId: 731,
        requestBatchSize: 8
    },
    
    storage: {
        favorites: 'hero_favorites',
        ratings: 'hero_ratings',
        theme: 'app_theme'
    },

    ui: {
        pageSize: 9,
        debounceSearchDelay: 500,
        ratingMaxLength: 200
    }
};

/* harmony default export */ const config = (CONFIG);

;// ./js/services/HeroProvider.js


class HeroProvider {
    static apiKey = config.api.apiKey;
    static baseUrl = config.api.baseUrl;
    static heroes = [];
    static ratingsKey = 'hero_ratings';
    static favoritesKey = 'hero_favorites';
    static favorites = HeroProvider.loadFavorites();

    static loadFromCache() {
        try {
            const data = localStorage.getItem('hero_cache');
            const heroes = data ? JSON.parse(data) : null;
            if (heroes && Array.isArray(heroes) && heroes.length > 0) {
                const firstHero = heroes[0];
                if (!firstHero.biography) {
                    localStorage.removeItem('hero_cache');
                    return null;
                }
            }
            
            return heroes;
        } catch (e) {
            return null;
        }
    }

    static saveToCache(heroes) {
        try {
            localStorage.setItem('hero_cache', JSON.stringify(heroes));
        } catch (e) {
        }
    }

    static async loadHeroes() {
        let apiHeroes = HeroProvider.loadFromCache();

        if (apiHeroes === null) {
            apiHeroes = await HeroProvider.fetchAllApiHeroes();
            if (apiHeroes && apiHeroes.length > 0) {
                HeroProvider.saveToCache(apiHeroes);
            }
        }

        HeroProvider.heroes = apiHeroes || [];
        return HeroProvider.heroes;
    }

    static async fetchAllApiHeroes() {
        const maxHeroId = config.api.maxHeroId || 731;
        const batchSize = config.api.requestBatchSize || 8;
        const heroes = [];

        for (let start = 1; start <= maxHeroId; start += batchSize) {
            const end = Math.min(start + batchSize - 1, maxHeroId);
            const ids = Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
            const batch = await Promise.all(ids.map(id => HeroProvider.fetchHeroById(id)));
            batch.forEach(hero => {
                if (hero) heroes.push(hero);
            });
        }

        return heroes;
    }

    static async fetchHeroById(id) {
        try {
            const response = await fetch(`${HeroProvider.baseUrl}/${HeroProvider.apiKey}/${id}`);
            if (!response.ok) return null;

            const apiHero = await response.json();
            if (!apiHero || apiHero.response !== 'success') return null;

            return {
                id: parseInt(apiHero.id),
                name: apiHero.name || 'Inconnu',
                alias: apiHero.biography?.['full-name'] || apiHero.name || 'Inconnu',
                publisher: apiHero.biography?.publisher || 'Inconnu',
                image: apiHero.image?.url || '',
                biography: {
                    fullName: apiHero.biography?.['full-name'] || '-',
                    alterEgos: apiHero.biography?.['alter-egos'] || '-',
                    firstAppearance: apiHero.biography?.['first-appearance'] || '-',
                    placeOfBirth: apiHero.biography?.['place-of-birth'] || '-',
                    publisher: apiHero.biography?.publisher || '-',
                    alignment: apiHero.biography?.alignment || '-'
                },
                appearance: {
                    gender: apiHero.appearance?.gender || '-',
                    race: apiHero.appearance?.race || '-',
                    height: apiHero.appearance?.height?.[0] || '-',
                    weight: apiHero.appearance?.weight?.[0] || '-',
                    eyeColor: apiHero.appearance?.['eye-color'] || '-',
                    hairColor: apiHero.appearance?.['hair-color'] || '-'
                },
                work: {
                    occupation: apiHero.work?.occupation || '-',
                    base: apiHero.work?.base || '-'
                },
                connections: {
                    groupAffiliation: apiHero.connections?.['group-affiliation'] || '-',
                    relatives: apiHero.connections?.relatives || '-'
                },
                stats: {
                    intelligence: HeroProvider.toNumber(apiHero.powerstats?.intelligence),
                    strength: HeroProvider.toNumber(apiHero.powerstats?.strength),
                    speed: HeroProvider.toNumber(apiHero.powerstats?.speed),
                    durability: HeroProvider.toNumber(apiHero.powerstats?.durability),
                    power: HeroProvider.toNumber(apiHero.powerstats?.power),
                    combat: HeroProvider.toNumber(apiHero.powerstats?.combat)
                },
                ratings: [],
                averageRating: 0
            };
        } catch (error) {
            return null;
        }
    }

    static toNumber(value) {
        const n = parseInt(value, 10);
        return Number.isNaN(n) ? 0 : n;
    }

    static getAllHeroes() {
        return HeroProvider.heroes;
    }

    static getHeroById(id) {
        return HeroProvider.heroes.find(hero => hero.id === parseInt(id)) || null;
    }

    static searchHeroes(query) {
        if (!query || query.trim().length === 0) {
            return [];
        }
        const q = query.toLowerCase();
        return HeroProvider.heroes.filter(hero =>
            (hero.name || '').toLowerCase().includes(q)
        );
    }

    static getHeroesByPublisher(publisher) {
        return HeroProvider.heroes.filter(hero => hero.publisher === publisher);
    }

    static getPublishers() {
        return [...new Set(HeroProvider.heroes.map(hero => hero.publisher).filter(Boolean))];
    }

    static loadFavorites() {
        try {
            const data = localStorage.getItem(HeroProvider.favoritesKey);
            return new Map(JSON.parse(data || '[]'));
        } catch (error) {
            console.error('Erreur chargement favoris:', error);
            return new Map();
        }
    }

    static saveFavorites() {
        try {
            const data = JSON.stringify(Array.from(HeroProvider.favorites.entries()));
            localStorage.setItem(HeroProvider.favoritesKey, data);
        } catch (error) {
            console.error('Erreur sauvegarde favoris:', error);
        }
    }

    static addFavorite(hero) {
        HeroProvider.favorites.set(hero.id, hero);
        HeroProvider.saveFavorites();
    }

    static removeFavorite(heroId) {
        HeroProvider.favorites.delete(heroId);
        HeroProvider.saveFavorites();
    }

    static isFavorite(heroId) {
        return HeroProvider.favorites.has(heroId);
    }

    static getFavoriteHeroes() {
        return Array.from(HeroProvider.favorites.values());
    }

    static toggleFavorite(hero) {
        if (HeroProvider.isFavorite(hero.id)) {
            HeroProvider.removeFavorite(hero.id);
            return false;
        } else {
            HeroProvider.addFavorite(hero);
            return true;
        }
    }

    static addRating(heroId, score, comment = '') {
        const hero = HeroProvider.getHeroById(heroId);
        if (!hero) return;

        const rating = {
            score: Math.max(1, Math.min(5, score)),
            comment,
            date: new Date().toISOString()
        };

        if (!hero.ratings) hero.ratings = [];
        hero.ratings.push(rating);
        HeroProvider.updateAverageRating(heroId);
        HeroProvider.saveRatings();
    }

    static getRatings(heroId) {
        const hero = HeroProvider.getHeroById(heroId);
        return hero ? (hero.ratings || []) : [];
    }

    static updateAverageRating(heroId) {
        const hero = HeroProvider.getHeroById(heroId);
        if (!hero || !hero.ratings || hero.ratings.length === 0) {
            if (hero) hero.averageRating = 0;
            return;
        }
        const average = hero.ratings.reduce((sum, r) => sum + r.score, 0) / hero.ratings.length;
        hero.averageRating = Math.round(average * 10) / 10;
    }

    static saveRatings() {
        try {
            const ratingsData = HeroProvider.heroes.map(h => ({
                id: h.id,
                ratings: h.ratings || [],
                averageRating: h.averageRating || 0
            }));
            localStorage.setItem(HeroProvider.ratingsKey, JSON.stringify(ratingsData));
        } catch (error) {
            console.error('Erreur sauvegarde notations:', error);
        }
    }

    static loadRatings() {
        try {
            const data = localStorage.getItem(HeroProvider.ratingsKey);
            if (!data) return;
            const ratingsData = JSON.parse(data);
            ratingsData.forEach(rd => {
                const hero = HeroProvider.getHeroById(rd.id);
                if (hero) {
                    hero.ratings = rd.ratings || [];
                    hero.averageRating = rd.averageRating || 0;
                }
            });
        } catch (error) {
            console.error('Erreur chargement notations:', error);
        }
    }

}


;// ./js/services/Utils.js
const Utils = {
    escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, char => map[char]);
    },

    debounce(fn, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn(...args), delay);
        };
    },

    paginate(items, page = 1, pageSize = 10) {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return {
            items: items.slice(start, end),
            totalPages: Math.ceil(items.length / pageSize),
            currentPage: page,
            totalItems: items.length
        };
    },

    parseRequestURL() {
        const url = location.hash.slice(1) || '/';
        const [path, queryString] = url.split('?');
        const [, resource = null, id = null, verb = null] = path.toLowerCase().split('/');
        
        const queryParams = {};
        if (queryString) {
            queryString.split('&').forEach(param => {
                const [key, value] = param.split('=');
                if (key) {
                    queryParams[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
                }
            });
        }
        
        return { resource, id, verb, queryParams };
    }
};

/* harmony default export */ const services_Utils = (Utils);

;// ./js/services/ImageLoader.js
function getImageUrl(url) {
    if (!url || !url.startsWith('https://www.superherodb.com/')) {
        return url;
    }

    return `/api/image?url=${encodeURIComponent(url)}`;
}

class ImageLoader {
    constructor(options = {}) {
        this.options = {
            rootMargin: options.rootMargin || '50px',
            threshold: options.threshold || 0.01,
            placeholderColor: options.placeholderColor || '#f0f0f0',
            ...options
        };

        this.imageMap = new WeakMap();
        this.initObserver();
    }

    initObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                }
            });
        }, {
            rootMargin: this.options.rootMargin,
            threshold: this.options.threshold
        });
    }

    loadImage(img) {
        const originalSrc = img.dataset.src || img.getAttribute('data-src');
        const srcset = img.dataset.srcset || img.getAttribute('data-srcset');

        if (!originalSrc) {
            this.observer.unobserve(img);
            return;
        }

        const src = getImageUrl(originalSrc);
        img.classList.add('lazy-loading');

        const tempImg = new Image();

        tempImg.onload = () => {
            img.src = src;
            if (srcset) {
                img.srcset = srcset;
            }
            img.classList.remove('lazy-loading');
            img.classList.add('lazy-loaded');
            this.observer.unobserve(img);
            img.dispatchEvent(new Event('lazyloaded'));
        };

        tempImg.onerror = () => {
            this.setFallbackImage(img);
            this.observer.unobserve(img);
            img.dispatchEvent(new Event('lazyloaderror'));
        };
        tempImg.src = src;
    }

    setFallbackImage(img) {
        const fallback = img.dataset.fallback || 
                        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"%3E%3Crect fill="%23f0f0f0" width="300" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="14" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
        
        img.src = fallback;
        img.classList.remove('lazy-loading');
        img.classList.add('lazy-error');
    }

    observe(img) {
        if (img.classList.contains('lazy-load') || img.dataset.src) {
            this.observer.observe(img);
        }
    }

    observeAll(container = document) {
        const lazyImages = container.querySelectorAll('img[data-src], img.lazy-load');
        lazyImages.forEach(img => this.observe(img));
    }

    unobserve(img) {
        this.observer.unobserve(img);
    }

    disconnect() {
        this.observer.disconnect();
    }

    reload() {
        if (this.observer) {
            this.observer.disconnect();
        }
        this.initObserver();
        this.observeAll();
    }
}

const imageLoader = new ImageLoader();

/* harmony default export */ const services_ImageLoader = (imageLoader);

;// ./js/views/pages/Home.js



class Home {
    async render() {
        const lastUpdated = new Date().toLocaleTimeString('fr-FR');

        return `
            <section class="home-section">
                <div class="home-hero terminal-screen">
                    <div class="sys-status">
                        <span>[ SYS.OP : ONLINE ]</span>
                        <span>ACCRÉDITATION : NIVEAU 7</span>
                        <span>RÉSEAU : SÉCURISÉ</span>
                        <span>TIMESTAMP : ${lastUpdated}</span>
                    </div>

                    <h2>
                        <span class="typing-text">ACCÈS AUTORISÉ : N.E.X.U.S.</span><span class="cursor"></span>
                    </h2>
                    <p class="tagline">système global d'identification des menaces métahumaines</p>

                    <div class="terminal-logs">
                        <p>> Initialisation du protocole de sécurité... <span class="text-ok">[OK]</span></p>
                        <p>> Décryptage des dossiers classifiés... <span class="text-ok">[OK]</span></p>
                        <p>> Connexion au réseau satellite tactique... <span class="text-ok">[ÉTABLIE]</span></p>
                        <p class="blink-text">> En attente de commande opérateur_</p>
                    </div>

                    <div class="home-actions">
                        <a href="#/heroes" class="btn btn-primary">[ INITIALISER LA RECHERCHE ]</a>
                        <a href="#/favorites" class="btn btn-secondary">[ ACCÉDER AUX ARCHIVES ]</a>
                    </div>
                </div>

            </section>
        `;
    }
}

/* harmony default export */ const pages_Home = (Home);

;// ./js/views/pages/HeroesList.js




class HeroesList {
    constructor(page = 1, publisher = null) {
        this.page = parseInt(page) || 1;
        this.pageSize = 9;
        this.heroes = HeroProvider.getAllHeroes();
        this.currentPublisher = publisher || null;
        
        if (this.currentPublisher) {
            this.filteredHeroes = HeroProvider.getHeroesByPublisher(this.currentPublisher);
        } else {
            this.filteredHeroes = this.heroes;
        }
    }

    getHeroPageUrl(pageNum) {
        if (this.currentPublisher) {
            return `#/heroes/${pageNum}?publisher=${encodeURIComponent(this.currentPublisher)}`;
        }
        return `#/heroes/${pageNum}`;
    }

    async render() {
        const totalPages = Math.ceil(this.filteredHeroes.length / this.pageSize);
        if (this.page > totalPages && totalPages > 0) {
            this.page = totalPages;
        }

        const pagination = services_Utils.paginate(this.filteredHeroes, this.page, this.pageSize);
        const publishers = HeroProvider.getPublishers();

        if (this.filteredHeroes.length === 0) {
            const html = `
                <section class="heroes-section">
                    <div class="section-header">
                        <h2>Super-Héros</h2>
                        <div class="filters">
                            <select id="publisher-filter" class="filter-select">
                                <option value="">Tous les éditeurs</option>
                                ${publishers.map(pub => `
                                    <option value="${pub}" ${this.currentPublisher === pub ? 'selected' : ''}>${pub}</option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="message info">
                        Aucun super-héro trouvé
                    </div>
                </section>
            `;
            setTimeout(() => {
                const appElement = document.getElementById('app');
                if (!appElement) return;
                appElement.innerHTML = html;

                const publisherFilter = appElement.querySelector('#publisher-filter');
                if (publisherFilter) {
                    publisherFilter.addEventListener('change', (e) => {
                        const selectedPublisher = e.target.value;
                        if (selectedPublisher) {
                            window.location.hash = `#/heroes/1?publisher=${encodeURIComponent(selectedPublisher)}`;
                        } else {
                            window.location.hash = '#/heroes/1';
                        }
                    });
                }

                this.attachFavoriteListeners();
                this.initLazyLoading();
            }, 0);

            return html;
        }

        let html = `
            <section class="heroes-section">
                <div class="section-header">
                    <h2>Super-Héros</h2>
                    <div class="filters">
                        <select id="publisher-filter" class="filter-select">
                            <option value="">Tous les éditeurs</option>
                            ${publishers.map(pub => `
                                <option value="${pub}" ${this.currentPublisher === pub ? 'selected' : ''}>${pub}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="heroes-count">
                    ${this.filteredHeroes.length} super-héro${this.filteredHeroes.length > 1 ? 's' : ''} trouvé${this.filteredHeroes.length > 1 ? 's' : ''}
                </div>

                <div class="heroes-grid">
        `;

        pagination.items.forEach(hero => {
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
                        <h3>${services_Utils.escapeHtml(hero.name)}</h3>
                        <p class="hero-publisher">${services_Utils.escapeHtml(hero.publisher)}</p>
                        
                        ${avgRating > 0 ? `
                            <div class="hero-rating">
                                <span class="stars">${this.renderStars(avgRating)}</span>
                                <span class="rating-value">${avgRating.toFixed(1)}/5</span>
                            </div>
                        ` : ''}
                        
                        <a href="#/hero/${hero.id}" class="btn btn-small">Détails</a>
                    </div>
                </article>
            `;
        });

        html += '</div>';

        if (totalPages > 1) {
            html += `
                <div class="pagination">
                    ${this.page > 1 ? `
                        <a href="${this.getHeroPageUrl(1)}" class="btn-page">« Première</a>
                        <a href="${this.getHeroPageUrl(this.page - 1)}" class="btn-page">‹ Précédent</a>
                    ` : ''}
                    
                    <span class="page-info">Page ${this.page} / ${totalPages}</span>
                    
                    ${this.page < totalPages ? `
                        <a href="${this.getHeroPageUrl(this.page + 1)}" class="btn-page">Suivant ›</a>
                        <a href="${this.getHeroPageUrl(totalPages)}" class="btn-page">Dernière »</a>
                    ` : ''}
                </div>
            `;
        }

        html += '</section>';
        setTimeout(() => {
            const appElement = document.getElementById('app');
            if (!appElement) return;
            appElement.innerHTML = html;

            const publisherFilter = appElement.querySelector('#publisher-filter');
            if (publisherFilter) {
                publisherFilter.addEventListener('change', (e) => {
                    const selectedPublisher = e.target.value;
                    if (selectedPublisher) {
                        window.location.hash = `#/heroes/1?publisher=${encodeURIComponent(selectedPublisher)}`;
                    } else {
                        window.location.hash = '#/heroes/1';
                    }
                });
            }

            this.attachFavoriteListeners();
            this.initLazyLoading();
        }, 0);

        return html;
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 >= 0.5;
        let stars = '★'.repeat(fullStars);
        if (hasHalf) stars += '½';
        stars += '☆'.repeat(5 - Math.ceil(rating));
        return stars;
    }

    attachFavoriteListeners() {
        const appElement = document.getElementById('app');
        appElement.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const heroId = parseInt(btn.dataset.heroId);
                const hero = HeroProvider.getHeroById(heroId);
                
                if (hero) {
                    const isFav = HeroProvider.toggleFavorite(hero);
                    btn.classList.toggle('active');
                }
            });
        });
    }

    initLazyLoading() {
        // Utilise le service ImageLoader pour un lazy loading robuste
        if ('IntersectionObserver' in window) {
            const appElement = document.getElementById('app');
            if (appElement) {
                // Recharge l'observer et observe toutes les images non chargées
                services_ImageLoader.reload();
                services_ImageLoader.observeAll(appElement);
            }
        } else {
            // Fallback pour les navigateurs sans IntersectionObserver
            const images = document.querySelectorAll('img[data-src]');
            images.forEach(img => {
                img.src = img.dataset.src;
            });
        }
    }
}

/* harmony default export */ const pages_HeroesList = (HeroesList);

;// ./js/views/pages/HeroDetail.js




class HeroDetail {
    constructor(heroId) {
        this.heroId = parseInt(heroId);
        this.hero = null;
    }

    async loadHeroData() {
        this.hero = HeroProvider.getHeroById(this.heroId);
        if (!this.hero) {
            this.hero = await HeroProvider.fetchHeroById(this.heroId);
            if (this.hero) {
                HeroProvider.heroes.push(this.hero);
            }
        }
        if (this.hero) {
            const ratings = HeroProvider.getRatings(this.hero.id) || [];
            this.hero.averageRating = ratings.length > 0 
                ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length 
                : 0;
        }
        
        return this.hero;
    }

    async render() {
        await this.loadHeroData();
        
        if (!this.hero) {
            const html = `
                <div class="message error">
                    Super-héro non trouvé
                </div>
            `;
            setTimeout(() => {
                const appElement = document.getElementById('app');
                if (!appElement) return;
                appElement.innerHTML = html;
            }, 0);
            return html;
        }

        const isFav = HeroProvider.isFavorite(this.hero.id);
        const ratings = HeroProvider.getRatings(this.hero.id) || [];
        const avgRating = this.hero.averageRating || 0;
        const stats = this.hero.stats || {};
        const biography = this.hero.biography || {};
        const appearance = this.hero.appearance || {};
        const work = this.hero.work || {};
        const connections = this.hero.connections || {};

        const html = `
            <section class="hero-detail">
                <div class="hero-detail-header">
                    <a href="#/heroes" class="back-link">← Retour aux super-héros</a>
                </div>
                
                <div class="hero-detail-container">
                    <div class="hero-detail-image">
                        <img 
                            src="${getImageUrl(this.hero.image) || 'https://via.placeholder.com/400x500?text=No+Image'}"
                            alt="${this.hero.name}"
                            class="hero-main-image"
                            loading="lazy"
                        >
                        <button class="favorite-btn large ${isFav ? 'active' : ''}" 
                                data-hero-id="${this.hero.id}">
                            ♥ ${isFav ? 'Retiré des favoris' : 'Ajouter aux favoris'}
                        </button>
                    </div>

                    <div class="hero-detail-content">
                        <h1>${services_Utils.escapeHtml(this.hero.name)}</h1>
                        <p class="hero-alias">Alias: ${services_Utils.escapeHtml(this.hero.alias)}</p>
                        <p class="hero-publisher">Éditeur: ${services_Utils.escapeHtml(this.hero.publisher)}</p>

                        <div class="hero-stats">
                            <h2>Statistiques de Puissance</h2>
                            ${this.renderStats(stats)}
                        </div>

                        <div class="hero-info-sections">
                            ${this.renderBiographySection(biography)}
                            ${this.renderAppearanceSection(appearance)}
                            ${this.renderWorkSection(work)}
                            ${this.renderConnectionsSection(connections)}
                        </div>

                        <div class="rating-section">
                            <h2>Notation (${ratings.length > 0 ? ratings.length + ' avis' : 'Soyez le premier à noter'})</h2>
                            
                            ${avgRating > 0 ? `
                                <div class="rating-summary">
                                    <div class="average-rating">
                                        <span class="stars-big">${this.renderStars(avgRating)}</span>
                                        <span class="rating-number">${avgRating.toFixed(1)}/5</span>
                                    </div>
                                </div>
                            ` : ''}

                            <div class="rating-form">
                                <h3>Donnez votre avis</h3>
                                <div class="form-group">
                                    <label>Note:</label>
                                    <div class="rating-stars">
                                        ${[1, 2, 3, 4, 5].map(star => `
                                            <button class="star-btn" data-value="${star}">★</button>
                                        `).join('')}
                                    </div>
                                    <span id="selected-rating" class="selected-rating"></span>
                                </div>
                                <div class="form-group">
                                    <label>Commentaire:</label>
                                    <textarea id="rating-comment" 
                                              placeholder="Partagez votre avis..." 
                                              maxlength="200" 
                                              rows="3"></textarea>
                                </div>
                                <button id="submit-rating" class="btn btn-primary">Soumettre l'avis</button>
                            </div>

                            ${ratings.length > 0 ? `
                                <div class="ratings-list">
                                    <h3>Avis récents</h3>
                                    ${ratings.map((rating, idx) => `
                                        <div class="rating-item">
                                            <div class="rating-item-header">
                                                <span class="rating-stars-display">${this.renderStars(rating.score)}</span>
                                                <span class="rating-score">${rating.score}/5</span>
                                            </div>
                                            ${rating.comment ? `
                                                <p class="rating-comment">${services_Utils.escapeHtml(rating.comment)}</p>
                                            ` : ''}
                                            <span class="rating-date">${new Date(rating.date).toLocaleDateString('fr-FR')}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </section>
        `;

        setTimeout(() => {
            const appElement = document.getElementById('app');
            if (!appElement) return;
            appElement.innerHTML = html;

            const favBtn = appElement.querySelector('.favorite-btn');
            if (favBtn) {
                favBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const isFav = HeroProvider.toggleFavorite(this.hero);
                    favBtn.classList.toggle('active');
                    favBtn.textContent = isFav ? '♥ Retiré des favoris' : '♥ Ajouter aux favoris';
                });
            }

            let selectedRating = 0;
            const starBtns = appElement.querySelectorAll('.star-btn');
            const selectedRatingDisplay = appElement.querySelector('#selected-rating');

            starBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    selectedRating = parseInt(btn.dataset.value);
                    if (selectedRatingDisplay) {
                        selectedRatingDisplay.textContent = `${selectedRating}/5 sélectionné`;
                    }
                    starBtns.forEach((b, idx) => {
                        b.classList.toggle('active', idx < selectedRating);
                    });
                });
            });

            const submitBtn = appElement.querySelector('#submit-rating');
            if (submitBtn) {
                submitBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (selectedRating === 0) {
                        alert('Veuillez sélectionner une note');
                        return;
                    }

                    const commentElement = appElement.querySelector('#rating-comment');
                    const comment = commentElement ? commentElement.value : '';
                    HeroProvider.addRating(this.hero.id, selectedRating, comment);
                    
                    alert('Merci pour votre avis ! Recharger la page pour voir les changements.');
                    window.location.hash = `#/hero/${this.hero.id}`;
                });
            }

            const backLink = appElement.querySelector('.back-link');
            if (backLink) {
                backLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.location.hash = '#/heroes';
                });
            }

            this.initLazyLoading();
        }, 0);

        return html;
    }

    renderStats(stats) {
        const statLabels = {
            intelligence: 'Intelligence',
            strength: 'Force',
            speed: 'Vitesse',
            durability: 'Durabilité',
            power: 'Pouvoir',
            combat: 'Combat'
        };

        return Object.entries(stats).map(([key, value]) => `
            <div class="stat">
                <span class="stat-label">${statLabels[key] || key}</span>
                <div class="stat-bar">
                    <div class="stat-fill" style="width: ${value || 0}%">
                        <span class="stat-value">${value || 0}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 >= 0.5;
        let stars = '★'.repeat(fullStars);
        if (hasHalf) stars += '½';
        stars += '☆'.repeat(5 - Math.ceil(rating));
        return stars;
    }

    renderBiographySection(biography) {
        return `
            <div class="info-section biography-section">
                <h2>Biographie</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Nom complet:</span>
                        <span class="info-value">${services_Utils.escapeHtml(biography.fullName || '-')}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Alter-ego:</span>
                        <span class="info-value">${services_Utils.escapeHtml(biography.alterEgos || '-')}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Première apparition:</span>
                        <span class="info-value">${services_Utils.escapeHtml(biography.firstAppearance || '-')}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Lieu de naissance:</span>
                        <span class="info-value">${services_Utils.escapeHtml(biography.placeOfBirth || '-')}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Éditeur:</span>
                        <span class="info-value">${services_Utils.escapeHtml(biography.publisher || '-')}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Alignement:</span>
                        <span class="info-value">${services_Utils.escapeHtml(biography.alignment || '-')}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderAppearanceSection(appearance) {
        return `
            <div class="info-section appearance-section">
                <h2>Apparence</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Genre:</span>
                        <span class="info-value">${services_Utils.escapeHtml(appearance.gender || '-')}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Race:</span>
                        <span class="info-value">${services_Utils.escapeHtml(appearance.race || '-')}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Couleur des yeux:</span>
                        <span class="info-value">${services_Utils.escapeHtml(appearance.eyeColor || '-')}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Couleur des cheveux:</span>
                        <span class="info-value">${services_Utils.escapeHtml(appearance.hairColor || '-')}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Hauteur:</span>
                        <span class="info-value">${services_Utils.escapeHtml(appearance.height || '-')}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Poids:</span>
                        <span class="info-value">${services_Utils.escapeHtml(appearance.weight || '-')}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderWorkSection(work) {
        return `
            <div class="info-section work-section">
                <h2>Occupation</h2>
                <div class="info-grid">
                    <div class="info-item full-width">
                        <span class="info-label">Occupation:</span>
                        <span class="info-value">${services_Utils.escapeHtml(work.occupation || '-')}</span>
                    </div>
                    <div class="info-item full-width">
                        <span class="info-label">Base:</span>
                        <span class="info-value">${services_Utils.escapeHtml(work.base || '-')}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderConnectionsSection(connections) {
        return `
            <div class="info-section connections-section">
                <h2>Connexions</h2>
                <div class="info-grid">
                    <div class="info-item full-width">
                        <span class="info-label">Groupe d'affiliation:</span>
                        <span class="info-value">${services_Utils.escapeHtml(connections.groupAffiliation || '-')}</span>
                    </div>
                    <div class="info-item full-width">
                        <span class="info-label">Proches:</span>
                        <span class="info-value">${services_Utils.escapeHtml(connections.relatives || '-')}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Initialise le lazy loading des images de la page
     */
    initLazyLoading() {
        if ('IntersectionObserver' in window) {
            const appElement = document.getElementById('app');
            if (appElement) {
                services_ImageLoader.observeAll(appElement);
            }
        }
    }
}

/* harmony default export */ const pages_HeroDetail = (HeroDetail);

;// ./js/views/pages/Favorites.js





class Favorites {
    async render() {
        const favorites = HeroProvider.getFavoriteHeroes();

        if (favorites.length === 0) {
            const html = `
                <section class="favorites-section">
                    <h2>Mes Favoris</h2>
                    <div class="message info">
                        Vous n'avez pas encore de favoris.
                        <p><a href="#/heroes" class="link">Découvrez les super-héros</a></p>
                    </div>
                </section>
            `;
            setTimeout(() => {
                const appElement = document.getElementById('app');
                if (!appElement) return;
                appElement.innerHTML = html;
                this.attachFavoriteListeners();
                this.initLazyLoading();
            }, 0);
            return html;
        }

        let html = `
            <section class="favorites-section">
                <h2>Mes Favoris</h2>
                <p class="favorites-count">${favorites.length} super-héro${favorites.length > 1 ? 's' : ''}</p>
                <div class="heroes-grid">
        `;

        favorites.forEach(hero => {
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
                        <button class="favorite-btn active" 
                                data-hero-id="${hero.id}"
                                title="Retirer des favoris">
                            ♥
                        </button>
                    </div>
                    <div class="hero-card-body">
                        <h3>${services_Utils.escapeHtml(hero.name)}</h3>
                        <p class="hero-alias">${services_Utils.escapeHtml(hero.alias)}</p>
                        <p class="hero-publisher">${services_Utils.escapeHtml(hero.publisher)}</p>
                        
                        ${avgRating > 0 ? `
                            <div class="hero-rating">
                                <span class="stars">${this.renderStars(avgRating)}</span>
                                <span class="rating-value">${avgRating.toFixed(1)}/5</span>
                            </div>
                        ` : ''}
                        
                        <a href="#/hero/${hero.id}" class="btn btn-small">Détails</a>
                    </div>
                </article>
            `;
        });

        html += '</div></section>';

        setTimeout(() => {
            const appElement = document.getElementById('app');
            if (!appElement) return;
            appElement.innerHTML = html;
            this.attachFavoriteListeners();
        }, 0);

        return html;
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 >= 0.5;
        let stars = '★'.repeat(fullStars);
        if (hasHalf) stars += '½';
        stars += '☆'.repeat(5 - Math.ceil(rating));
        return stars;
    }

    attachFavoriteListeners() {
        const appElement = document.getElementById('app');
        appElement.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const heroId = parseInt(btn.dataset.heroId);
                const hero = HeroProvider.getHeroById(heroId);
                
                if (hero) {
                    HeroProvider.toggleFavorite(hero);
                    window.location.hash = '#/favorites';
                }
            });
        });
    }


    initLazyLoading() {
        if ('IntersectionObserver' in window) {
            const appElement = document.getElementById('app');
            if (appElement) {
                services_ImageLoader.reload();
                services_ImageLoader.observeAll(appElement);
            }
        } else {
            const images = document.querySelectorAll('img[data-src]');
            images.forEach(img => {
                img.src = img.dataset.src;
            });
        }
    }
}

/* harmony default export */ const pages_Favorites = (Favorites);

;// ./js/views/pages/Error404.js
class Error404 {
    render() {
        return `
            <section class="error-404">
                <div class="error-container">
                    <h1>404</h1>
                    <h2>Page non trouvée</h2>
                    <p>
                        Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
                    </p>
                    <div class="error-actions">
                        <a href="#/" class="btn btn-primary">Retour à l'accueil</a>
                        <a href="#/heroes" class="btn btn-secondary">Voir les super-héros</a>
                    </div>
                </div>
            </section>
        `;
    }
}

/* harmony default export */ const pages_Error404 = (Error404);

;// ./js/app.js













const routes = {
    '/': pages_Home,
    '/home': pages_Home,
    '/heroes': pages_HeroesList,
    '/heroes/:id': pages_HeroesList,
    '/hero/:id': pages_HeroDetail,
    '/favorites': pages_Favorites
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

    console.log(` ${config.app.name} v${config.app.version}`);

    const heroes = await HeroProvider.loadHeroes();
    HeroProvider.loadRatings();
    dataLoaded = true;

    console.log(` ${heroes.length} super-héros chargés`);
}


function app_navigate(path) {
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
            app_navigate(href);
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
                        📭 Aucun super-héro trouvé pour "${services_Utils.escapeHtml(query)}"
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
                <h2>Résultats pour "${services_Utils.escapeHtml(query)}"</h2>
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
                    <h3>${services_Utils.escapeHtml(hero.name)}</h3>
                    <p class="hero-publisher">${services_Utils.escapeHtml(hero.publisher)}</p>
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
        services_ImageLoader.reload();
        services_ImageLoader.observeAll(appElement);
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

    const debouncedSearch = services_Utils.debounce((query) => {
        performSearch(query);
    }, config.ui.debounceSearchDelay);

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (query.length === 0) {
            app_navigate('/heroes');
            return;
        }
        debouncedSearch(query);
    });
}


async function router() {
    initDomReferences();
    await ensureDataLoaded();

    if (!appElement) return;

    const request = services_Utils.parseRequestURL();


    let routeKey;
    if (!request.resource) {
        routeKey = '/';
    } else if (request.resource === 'hero' && request.id) {
        routeKey = '/hero/:id';
    } else {
        routeKey = `/${request.resource}`;
    }

    const PageClass = routes[routeKey] || pages_Error404;

    let pageInstance;
    if (PageClass === pages_HeroesList) {
        const pageNum = request.id || 1;
        const publisher = request.queryParams?.publisher || null;
        pageInstance = new pages_HeroesList(pageNum, publisher);
    } else if (PageClass === pages_HeroDetail) {
        const heroId = request.id;
        pageInstance = new pages_HeroDetail(heroId);
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

/******/ })()
;
//# sourceMappingURL=main.js.map