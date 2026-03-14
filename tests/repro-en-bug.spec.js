const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('English Switch Bug Reproduction', () => {
  test('User can switch to Russian and then back to English', async ({ page }) => {
    const indexPath = `file://${path.resolve(__dirname, '../index.html')}`;
    await page.goto(indexPath);

    // 1. Initial EN
    await expect(page.locator('#current-lang')).toHaveText('EN');

    // 2. Switch to Russian
    await page.click('#lang-trigger');
    await page.click('.dropdown-item[data-lang="ru"]');
    
    // Wait for reload and UI update
    await page.waitForSelector('body.translate-visible', { timeout: 15000 });
    await expect(page.locator('#current-lang')).toHaveText('РУ');
    expect(page.url()).toContain('googtrans(en|ru)');

    // 3. Switch back to English
    await page.click('#lang-trigger');
    await page.click('.dropdown-item[data-lang="en"]');

    // Wait for reload and UI update
    await page.waitForSelector('body.translate-visible', { timeout: 15000 });
    
    // VERIFY: Should be EN
    await expect(page.locator('#current-lang')).toHaveText('EN');
    
    // Check that hash is cleared or does not contain ru
    expect(page.url()).not.toContain('googtrans(en|ru)');
  });
});
