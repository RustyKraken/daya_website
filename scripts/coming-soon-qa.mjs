import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:5173/daya_website/';
const outputDir = path.resolve('output/coming-soon-qa');
await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = { viewports: [], interactions: {} };
const errors = [];
const sizes = [[375, 667], [390, 844], [768, 1024], [1440, 900], [1920, 1080], [320, 568], [844, 390]];

try {
  for (const [width, height] of sizes) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(`${baseURL}coming-soon/`);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(image => image.decode()));
    });
    const metrics = await page.evaluate(() => {
      const rect = selector => {
        const { x, y, width, height, bottom, right } = document.querySelector(selector).getBoundingClientRect();
        return { x, y, width, height, bottom, right };
      };
      return {
        viewport: [innerWidth, innerHeight],
        scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
        bodyScroll: [document.body.scrollWidth, document.body.scrollHeight],
        scene: rect('.coming-soon'),
        brand: rect('.coming-soon-brand'),
        location: rect('.coming-soon-location'),
        title: rect('h1'),
        signature: rect('.coming-soon-signature'),
        contact: rect('.coming-soon-connect'),
        copyright: rect('.coming-soon-copyright'),
        footer: rect('.coming-soon-footer'),
        rootOverflow: getComputedStyle(document.documentElement).overflow,
        bodyOverflow: getComputedStyle(document.body).overflow,
        titleFont: getComputedStyle(document.querySelector('h1')).fontFamily,
        footerBackground: getComputedStyle(document.querySelector('footer')).backgroundColor,
        imagesLoaded: [...document.images].every(image => image.complete && image.naturalWidth > 0),
        decorativePointerEvents: [...document.querySelectorAll('.pomegranate')].map(image => getComputedStyle(image).pointerEvents),
      };
    });
    assert.deepEqual(metrics.scroll, [width, height], `Document overflow at ${width}×${height}`);
    assert.deepEqual(metrics.bodyScroll, [width, height], `Body overflow at ${width}×${height}`);
    assert.equal(metrics.scene.height, height);
    assert.equal(metrics.rootOverflow, 'hidden');
    assert.equal(metrics.bodyOverflow, 'hidden');
    for (const key of ['brand', 'location', 'title', 'signature', 'contact', 'copyright', 'footer']) {
      const rect = metrics[key];
      assert.ok(rect.x >= -1 && rect.y >= -1 && rect.right <= width + 1 && rect.bottom <= height + 1,
        `${key} outside viewport at ${width}×${height}: ${JSON.stringify(rect)}`);
    }
    assert.ok(metrics.title.bottom <= metrics.footer.y);
    assert.ok(metrics.signature.right <= metrics.contact.x, 'Footer columns overlap');
    assert.match(metrics.titleFont, /Cormorant Garamond/);
    assert.equal(metrics.footerBackground, 'rgba(0, 0, 0, 0)');
    assert.ok(metrics.imagesLoaded);
    assert.ok(metrics.decorativePointerEvents.every(value => value === 'none'));
    assert.equal(await page.locator('form, input').count(), 0);
    await page.mouse.wheel(0, 1000);
    assert.equal(await page.evaluate(() => scrollY), 0);
    await page.screenshot({ path: path.join(outputDir, `${width}x${height}.png`) });
    report.viewports.push(metrics);
    await page.close();
  }

  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await page.goto(`${baseURL}coming-soon/`);
  const brand = page.getByRole('link', { name: 'DAYA home' });
  await page.keyboard.press('Tab');
  assert.equal(await brand.evaluate(el => document.activeElement === el), true);
  assert.notEqual(await brand.evaluate(el => getComputedStyle(el).outlineStyle), 'none');
  assert.equal(await brand.evaluate(el => getComputedStyle(el).transitionDuration), '0s');
  assert.equal(await page.getByRole('link', { name: 'Instagram', exact: true }).getAttribute('href'), 'https://www.instagram.com/dayaibiza/');
  assert.equal(await page.getByRole('link', { name: 'Get in touch', exact: true }).getAttribute('href'), 'mailto:hello@dayaibiza.com');
  report.interactions.links = 'Instagram and email destinations verified; logo keyboard focus visible';
  report.interactions.reducedMotion = 'transitions disabled';
  await brand.click();
  await page.getByRole('button', { name: 'Open navigation' }).waitFor();
  report.interactions.home = 'logo opens original homepage';
  await page.close();
  assert.deepEqual(errors, [], 'Browser errors');
  report.consoleErrors = errors;
  report.result = 'passed';
} finally {
  await fs.writeFile(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
console.log(JSON.stringify({ result: report.result, viewports: report.viewports.map(item => item.viewport), interactions: report.interactions, consoleErrors: report.consoleErrors }, null, 2));
