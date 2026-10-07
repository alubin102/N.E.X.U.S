import CONFIG from '../config.js';

export default class HeroProvider {
    static apiKey = CONFIG.api.apiKey;
    static baseUrl = CONFIG.api.baseUrl;
    static heroes = [];
    static ratingsKey = 'hero_ratings';
    static favoritesKey = 'hero_favorites';
    static favorites = HeroProvider.loadFavorites();
    static loadingPromise = null;

    static loadFromCache() {
        try {
            const data = localStorage.getItem('hero_cache');
            const cached = data ? JSON.parse(data) : null;
            const heroes = cached?.version === CONFIG.api.cacheVersion
                ? cached.heroes
                : null;
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
            localStorage.setItem('hero_cache', JSON.stringify({
                version: CONFIG.api.cacheVersion,
                heroes
            }));
        } catch (e) {
        }
    }

    static async loadHeroes() {
        if (HeroProvider.loadingPromise) {
            return HeroProvider.loadingPromise;
        }

        HeroProvider.loadingPromise = HeroProvider.loadHeroesOnce();
        try {
            return await HeroProvider.loadingPromise;
        } finally {
            HeroProvider.loadingPromise = null;
        }
    }

    static async loadHeroesOnce() {
        let apiHeroes = HeroProvider.loadFromCache();

        if (apiHeroes === null) {
            apiHeroes = await HeroProvider.fetchAllApiHeroes();
            const expectedHeroCount = CONFIG.api.maxHeroId || 731;
            if (apiHeroes && apiHeroes.length >= expectedHeroCount * 0.9) {
                HeroProvider.saveToCache(apiHeroes);
            } else if (apiHeroes) {
                console.warn(`Chargement incomplet: ${apiHeroes.length}/${expectedHeroCount} super-héros`);
            }
        }

        HeroProvider.heroes = apiHeroes || [];
        return HeroProvider.heroes;
    }

    static async fetchAllApiHeroes() {
        const maxHeroId = CONFIG.api.maxHeroId || 731;
        const batchSize = CONFIG.api.requestBatchSize || 8;
        const retries = CONFIG.api.requestRetries || 3;
        const heroes = [];

        for (let start = 1; start <= maxHeroId; start += batchSize) {
            const end = Math.min(start + batchSize - 1, maxHeroId);
            const ids = Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
            const batch = await Promise.all(
                ids.map(id => HeroProvider.fetchHeroById(id, retries))
            );
            batch.forEach(hero => {
                if (hero) heroes.push(hero);
            });
            if (end < maxHeroId) {
                await new Promise(resolve => {
                    setTimeout(resolve, CONFIG.api.requestDelay || 300);
                });
            }
        }

        return heroes;
    }

    static async fetchHeroById(id, retries = 0) {
        for (let attempt = 0; attempt <= retries; attempt += 1) {
            try {
                const response = await fetch(`${HeroProvider.baseUrl}/${HeroProvider.apiKey}/${id}`);
                if (response.ok) {
                    const apiHero = await response.json();
                    if (apiHero?.response === 'success') {
                        return HeroProvider.normalizeHero(apiHero);
                    }

                    if (attempt === retries) return null;
                }

                if (!response.ok && response.status < 500 && response.status !== 429) {
                    return null;
                }
            } catch (error) {
                if (attempt === retries) return null;
            }

            await new Promise(resolve => {
                setTimeout(resolve, 250 * (attempt + 1));
            });
        }

        return null;
    }

    static normalizeHero(apiHero) {
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
