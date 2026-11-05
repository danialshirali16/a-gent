import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const base = 'http://127.0.0.1:4317';
const components = ['button', 'input', 'field', 'select', 'checkbox', 'tabs', 'tooltip', 'menu', 'popover', 'dialog', 'badge', 'avatar', 'alert', 'card', 'search', 'composer', 'message', 'sidebar'];
const output = 'docs/screenshots/components';
await mkdir(output, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
const page = await context.newPage();

async function expand() {
  await page.evaluate(() => {
    const preview = document.querySelector('.component-preview');
    if (preview) { preview.style.height = 'auto'; preview.style.overflow = 'visible'; }
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
  });
}

async function open(id) {
  await page.goto(`${base}/?component=${id}&theme=dark`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForSelector('.component-preview');
}

for (const theme of ['dark', 'light']) {
  for (const id of components) {
    if (id === 'avatar') await page.setViewportSize({ width: 1440, height: 3000 });
    await page.goto(`${base}/?component=${id}&theme=${theme}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForSelector('.component-preview');
    await expand();
    await page.waitForTimeout(id === 'avatar' ? 1500 : 0);
    await page.screenshot({ path: `${output}/${id}-${theme}.png`, fullPage: true });
    if (id === 'avatar') await page.setViewportSize({ width: 1440, height: 900 });
  }
}

// Interaction references.
await open('select');
await page.getByRole('combobox', { name: 'Model' }).first().click();
await page.getByRole('combobox', { name: 'Model' }).first().fill('claude');
await page.screenshot({ path: `${output}/select-combobox-dark.png`, fullPage: true });

await open('menu');
await page.getByRole('button', { name: 'Workspace' }).click();
await page.screenshot({ path: `${output}/menu-open-dark.png`, fullPage: true });

await open('popover');
await page.getByRole('button', { name: 'Filters' }).click();
await page.screenshot({ path: `${output}/popover-open-dark.png`, fullPage: true });

await open('dialog');
await page.getByRole('button', { name: 'Destructive confirmation' }).click();
await page.screenshot({ path: `${output}/dialog-confirm-dark.png`, fullPage: true });

await open('tooltip');
await page.getByRole('button', { name: 'Search conversations' }).hover();
await page.waitForTimeout(650);
await page.screenshot({ path: `${output}/tooltip-open-dark.png`, fullPage: true });

await open('composer');
await page.getByRole('button', { name: /Codex/ }).click();
await page.screenshot({ path: `${output}/composer-model-dark.png`, fullPage: true });

await open('sidebar');
await page.getByRole('button', { name: 'More workspace options' }).click();
await page.screenshot({ path: `${output}/sidebar-menu-dark.png`, fullPage: true });

await open('alert');
await page.getByRole('button', { name: 'Copy success' }).click();
await page.screenshot({ path: `${output}/alert-toast-dark.png`, fullPage: true });

// Mobile references.
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
const mobilePage = await mobile.newPage();
for (const id of ['field', 'select', 'checkbox', 'tabs', 'dialog', 'search', 'composer', 'sidebar', 'avatar']) {
  if (id === 'avatar') await mobilePage.setViewportSize({ width: 390, height: 2200 });
  await mobilePage.goto(`${base}/?component=${id}&theme=dark`, { waitUntil: 'networkidle' });
  await mobilePage.evaluate(() => document.fonts.ready);
  await mobilePage.waitForSelector('.component-preview');
  await mobilePage.evaluate(() => {
    const preview = document.querySelector('.component-preview');
    if (preview) { preview.style.height = 'auto'; preview.style.overflow = 'visible'; }
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
  });
  await mobilePage.waitForTimeout(id === 'avatar' ? 1500 : 0);
  await mobilePage.screenshot({ path: `${output}/${id}-mobile.png`, fullPage: true });
  if (id === 'avatar') await mobilePage.setViewportSize({ width: 390, height: 844 });
}

await browser.close();
console.log('Captured component previews in', output);
