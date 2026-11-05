import { chromium } from '@playwright/test';

const base = 'http://127.0.0.1:4317';
const out = 'docs/screenshots/components';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
const page = await context.newPage();

async function go(id) {
  await page.goto(`${base}/?component=${id}&theme=dark`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForSelector('.component-preview');
}

await go('select');
await page.getByRole('combobox', { name: 'Model' }).first().click();
await page.getByRole('combobox', { name: 'Model' }).first().fill('claude');
await page.waitForTimeout(150);
await page.screenshot({ path: `${out}/select-combobox-dark.png` });

await go('menu');
await page.getByRole('button', { name: 'Workspace' }).click();
await page.waitForTimeout(150);
await page.screenshot({ path: `${out}/menu-open-dark.png` });

await go('popover');
await page.getByRole('button', { name: 'Filters' }).click();
await page.waitForTimeout(150);
await page.screenshot({ path: `${out}/popover-open-dark.png` });

await go('dialog');
await page.getByRole('button', { name: 'Destructive confirmation' }).click();
await page.waitForTimeout(150);
await page.screenshot({ path: `${out}/dialog-confirm-dark.png` });

await go('tooltip');
await page.evaluate(() => { const el = document.querySelector('.component-preview'); if (el) el.scrollTop = 150; });
await page.getByRole('button', { name: 'Search conversations' }).hover();
await page.waitForTimeout(650);
await page.screenshot({ path: `${out}/tooltip-open-dark.png` });

await go('composer');
await page.locator('.reason-model-pill').click();
await page.waitForTimeout(200);
await page.screenshot({ path: `${out}/composer-model-dark.png` });

await go('sidebar');
await page.getByRole('button', { name: 'More workspace options' }).click();
await page.waitForTimeout(150);
await page.screenshot({ path: `${out}/sidebar-menu-dark.png` });

await go('alert');
await page.getByRole('button', { name: 'Copy success' }).click();
await page.waitForTimeout(150);
await page.screenshot({ path: `${out}/alert-toast-dark.png` });

await go('search');
await page.getByRole('searchbox', { name: 'Search conversations' }).fill('zzz');
await page.waitForTimeout(150);
await page.screenshot({ path: `${out}/search-empty-dark.png` });

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
const mp = await mobile.newPage();
async function mobileGo(id) {
  await mp.goto(`${base}/?component=${id}&theme=dark`, { waitUntil: 'networkidle' });
  await mp.evaluate(() => document.fonts.ready);
  await mp.waitForSelector('.component-preview');
  await mp.evaluate(() => {
    const preview = document.querySelector('.component-preview');
    if (preview) { preview.style.height = 'auto'; preview.style.overflow = 'visible'; }
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
  });
}
for (const id of ['composer', 'sidebar']) {
  await mobileGo(id);
  await mp.screenshot({ path: `${out}/${id}-mobile.png`, fullPage: true });
}
await mobileGo('dialog');
await mp.getByRole('button', { name: 'Destructive confirmation' }).click();
await mp.screenshot({ path: `${out}/dialog-mobile.png` });
await mobileGo('select');
await mp.getByRole('combobox', { name: 'Model' }).first().click();
await mp.screenshot({ path: `${out}/select-combobox-mobile.png` });

await browser.close();
console.log('Captured interaction previews.');
