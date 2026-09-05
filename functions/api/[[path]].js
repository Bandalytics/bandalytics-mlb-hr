const API_ORIGIN = 'https://bandalytics-mlb-hr.vercel.app';

export async function onRequest(context) {
  const incoming = new URL(context.request.url);
  const target = new URL(incoming.pathname + incoming.search, API_ORIGIN);

  const headers = new Headers(context.request.headers);
  headers.delete('host');
  headers.set('x-bandalytics-edge-bridge', 'cloudflare-pages-v1');

  const init = {
    method: context.request.method,
    headers,
    redirect: 'manual'
  };

  if (!['GET', 'HEAD'].includes(context.request.method)) {
    init.body = context.request.body;
  }

  const upstream = await fetch(target.toString(), init);
  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.set('x-bandalytics-api-origin', 'vercel-transition');

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders
  });
}
