export function getImageUrl(url) {
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

export default imageLoader;
