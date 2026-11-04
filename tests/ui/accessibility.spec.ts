import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';

const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];

async function audit(page: Page, testInfo: TestInfo, label: string, include?: string) {
  let builder = new AxeBuilder({ page }).withTags(tags);
  if (include) builder = builder.include(include);
  const results = await builder.analyze();
  await testInfo.attach(`axe-${label}.json`, { body: JSON.stringify(results, null, 2), contentType: 'application/json' });
  const serious = results.violations.filter(violation => violation.impact === 'serious' || violation.impact === 'critical');
  console.log(`axe ${label}: ${results.violations.length} violation(s), ${serious.length} serious/critical`);
  for (const violation of results.violations) console.log(`  ${violation.id} (${violation.impact ?? 'unknown'}) × ${violation.nodes.length}`);
  const details = serious.map(violation => `${violation.id} (${violation.impact}): ${violation.help}\n${violation.nodes.map(node => `  ${node.target.join(' ')}: ${(node.failureSummary ?? '').split('\n').filter(Boolean).at(-1) ?? ''}`).join('\n')}`).join('\n\n');
  expect(serious.length, details).toBe(0);
}

async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.evaluate(async next => {
    const token = (window as unknown as { __AGENT_CONFIG__?: { token?: string } }).__AGENT_CONFIG__?.token;
    await fetch('/api/settings', { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ theme: next }) });
  }, theme);
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe(theme);
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

async function home(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('textbox', { name: 'Message A Gent' })).toBeVisible();
}

test('home screen passes axe in dark mode', async ({ page }, testInfo) => {
  await home(page);
  await setTheme(page, 'dark');
  await audit(page, testInfo, 'home-dark');
});

test('home screen passes axe in light mode', async ({ page }, testInfo) => {
  await home(page);
  await setTheme(page, 'light');
  await audit(page, testInfo, 'home-light');
});

test('settings dialog passes axe', async ({ page }, testInfo) => {
  await home(page);
  await setTheme(page, 'dark');
  await page.getByRole('button', { name: /Personal workspace/ }).click();
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
  await audit(page, testInfo, 'settings', 'dialog[open]');
});

test('connections dialog passes axe', async ({ page }, testInfo) => {
  await home(page);
  await setTheme(page, 'light');
  await page.getByRole('button', { name: 'Connect apps' }).click();
  await expect(page.getByRole('dialog', { name: 'Connections' })).toBeVisible();
  await audit(page, testInfo, 'connections', 'dialog[open]');
});

test('side panel passes axe', async ({ page }, testInfo) => {
  await home(page);
  await setTheme(page, 'dark');
  await page.getByRole('button', { name: 'Open side panel' }).click();
  await expect(page.getByRole('tab', { name: 'Session', exact: true })).toBeVisible();
  await audit(page, testInfo, 'side-panel');
});

test('mobile home screen passes axe', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await home(page);
  await setTheme(page, 'light');
  await audit(page, testInfo, 'home-mobile');
});
