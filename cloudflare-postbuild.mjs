import fs from 'node:fs/promises';

const headers = `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/
  Cache-Control: no-store

/mobile
  Cache-Control: no-store

/mobile.html
  Cache-Control: no-store

/bandalytics-mobile-v7.html
  Cache-Control: no-store

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`;

const redirects = `/mobile /mobile.html 200\n`;

await fs.mkdir('dist', { recursive: true });
await fs.writeFile('dist/_headers', headers, 'utf8');
await fs.writeFile('dist/_redirects', redirects, 'utf8');
console.log('Cloudflare Pages headers + mobile routing written');
