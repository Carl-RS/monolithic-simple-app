import { test, expect } from '@playwright/test';

test('Add high-priority task', { tag: '@smoke' }, async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('username-input').fill('admin');
  await page.getByTestId('password-input').fill('password123');
  await page.getByTestId('login-submit-btn').click();
  await page.getByTestId('task-title-input').fill('This is an example task');
  await page.getByTestId('task-priority-input').selectOption('high');
  await page.getByTestId('task-add-btn').click();
  await expect(page.getByText('This is an example task high')).toBeVisible();
  await expect(page.getByRole('listitem').filter({ hasText: 'This is an example task high' }).getByTestId('task-priority')).toBeVisible();
});