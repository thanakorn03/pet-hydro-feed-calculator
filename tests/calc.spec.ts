// tests/playwright.calc.spec.ts
// ======================================================
// Playwright E2E tests – calc.spec.ts
// Verifies that the UI preview matches the calculation
// logic for all supported pet types.
// ======================================================

import { test, expect, Page } from '@playwright/test';

interface PetTestParams {
  type: string;
  weight: number | string;
  activity: string;
  expectedWater: number;
  expectedFood: number;
}

// Helper to fill the form and wait for the preview to update
async function fillFormAndCheckPreview(
  page: Page,
  { type, weight, activity, expectedWater, expectedFood }: PetTestParams
) {
  // Select pet type
  await page.selectOption('#pet-type', type);
  // Fill weight
  await page.fill('#pet-weight', String(weight));
  // Select activity level
  await page.selectOption('#pet-activity', activity);

  // Click the submit button to trigger/verify calculation
  await page.click('#btn-submit');

  const waterLocator = page.locator('#preview-water');
  const foodLocator = page.locator('#preview-food');

  // Wait for elements to be visible
  await expect(waterLocator).toBeVisible();
  await expect(foodLocator).toBeVisible();

  // Extract and parse numeric values safely
  const parseNumericValue = (text: string | null): number => {
    if (!text) return 0;
    const match = text.replace(/,/g, '').match(/[\d.]+/);
    return match ? Number(match[0]) : 0;
  };

  const waterText = await waterLocator.textContent();
  const foodText = await foodLocator.textContent();

  const waterVal = parseNumericValue(waterText);
  const foodVal = parseNumericValue(foodText);

  expect(waterVal).toBeCloseTo(expectedWater, 2);
  expect(foodVal).toBeCloseTo(expectedFood, 2);
}

// -------------------------------------------------------------------
// Test suite
// -------------------------------------------------------------------
test.describe('🐾 UI Calculation Preview – Playwright', () => {
  test.beforeEach(async ({ page }) => {
    // Open the app – local web server URL
    await page.goto('http://localhost:8100');
    // Ensure the pet form is visible before proceeding
    await expect(page.locator('#pet-form')).toBeVisible();
  });

  // -------------------------------------------------------------
  // 1️⃣ Dog – 10 kg – medium activity
  // -------------------------------------------------------------
  test('Dog 10 kg, medium activity → 600 ml water, 216 g food', async ({ page }) => {
    await fillFormAndCheckPreview(page, {
      type: 'dog',
      weight: 10,
      activity: 'medium',
      expectedWater: 10 * 60, // 600 ml
      expectedFood: 10 * 18 * 1.2, // 216 g
    });
  });

  // -------------------------------------------------------------
  // 2️⃣ Cat – 5 kg – low activity
  // -------------------------------------------------------------
  test('Cat 5 kg, low activity → 250 ml water, 75 g food', async ({ page }) => {
    await fillFormAndCheckPreview(page, {
      type: 'cat',
      weight: 5,
      activity: 'low',
      expectedWater: 5 * 50, // 250 ml
      expectedFood: 5 * 15 * 1.0, // 75 g
    });
  });

  // -------------------------------------------------------------
  // 3️⃣ Bird – 0.2 kg – medium activity
  // -------------------------------------------------------------
  test('Bird 0.2 kg, medium activity → 10 ml water, 24 g food', async ({ page }) => {
    await fillFormAndCheckPreview(page, {
      type: 'bird',
      weight: 0.2,
      activity: 'medium',
      expectedWater: 0.2 * 50, // 10 ml
      expectedFood: 0.2 * 100 * 1.2, // 24 g
    });
  });

  // -------------------------------------------------------------
  // 4️⃣ Hamster – 0.1 kg – low activity
  // -------------------------------------------------------------
  test('Hamster 0.1 kg, low activity → 10 ml water, 11 g food', async ({ page }) => {
    await fillFormAndCheckPreview(page, {
      type: 'hamster',
      weight: 0.1,
      activity: 'low',
      expectedWater: 0.1 * 100, // 10 ml
      expectedFood: 0.1 * 110 * 1.0, // 11 g
    });
  });

  // -------------------------------------------------------------
  // 5️⃣ Fish – 0.5 kg – low activity (water always 0)
  // -------------------------------------------------------------
  test('Fish 0.5 kg → 0 ml water, 10 g food', async ({ page }) => {
    await fillFormAndCheckPreview(page, {
      type: 'fish',
      weight: 0.5,
      activity: 'low',
      expectedWater: 0,
      expectedFood: 0.5 * 20 * 1.0, // 10 g
    });
  });

  // -------------------------------------------------------------
  // 6️⃣ Validation – unrealistic weight for hamster (10 kg)
  // -------------------------------------------------------------
  test('Reject unrealistic hamster weight (10 kg) with error message', async ({ page }) => {
    await page.selectOption('#pet-type', 'hamster');
    await page.fill('#pet-weight', '10');
    await page.selectOption('#pet-activity', 'low');
    await page.click('#btn-submit');

    const err = page.locator('#error-weight');
    await expect(err).toBeVisible();
    await expect(err).toContainText(/0\.01 - 0\.4 kg|Weight for hamster/);
  });

  // -------------------------------------------------------------
  // 7️⃣ Validation – missing activity selection
  // -------------------------------------------------------------
  test('Show activity error when activity not selected', async ({ page }) => {
    await page.selectOption('#pet-type', 'dog');
    await page.fill('#pet-weight', '5');
    await page.click('#btn-submit');

    const err = page.locator('#error-activity');
    await expect(err).toBeVisible();
    await expect(err).toContainText('กรุณาเลือกระดับกิจกรรม');
  });
});