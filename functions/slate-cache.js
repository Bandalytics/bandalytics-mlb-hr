const ORIGIN='https://bandalytics-v88-direct-coverage.vercel.app/slate-cache';

export async function onRequest(context){
  const incoming=new URL(context.request.url);
  const target=new URL(ORIGIN);
  target.search=incoming.search;
  const headers=new Headers(context.request.headers);
  headers.delete('host');
  headers.set('x-bandalytics-edge-bridge','cloudflare-pages-v2');
  const upstream=await fetch(target.toString(),{method:context.request.method,headers,redirect:'manual'});
  const outHeaders=new Headers(upstream.headers);
  outHeaders.set('x-bandalytics-api-origin','vercel-transition');
  return new Response(upstream.body,{status:upstream.status,statusText:upstream.statusText,headers:outHeaders});
}
