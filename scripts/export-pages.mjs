import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = dirname(dirname(fileURLToPath(import.meta.url)));
const client = join(project, 'dist', 'client');
const output = join(project, 'docs');

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(client, output, {
  recursive: true,
  filter(source) {
    const name = source.slice(client.length).replace(/^\//, '');
    return !['.vite', '.assetsignore', '_headers'].some(
      (excluded) => name === excluded || name.startsWith(`${excluded}/`),
    );
  },
});

for (const file of ['index.html', '404.html']) {
  const path = join(output, file);
  const html = (await readFile(path, 'utf8'))
    .replaceAll('"/_next/', '"./_next/')
    .replaceAll('href="/manifest.webmanifest"', 'href="manifest.webmanifest"')
    .replaceAll('href="/favicon.svg"', 'href="favicon.svg"')
    .replaceAll('href="/icon-192.png"', 'href="icon-192.png"')
    .replaceAll('href="/apple-touch-icon.png"', 'href="apple-touch-icon.png"');
  await writeFile(path, html);
}

const cssDirectory = join(output, '_next', 'static', 'css');
for (const file of await readdir(cssDirectory)) {
  if (!file.endsWith('.css')) continue;
  const path = join(cssDirectory, file);
  const css = (await readFile(path, 'utf8'))
    .replaceAll("url('/art/", "url('../../../art/")
    .replaceAll('url(/art/', 'url(../../../art/');
  await writeFile(path, css);
}

await writeFile(join(output, '.nojekyll'), '');
console.log(`Version GitHub Pages prête dans ${output}`);
