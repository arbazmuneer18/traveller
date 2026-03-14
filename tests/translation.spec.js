const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Translation and FOUT Persistence', () => {
  test('User can switch language and it persists across pages', async ({ page }) => {
    // 1. Go to the home page using file:// protocol just like the user does
    const indexPath = `file://${path.resolve(__dirname, '../index.html')}`;
    await page.goto(indexPath);

    // 2. Ensure the page loads in English initially
    await expect(page.locator('#current-lang')).toHaveText('EN');
    
    // We check for a known English string on the page
    await expect(page.locator('.hero-content h1')).toContainText('Discover the');

    // 3. Open the language dropdown and select Russian
    await page.click('#lang-trigger');
    
    // Check that dropdown opens
    await expect(page.locator('#lang-dropdown')).toHaveClass(/visible/);
    
    // Click Russian
    await page.click('.dropdown-item[data-lang="ru"]');

    // 4. Verify that the URL Hash is updated to trigger Google Translate
    expect(page.url()).toContain('googtrans(en|ru)');

    // 5. Verify the anti-FOUT mechanism kicks in (body gets translate-hiding briefly, then translate-visible)
    // Since it's very fast, we just wait for translate-visible to exist
    await page.waitForSelector('body.translate-visible', { timeout: 10000 });

    // 6. Verify Russian language is selected in our local UI
    await expect(page.locator('#current-lang')).toHaveText('РУ', { timeout: 10000 });

    // Now, navigate to another page (e.g., Destinations -> clicking the first destination)
    // Since properties might be loaded dynamically, wait for at least one property link
    await page.waitForSelector('.destination-card', { state: 'visible', timeout: 10000 });
    
    // Click the first destination
    await page.locator('.destination-card').first().click();

    // 7. On the new page (properties.html), verify it stays in Russian
    // By waiting for our script to append the hash and reload the page
    await expect(page).toHaveURL(/.*googtrans\(en\|ru\).*/, { timeout: 10000 });
    
    // Wait for the anti-FOUT to expose the body
    await page.waitForSelector('body.translate-visible', { timeout: 10000 });
    
    // Check the UI still says РУ
    await expect(page.locator('#current-lang')).toHaveText('РУ', { timeout: 10000 });
  });
});
