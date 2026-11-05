import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const page = await context.newPage();
await page.goto('http://127.0.0.1:4317/?component=search&theme=light', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForSelector('.component-preview');

const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa']).analyze();
console.log('axe search preview', axe.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })));

const input = page.getByRole('searchbox', { name: 'Search conversations' });
await input.click();
await page.keyboard.press('ArrowDown');
console.log('arrow down', await page.evaluate(() => ({ active: document.activeElement?.textContent?.slice(0, 60), cls: document.activeElement?.className })));
await page.keyboard.press('ArrowUp');
console.log('arrow up', await page.evaluate(() => ({ active: document.activeElement?.textContent?.slice(0, 60), cls: document.activeElement?.className })));

await input.fill('design');
console.log('filtered count', await page.locator('.ui-search-result').count());
const clear = page.getByRole('button', { name: 'Clear search' }).first();
console.log('clear visible', await clear.isVisible());
await clear.click();
console.log('cleared', await input.inputValue(), 'focused', await input.evaluate(el => el === document.activeElement));

const metrics = await page.evaluate(() => {
  const field = document.querySelector('.ui-search');
  const clear = document.querySelector('.ui-search-clear');
  return { fieldHeight: field?.getBoundingClientRect().height, clearWidth: clear?.getBoundingClientRect().width, clearHeight: clear?.getBoundingClientRect().height };
});
console.log('desktop metrics', metrics);

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
const mp = await mobile.newPage();
await mp.goto('http://127.0.0.1:4317/?component=search&theme=light', { waitUntil: 'networkidle' });
await mp.getByRole('searchbox', { name: 'Search conversations' }).fill('design');
console.log('mobile metrics', await mp.evaluate(() => {
  const field = document.querySelector('.ui-search');
  const clear = document.querySelector('.ui-search-clear');
  const result = document.querySelector('.ui-search-result');
  return { fieldHeight: field?.getBoundingClientRect().height, clearWidth: clear?.getBoundingClientRect().width, clearHeight: clear?.getBoundingClientRect().height, resultHeight: result?.getBoundingClientRect().height, overflow: document.documentElement.scrollWidth <= innerWidth };
}));

await browser.close();
