import { test, expect } from '@playwright/test';

test('loads the pet calculator and saves a pet', async ({ page }) => {
  await page.goto('http://localhost:8100');

  await expect(page.getByRole('heading', { name: /Pet Hydro-Feed Calculator/i })).toBeVisible();
  await expect(page.locator('#pet-name')).toBeVisible();

  await page.locator('#pet-name').fill('มีโก้');
  await page.locator('#pet-type').selectOption('dog');
  await page.locator('#pet-breed').fill('Golden Retriever');
  await page.locator('#pet-weight').fill('10');
  await page.locator('#pet-activity').selectOption('medium');

  await page.getByRole('button', { name: /บันทึกข้อมูล/i }).click();

  await expect(page.locator('#pets-table-body')).toContainText('มีโก้', { timeout: 20000 });
  await expect(page.locator('#summary-total-pets')).not.toHaveText('0', { timeout: 20000 });
});
