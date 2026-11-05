import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const base = 'http://127.0.0.1:4317';
const out = 'docs/screenshots/integration';
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
page.on('console', message => { if (message.type() === 'error' && !message.text().includes('WebSocket') && !message.text().includes('[vite]')) errors.push(message.text()); });
page.on('pageerror', error => errors.push(error.message));

await page.goto(base, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => document.fonts.ready);
await page.getByRole('button', { name: 'Create an agent' }).waitFor();
await page.getByRole('button', { name: 'Create an agent' }).click();
await page.getByRole('textbox', { name: /Name/ }).fill('Field Check');
await page.getByRole('textbox', { name: /What does it help with/ }).fill('Checks labels and validation.');
await page.getByRole('textbox', { name: /Instructions/ }).fill('Keep the interface calm and the labels close to their controls.');
await page.getByRole('combobox', { name: 'Model' }).click();
await page.screenshot({ path: `${out}/agent-model-combobox.png` });
await page.keyboard.press('Escape');
await page.screenshot({ path: `${out}/agent-dialog-dark.png` });
await page.getByRole('button', { name: 'Close dialog' }).click();

await page.getByRole('button', { name: 'Teammates' }).click();
await page.getByRole('button', { name: 'Actions for Product Designer' }).click();
await page.waitForTimeout(200);
await page.getByRole('menuitem', { name: 'Customize agent' }).click();
await page.getByText('Archive this agent', { exact: true }).click();
await page.screenshot({ path: `${out}/agent-edit-dialog.png` });
await page.getByRole('button', { name: 'Cancel' }).click();

await page.getByRole('button', { name: 'Personal workspace settings' }).click();
await page.waitForTimeout(200);
await page.screenshot({ path: `${out}/settings-appearance.png` });
await page.getByRole('button', { name: 'Devices' }).click();
await page.waitForTimeout(200);
await page.screenshot({ path: `${out}/settings-devices.png` });
await page.getByRole('button', { name: 'Appearance' }).click();
await page.getByRole('button', { name: 'Dark', exact: true }).click();
await page.waitForTimeout(200);
await page.waitForTimeout(200);
await page.screenshot({ path: `${out}/settings-dark.png` });
await page.getByRole('button', { name: 'Light', exact: true }).click();
await page.getByRole('button', { name: 'Close dialog' }).click();

await page.getByRole('button', { name: 'Connect apps' }).click();
await page.waitForTimeout(200);
await page.screenshot({ path: `${out}/connections-dialog.png` });
await page.getByRole('button', { name: 'Close dialog' }).click();

await page.keyboard.press('Meta+k');
await page.waitForTimeout(200);
await page.getByRole('searchbox', { name: 'Search conversations' }).fill('readiness');
await page.screenshot({ path: `${out}/search-dialog.png` });
await page.keyboard.press('Escape');

await page.getByRole('button', { name: 'Open side panel' }).click();
await page.waitForTimeout(200);
await page.getByRole('tab', { name: 'Sessions' }).click();
await page.screenshot({ path: `${out}/side-panel-sessions.png` });
await page.getByRole('button', { name: /A Gent readiness check/ }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/conversation.png` });
await page.locator('.reason-message').last().hover();
await page.screenshot({ path: `${out}/message-actions.png` });
await page.getByRole('button', { name: 'More message actions' }).last().click();
await page.waitForTimeout(200);
await page.screenshot({ path: `${out}/message-menu.png` });
await page.keyboard.press('Escape');

await page.locator('.reason-model-pill').click();
await page.waitForTimeout(150);
await page.screenshot({ path: `${out}/composer-model.png` });
await page.keyboard.press('Escape');
await page.getByRole('button', { name: 'Add' }).click();
await page.waitForTimeout(200);
await page.screenshot({ path: `${out}/composer-menu.png` });
await page.keyboard.press('Escape');

await page.getByRole('button', { name: 'More workspace options' }).click();
await page.waitForTimeout(200);
await page.screenshot({ path: `${out}/workspace-menu.png` });
await page.getByRole('menuitem', { name: 'Scheduled' }).click();

await page.screenshot({ path: `${out}/schedules-dialog.png` });
await page.getByRole('button', { name: 'Schedule task' }).click();
await page.waitForTimeout(200);
await page.screenshot({ path: `${out}/schedule-dialog.png` });
await page.keyboard.press('Escape');

const overflow = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
const mp = await mobile.newPage();
const mobileErrors = [];
mp.on('console', message => { if (message.type() === 'error' && !message.text().includes('WebSocket') && !message.text().includes('[vite]')) mobileErrors.push(message.text()); });
mp.on('pageerror', error => mobileErrors.push(error.message));
await mp.goto(base, { waitUntil: 'domcontentloaded' });
await mp.evaluate(() => document.fonts.ready);
await mp.getByRole('button', { name: 'Open sidebar' }).waitFor();
await mp.screenshot({ path: `${out}/mobile-home.png` });
await mp.getByRole('button', { name: 'Open sidebar' }).click();
await mp.waitForTimeout(200);
await mp.screenshot({ path: `${out}/mobile-sidebar.png` });
await mp.getByRole('button', { name: 'Create an agent' }).click();
await mp.waitForTimeout(200);
await mp.screenshot({ path: `${out}/mobile-agent-dialog.png` });
await mp.keyboard.press('Escape');
await mp.getByRole('button', { name: 'Collapse sidebar' }).click();
await mp.getByRole('button', { name: 'Open A Gent details' }).click();
await mp.waitForTimeout(200);
await mp.screenshot({ path: `${out}/mobile-side-panel.png` });
const mobileOverflow = await mp.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));

console.log(JSON.stringify({ errors, mobileErrors, overflow, mobileOverflow }, null, 2));
await browser.close();
