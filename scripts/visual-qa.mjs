import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const outputDir = path.resolve('output/qa');
const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
});

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 900, height: 1100 },
  { name: 'mobile', width: 390, height: 844 },
];

await fs.mkdir(outputDir, { recursive: true });
const report = {};

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    reducedMotion: 'no-preference',
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const errors = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(`console: ${message.text()}`);
      console.error(`[${viewport.name}] ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => {
    errors.push(`page: ${error.message}`);
    console.error(`[${viewport.name}] ${error.message}`);
  });

  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outputDir, `${viewport.name}-01-hero.png`) });
  const heroVideo = await page.locator('.hero-video').evaluate((video) => ({
    readyState: video.readyState,
    paused: video.paused,
    videoWidth: video.videoWidth,
    videoHeight: video.videoHeight,
  }));

  const menuButton = page.getByRole('button', { name: 'Open navigation' });
  if (await menuButton.count() !== 1) {
    throw new Error(`DAYA did not mount at ${viewport.name}. Captured errors: ${errors.join(' | ')}`);
  }
  await menuButton.click();
  await page.waitForTimeout(850);
  await page.screenshot({ path: path.join(outputDir, `${viewport.name}-02-menu.png`) });
  const menuOpen = await page.locator('.menu-overlay').getAttribute('data-open');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(850);
  const focusReturned = await menuButton.evaluate((element) => document.activeElement === element);
  await menuButton.click();
  await page.waitForTimeout(850);
  await page.getByRole('link', { name: 'Gallery', exact: true }).click();
  await page.waitForTimeout(900);
  const navigationState = await page.evaluate(() => ({
    menuOpen: document.querySelector('.menu-overlay').dataset.open,
    scrollY: Math.round(window.scrollY),
    galleryTop: document.querySelector('.gallery-intro').offsetTop,
    focusReturnedToHero: document.activeElement === document.querySelector('.menu-trigger'),
  }));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);

  const dimensions = await page.evaluate(() => {
    const intro = document.querySelector('.gallery-intro');
    const grid = document.querySelector('.gallery-grid-section');
    return {
      introTop: intro.offsetTop,
      introHeight: intro.offsetHeight,
      gridTop: grid.offsetTop,
      viewportHeight: window.innerHeight,
    };
  });

  const scrollStops = [
    { name: '03-gallery-entry', y: dimensions.introTop + dimensions.introHeight * 0.05 },
    { name: '04-gallery-float', y: dimensions.introTop + dimensions.introHeight * 0.42 },
    { name: '05-gallery-split', y: dimensions.introTop + dimensions.introHeight * 0.88 },
    { name: '06-gallery-grid', y: dimensions.gridTop + 40 },
  ];

  const states = [];
  for (const stop of scrollStops) {
    await page.evaluate((y) => window.scrollTo(0, y), stop.y);
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(outputDir, `${viewport.name}-${stop.name}.png`) });
    states.push(await page.evaluate((name) => {
      const gal = document.querySelector('.title-gal').getBoundingClientRect();
      const lery = document.querySelector('.title-lery').getBoundingClientRect();
      return {
        name,
        scrollY: Math.round(window.scrollY),
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        gal: { left: Math.round(gal.left), right: Math.round(gal.right) },
        lery: { left: Math.round(lery.left), right: Math.round(lery.right) },
      };
    }, stop.name));
  }

  report[viewport.name] = {
    viewport,
    errors,
    menuOpen,
    focusReturned,
    navigationState,
    heroVideo,
    states,
  };

  await context.close();
}

const reducedContext = await browser.newContext({
  viewport: { width: 390, height: 844 },
  reducedMotion: 'reduce',
});
const reducedPage = await reducedContext.newPage();
const reducedErrors = [];
reducedPage.on('console', (message) => {
  if (message.type() === 'error') reducedErrors.push(`console: ${message.text()}`);
});
reducedPage.on('pageerror', (error) => reducedErrors.push(`page: ${error.message}`));
await reducedPage.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
await reducedPage.locator('.gallery-intro').scrollIntoViewIfNeeded();
await reducedPage.waitForTimeout(400);
await reducedPage.screenshot({ path: path.join(outputDir, 'mobile-reduced-motion.png') });
report.reducedMotion = await reducedPage.evaluate(() => ({
  errors: [],
  overflow: document.documentElement.scrollWidth - window.innerWidth,
  introHeight: document.querySelector('.gallery-intro').offsetHeight,
  viewportHeight: window.innerHeight,
  floatsVisible: [...document.querySelectorAll('.floating-image')].some(
    (image) => getComputedStyle(image).display !== 'none',
  ),
  galleryGridPresent: Boolean(document.querySelector('.gallery-grid')),
}));
report.reducedMotion.errors = reducedErrors;
await reducedContext.close();

await fs.writeFile(path.join(outputDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
await browser.close();
console.log(JSON.stringify(report, null, 2));
