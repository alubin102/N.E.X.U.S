// Les portraits ne changent jamais d'URL : ils sont gardés 30 jours par le navigateur
// et par le cache Cloudflare.
const IMAGE_TTL = 2592000;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/image') {
      const imageUrl = url.searchParams.get('url');

      if (!imageUrl) {
        return new Response('Missing image URL', { status: 400 });
      }

      let upstreamUrl;
      try {
        upstreamUrl = new URL(imageUrl);
      } catch {
        return new Response('Invalid image URL', { status: 400 });
      }

      if (
        upstreamUrl.protocol !== 'https:' ||
        upstreamUrl.hostname !== 'www.superherodb.com'
      ) {
        return new Response('Image host is not allowed', { status: 403 });
      }

      // Cache edge : une image déjà servie repart sans nouvel appel à superherodb
      const useCache = request.method === 'GET' && typeof caches !== 'undefined';
      if (useCache) {
        try {
          const cached = await caches.default.match(request);
          if (cached) return cached;
        } catch {
          // cache indisponible : on continue vers l'amont
        }
      }

      let upstreamResponse;
      try {
        upstreamResponse = await fetch(upstreamUrl, {
          cf: { cacheEverything: true, cacheTtl: IMAGE_TTL },
        });
      } catch {
        return new Response('Unable to fetch image', { status: 502 });
      }

      if (!upstreamResponse.ok) {
        return new Response('Image unavailable', { status: upstreamResponse.status });
      }

      const contentType = upstreamResponse.headers.get('Content-Type') || '';
      if (!contentType.startsWith('image/')) {
        // Réponse inattendue : comportement d'origine, sans mise en cache longue
        const headers = new Headers(upstreamResponse.headers);
        headers.set('Cache-Control', 'public, max-age=86400');
        headers.set('Cross-Origin-Resource-Policy', 'same-origin');

        return new Response(upstreamResponse.body, {
          status: upstreamResponse.status,
          headers,
        });
      }

      // On ne renvoie que les en-têtes utiles : ceux de l'amont (cookies, Vary, ...)
      // empêcheraient la mise en cache.
      const headers = new Headers();
      headers.set('Content-Type', contentType);
      for (const name of ['Content-Length', 'ETag', 'Last-Modified']) {
        const value = upstreamResponse.headers.get(name);
        if (value) headers.set(name, value);
      }
      headers.set('Cache-Control', `public, max-age=${IMAGE_TTL}, immutable`);
      headers.set('Cross-Origin-Resource-Policy', 'same-origin');

      const response = new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        headers,
      });

      if (useCache && upstreamResponse.status === 200) {
        // la mise en cache est un bonus, jamais bloquante
        ctx.waitUntil(caches.default.put(request, response.clone()).catch(() => {}));
      }

      return response;
    }

    return env.ASSETS.fetch(request);
  },
};
