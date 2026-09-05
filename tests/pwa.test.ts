import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

void test('The installable app declares its icons and standalone entry point', async () => {
  const manifest = JSON.parse(
    await readFile('public/manifest.webmanifest', 'utf8'),
  );
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.ok(
    manifest.icons.some(
      (icon: { sizes: string; purpose?: string }) =>
        icon.sizes === '512x512' && icon.purpose?.includes('maskable'),
    ),
  );
});

void test('The service worker precaches the game shell and supports offline navigation', async () => {
  const worker = await readFile('public/service-worker.js', 'utf8');
  for (const marker of [
    'manifest.webmanifest',
    'art/garden.png',
    "event.request.mode === 'navigate'",
    'caches.match(ROOT)',
  ])
    assert.ok(worker.includes(marker));
});
