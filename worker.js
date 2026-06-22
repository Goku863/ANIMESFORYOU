// Cloudflare Worker — Miruro Pipe Proxy
// Handles CORS + proxies encrypted requests to miruro.tv

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Proxy pipe endpoint
    if (url.pathname === '/api/pipe') {
      try {
        const miruroUrl = `https://www.miruro.tv/api/secure/pipe${url.search}`;
        const res = await fetch(miruroUrl, {
          method: request.method,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Referer': 'https://www.miruro.tv/',
          },
        });
        const body = await res.text();
        return new Response(body, {
          status: res.status,
          headers: {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }
    }

    return new Response('Miruro Pipe Proxy', {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  },
};
