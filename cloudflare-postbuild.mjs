import fs from 'node:fs/promises';

const headers = `/*
  X-Content-Type-Options: nosniff

/
  Cache-Control: no-store

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`;

await fs.mkdir('dist', { recursive: true });
await fs.writeFile('dist/_headers', headers, 'utf8');
console.log('Cloudflare Pages headers written to dist/_headers');
