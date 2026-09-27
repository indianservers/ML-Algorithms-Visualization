import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve('public/ai-algorithms');
const catalog = readFileSync('src/features/ai-virtual-labs/catalog.ts', 'utf8');
const entries = [...catalog.matchAll(/\{ slug: '([^']+)', title: '([^']+)', summary: '([^']+)', bundle: '([^']+)', sourceKey: '([^']+)' \}/g)];
if (entries.length !== 24) throw new Error(`Expected 24 AI labs, found ${entries.length}`);
if (new Set(entries.map(([, slug]) => slug)).size !== 24) throw new Error('Duplicate AI lab slug');

for (const [, slug, , , bundle, sourceKey] of entries) {
  const file = path.join(root, bundle, 'index.html');
  if (!existsSync(file)) throw new Error(`${slug}: missing ${file}`);
  const html = readFileSync(file, 'utf8');
  if (/Phase [1-8]|https?:\/\//.test(html)) throw new Error(`${slug}: development title or remote dependency`);
  if (!html.includes('lab-runtime.js') || !html.includes('production-embed.js'))
    throw new Error(`${slug}: missing lifecycle scripts`);
  for (const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (!existsSync(path.resolve(path.dirname(file), url.split('?')[0])))
      throw new Error(`${slug}: missing ${url}`);
  }
  if (!sourceKey) throw new Error(`${slug}: missing source key`);
}

console.log('AI virtual lab asset audit passed: 24 native routes and offline bundles.');
