import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const distDir = path.resolve('dist');
const previewOrigin = process.env.PREVIEW_ORIGIN || 'http://127.0.0.1:4173';
const textExtensions = new Set(['.html', '.css', '.js', '.json', '.xml', '.txt', '.webmanifest']);
const forbiddenRepositoryBase = `/${['daya', 'website'].join('_')}/`;

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  }));
  return nested.flat();
}

const files = await walk(distDir);
const textFiles = files.filter((file) => textExtensions.has(path.extname(file)));
const rootReferences = new Set();

for (const file of textFiles) {
  const content = await fs.readFile(file, 'utf8');
  assert.equal(content.includes(forbiddenRepositoryBase), false, `Repository path remains in ${file}`);

  for (const match of content.matchAll(/(?:src|href)=["'](\/[^"']+)["']/g)) rootReferences.add(match[1]);
  for (const match of content.matchAll(/url\(["']?(\/[^)'"\s]+)["']?\)/g)) rootReferences.add(match[1]);
}

for (const reference of rootReferences) {
  const cleanPath = reference.split(/[?#]/, 1)[0];
  const diskPath = path.join(distDir, cleanPath.replace(/^\//, ''));
  assert.ok(await fs.stat(diskPath).then(() => true, () => false), `Missing built asset: ${reference}`);
}

assert.equal((await fs.readFile(path.join(distDir, 'CNAME'), 'utf8')).trim(), 'dayaibiza.com');

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const pages = [];

try {
  for (const pathname of ['/', '/coming-soon/']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    await page.route('**/*', (route) => {
      const requestURL = route.request().url();
      return requestURL.startsWith(previewOrigin) ? route.continue() : route.abort();
    });
    page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
    page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
    page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });

    const response = await page.goto(`${previewOrigin}${pathname}`, { waitUntil: 'networkidle' });
    const result = {
      pathname,
      status: response.status(),
      title: await page.title(),
      mounted: await page.locator('#root > *').count() > 0,
      errors,
    };
    assert.equal(result.status, 200);
    assert.equal(result.mounted, true);
    assert.deepEqual(result.errors, []);
    pages.push(result);
    await page.close();
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify({ rootReferences: [...rootReferences].sort(), pages }, null, 2));
