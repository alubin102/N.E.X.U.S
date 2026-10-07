
import HeroProvider from '../../services/HeroProvider.js';
import Utils from '../../services/Utils.js';
import imageLoader, { getImageUrl } from '../../services/ImageLoader.js';

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
                        <h3>${Utils.escapeHtml(hero.name)}</h3>
                        <p class="hero-alias">${Utils.escapeHtml(hero.alias)}</p>
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
                imageLoader.reload();
                imageLoader.observeAll(appElement);
            }
        } else {
            const images = document.querySelectorAll('img[data-src]');
            images.forEach(img => {
                img.src = img.dataset.src;
            });
        }
    }
}

export default Favorites;
