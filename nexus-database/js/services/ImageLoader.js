export function getImageUrl(url) {
    if (!url || !url.startsWith('https://www.superherodb.com/')) {
        return url;
    }

    return `/api/image?url=${encodeURIComponent(url)}`;
}

// Le téléchargement lui-même est laissé au navigateur (loading="lazy" : seules les
// images proches de l'écran sont demandées). Ce service ne fait que suivre l'état de
// chaque <img> pour appliquer les classes d'animation et l'image de secours, sans
// jamais demander une image une seconde fois.
class ImageLoader {
    constructor(options = {}) {
        this.options = {
            placeholderColor: options.placeholderColor || '#f0f0f0',
            ...options
        };

        this.tracked = new WeakSet();
    }

    loadImage(img) {
        if (this.tracked.has(img)) return;
        this.tracked.add(img);

        const src = getImageUrl(img.dataset.src || img.getAttribute('data-src'));
        const srcset = img.dataset.srcset || img.getAttribute('data-srcset');

        if (!img.getAttribute('src')) {
            if (!src) return;
            img.src = src;
        }
        if (srcset) {
            img.srcset = srcset;
        }

        if (img.complete && img.naturalWidth > 0) {
            this.markLoaded(img);
            return;
        }

        img.classList.add('lazy-loading');

        const onLoad = () => {
            img.removeEventListener('error', onError);
            this.markLoaded(img);
        };
        const onError = () => {
            img.removeEventListener('load', onLoad);
            this.setFallbackImage(img);
            img.dispatchEvent(new Event('lazyloaderror'));
        };

        img.addEventListener('load', onLoad, { once: true });
        img.addEventListener('error', onError, { once: true });
    }

    markLoaded(img) {
        img.classList.remove('lazy-loading');
        img.classList.add('lazy-loaded');
        img.dispatchEvent(new Event('lazyloaded'));
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
            this.loadImage(img);
        }
    }

    observeAll(container = document) {
        const lazyImages = container.querySelectorAll('img[data-src], img.lazy-load');
        lazyImages.forEach(img => this.observe(img));
    }

    unobserve(img) {
        this.tracked.delete(img);
    }

    disconnect() {
        this.tracked = new WeakSet();
    }

    reload() {
        this.observeAll();
    }
}

const imageLoader = new ImageLoader();

export default imageLoader;
