export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Try fetching the static asset from Cloudflare Assets
    let response = await env.ASSETS.fetch(request);

    // If the asset exists, return it directly
    if (response.status !== 404) {
      return response;
    }

    // If it's a request for a static file (has extension like .js, .css, .png, .ico, .map, etc.)
    // and it was not found, return a proper 404 instead of falling back to index.html
    const hasExtension = /\.[a-zA-Z0-9]+$/.test(pathname);
    if (hasExtension) {
      return new Response('Not Found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    // For SPA client-side routes (no file extension), serve index.html
    return env.ASSETS.fetch(new Request(new URL('/', request.url), request));
  }
};
