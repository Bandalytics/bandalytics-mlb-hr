const SLATE_CACHE_ORIGIN = 'https://bandalytics-v88-direct-coverage.vercel.app';

export async function onRequest(context) {
  const incoming = new URL(context.request.url);
  const target = new URL('/slate-cache' + incoming.search, SLATE_CACHE_ORIGIN);

  const headers = new Headers(context.request.headers);
  headers.delete('host');
  headers.set('x-bandalytics-edge-bridge', 'cloudflare-pages-v1');

  const upstream = await fetch(target.toString(), {
    method: context.request.method,
    headers,
    redirect: 'manual'
  });

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: upstream.headers
  });
}
