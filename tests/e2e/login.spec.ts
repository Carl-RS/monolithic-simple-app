import { test, expect } from '@playwright/test';

test('Login', { tag: '@smoke' }, async ({ page }) => {
    await page.goto("/");
    await page.getByTestId('username-input').fill('admin');
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('login-submit-btn').click();
    await expect(page.getByTestId('welcome-message')).toBeVisible();
});

test('Invalid Login', async ({ page }) => {
    await page.goto("/");
    await page.getByTestId('username-input').fill('admin');
    await page.getByTestId('password-input').fill('wrongpassword');
    await page.getByTestId('login-submit-btn').click();
    await expect(page.getByTestId('error-message')).toBeVisible();
});

test('Fail GA test', { tag: '@smoke' }, async ({ page }) => {
    await page.goto("/");
    await page.getByTestId('username-input').fill('admin');
    await page.getByTestId('password-input').fill('passwtree');
    await page.getByTestId('login-submit-btn').click();
    await expect(page.getByTestId('welcome-message')).toBeVisible();
});