import { expect, test, type Page } from '@playwright/test';

const viewports = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1280x800', width: 1280, height: 800 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '390x844', width: 390, height: 844 },
] as const;

const themes = ['light', 'dark'] as const;

async function openHome(page: Page, theme: (typeof themes)[number]) {
  await page.goto('/');
  await expect(page.getByRole('textbox', { name: 'Message A Gent' })).toBeVisible();
  await page.evaluate(async nextTheme => {
    const token = (window as unknown as { __AGENT_CONFIG__?: { token?: string } }).__AGENT_CONFIG__?.token;
    const response = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: nextTheme }),
    });
    if (!response.ok) throw new Error(`Could not set theme: ${response.status}`);
  }, theme);
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe(theme);
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(() => page.evaluate(() => {
    const canvases = Array.from(document.querySelectorAll<HTMLCanvasElement>('.ui-agent-avatar canvas'));
    return canvases.length > 0 && canvases.every(canvas => Number(getComputedStyle(canvas).opacity) === 1);
  }), { timeout: 10000 }).toBe(true);
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

for (const theme of themes) {
  for (const viewport of viewports) {
    test(`home ${theme} ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await openHome(page, theme);
      await expect(page).toHaveScreenshot(`home-${theme}-${viewport.name}.png`, {
        animations: 'disabled',
        caret: 'hide',
      });
    });
  }
}
