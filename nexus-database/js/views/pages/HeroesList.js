import HeroProvider from '../../services/HeroProvider.js';
import Utils from '../../services/Utils.js';
import imageLoader, { getImageUrl } from '../../services/ImageLoader.js';

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

        const pagination = Utils.paginate(this.filteredHeroes, this.page, this.pageSize);
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
        return html;
    }

    // Appelé par le routeur une fois le HTML inséré dans la page
    afterRender() {
        const appElement = document.getElementById('app');
        if (!appElement) return;

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
                imageLoader.reload();
                imageLoader.observeAll(appElement);
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

export default HeroesList;
