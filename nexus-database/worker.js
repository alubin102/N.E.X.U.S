export default {
  async fetch(request, env) {
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

      let upstreamResponse;
      try {
        upstreamResponse = await fetch(upstreamUrl, {
          cf: { cacheEverything: true, cacheTtl: 86400 },
        });
      } catch {
        return new Response('Unable to fetch image', { status: 502 });
      }

      if (!upstreamResponse.ok) {
        return new Response('Image unavailable', { status: upstreamResponse.status });
      }

      const headers = new Headers(upstreamResponse.headers);
      headers.set('Cache-Control', 'public, max-age=86400');
      headers.set('Cross-Origin-Resource-Policy', 'same-origin');

      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        headers,
      });
    }

    return env.ASSETS.fetch(request);
  },
};
