import { test, expect } from '@playwright/test';

test('Login', async ({ page }) => {
    await page.goto("/");
    await page.getByTestId('username-input').fill('admin');
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('login-submit-btn').click();
    await expect(page.getByTestId('welcome-message')).toBeVisible();
});