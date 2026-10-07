import HeroProvider from '../../services/HeroProvider.js';
import Utils from '../../services/Utils.js';
import imageLoader, { getImageUrl } from '../../services/ImageLoader.js';

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
                        <h1>${Utils.escapeHtml(this.hero.name)}</h1>
                        <p class="hero-alias">Alias: ${Utils.escapeHtml(this.hero.alias)}</p>
                        <p class="hero-publisher">Éditeur: ${Utils.escapeHtml(this.hero.publisher)}</p>

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
                                                <p class="rating-comment">${Utils.escapeHtml(rating.comment)}</p>
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
                        <span class="info-value">${Utils.escapeHtml(biography.fullName || '-')}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Alter-ego:</span>
                        <span class="info-value">${Utils.escapeHtml(biography.alterEgos || '-')}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Première apparition:</span>
                        <span class="info-value">${Utils.escapeHtml(biography.firstAppearance || '-')}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Lieu de naissance:</span>
                        <span class="info-value">${Utils.escapeHtml(biography.placeOfBirth || '-')}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Éditeur:</span>
                        <span class="info-value">${Utils.escapeHtml(biography.publisher || '-')}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Alignement:</span>
                        <span class="info-value">${Utils.escapeHtml(biography.alignment || '-')}</span>
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
                        <span class="info-value">${Utils.escapeHtml(appearance.gender || '-')}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Race:</span>
                        <span class="info-value">${Utils.escapeHtml(appearance.race || '-')}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Couleur des yeux:</span>
                        <span class="info-value">${Utils.escapeHtml(appearance.eyeColor || '-')}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Couleur des cheveux:</span>
                        <span class="info-value">${Utils.escapeHtml(appearance.hairColor || '-')}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Hauteur:</span>
                        <span class="info-value">${Utils.escapeHtml(appearance.height || '-')}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Poids:</span>
                        <span class="info-value">${Utils.escapeHtml(appearance.weight || '-')}</span>
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
                        <span class="info-value">${Utils.escapeHtml(work.occupation || '-')}</span>
                    </div>
                    <div class="info-item full-width">
                        <span class="info-label">Base:</span>
                        <span class="info-value">${Utils.escapeHtml(work.base || '-')}</span>
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
                        <span class="info-value">${Utils.escapeHtml(connections.groupAffiliation || '-')}</span>
                    </div>
                    <div class="info-item full-width">
                        <span class="info-label">Proches:</span>
                        <span class="info-value">${Utils.escapeHtml(connections.relatives || '-')}</span>
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
                imageLoader.observeAll(appElement);
            }
        }
    }
}

export default HeroDetail;
