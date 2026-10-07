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
        requestBatchSize: 4,
        requestRetries: 3,
        cacheVersion: 2
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

export default CONFIG;
