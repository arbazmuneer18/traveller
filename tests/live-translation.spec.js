const { test, expect } = require('@playwright/test');

test.describe('Live Translation Verification', () => {
  const LIVE_URL = 'https://helpful-bombolone-d91d59.netlify.app/';

  test('Translation works and persists on live site', async ({ page }) => {
    // 1. Visit live site
    await page.goto(LIVE_URL);

    // 2. Initial state
    await expect(page.locator('#current-lang')).toHaveText('EN');
    
    // 3. Select Russian
    await page.click('#lang-trigger');
    await page.click('.dropdown-item[data-lang="ru"]');

    // 4. Verify URL Hash
    await expect(page).toHaveURL(/.*googtrans\(en\|ru\).*/, { timeout: 15000 });

    // 5. Verify Anti-FOUT and UI update
    await page.waitForSelector('body.translate-visible', { timeout: 15000 });
    await expect(page.locator('#current-lang')).toHaveText('РУ', { timeout: 15000 });

    // 6. Navigate to destination
    await page.waitForSelector('.destination-card', { state: 'visible', timeout: 15000 });
    await page.locator('.destination-card').first().click();

    // 7. Verify persistence on properties page
    await expect(page).toHaveURL(/.*googtrans\(en\|ru\).*/, { timeout: 15000 });
    await page.waitForSelector('body.translate-visible', { timeout: 15000 });
    await expect(page.locator('#current-lang')).toHaveText('РУ', { timeout: 15000 });
  });
});
