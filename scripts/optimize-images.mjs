import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Pass a source directory to regenerate from archived originals.
const sourceDir = path.resolve(process.argv[2] || 'public/media');
const targetDir = path.resolve('public/media');
const images = (await fs.readdir(sourceDir)).filter(name => /\.(png|jpe?g|webp)$/i.test(name));
assert.ok(images.length > 0, 'No source images found. To use the local backup, run: npm run optimize:images -- output/original-images');
const report = [];

for (const name of images) {
  const source = path.join(sourceDir, name);
  const output = path.join(targetDir, `${path.parse(name).name}.avif`);
  const original = await sharp(source).metadata();
  const isLogo = /(?:icon|wordmark)/.test(name);
  await sharp(source)
    .avif({ quality: isLogo ? 85 : 65, effort: 6, chromaSubsampling: '4:4:4' })
    .toFile(output);
  const converted = await sharp(output).metadata();
  assert.equal(converted.width, original.width, `${name}: width changed`);
  assert.equal(converted.height, original.height, `${name}: height changed`);
  assert.equal(converted.hasAlpha, original.hasAlpha, `${name}: transparency changed`);
  await sharp(output).raw().toBuffer();
  const before = (await fs.stat(source)).size;
  const after = (await fs.stat(output)).size;
  assert.ok(after < before, `${name}: AVIF must be smaller than the original`);
  report.push({ name, width: original.width, height: original.height, alpha: original.hasAlpha, before, after });
  console.log(`${name}: ${(before / 1024).toFixed(1)} → ${(after / 1024).toFixed(1)} KB`);
}

const before = report.reduce((sum, item) => sum + item.before, 0);
const after = report.reduce((sum, item) => sum + item.after, 0);
await fs.mkdir('output', { recursive: true });
await fs.writeFile('output/image-optimization.json', JSON.stringify({ images: report, before, after }, null, 2));
console.log(`Total: ${(before / 1e6).toFixed(2)} → ${(after / 1e6).toFixed(2)} MB (${before ? ((1 - after / before) * 100).toFixed(1) : 0}% smaller)`);
