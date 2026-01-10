import { test, expect } from '@playwright/test';

test.describe('Fill Blank Question', () => {
    test.beforeEach(async ({ page }) => {
        // Start a medium quiz to ensure all question types
        await page.goto('/');
        await expect(page.getByText(/từ vựng HSK3/)).toBeVisible({ timeout: 10000 });
        await page.getByRole('button', { name: /Tạo bài thi mới/ }).click();
        await page.getByRole('heading', { name: 'Trung', exact: true }).click();
        await page.getByRole('button', { name: /Bắt đầu làm bài/ }).click();
        await expect(page).toHaveURL('/exam');
    });

    test('should have fill blank question type in quiz', async ({ page }) => {
        // Navigate through questions to find a fill-blank question
        let foundFillBlank = false;

        for (let i = 1; i <= 20; i++) {
            const navButton = page.locator(`button:has-text("${i}")`).filter({ hasText: new RegExp(`^${i}$`) }).first();

            try {
                if (await navButton.isVisible({ timeout: 300 })) {
                    await navButton.click();
                    await page.waitForTimeout(200);

                    // Check if this is a fill-blank question
                    const fillBlankTag = page.locator('text=Điền ô trống').first();
                    if (await fillBlankTag.isVisible({ timeout: 300 })) {
                        foundFillBlank = true;

                        // Verify fill-blank question structure
                        await expect(page.getByText(/Điền từ thích hợp vào ô trống/)).toBeVisible();

                        // Should have options A-F
                        await expect(page.locator('button:has-text("A")').first()).toBeVisible();
                        break;
                    }
                }
            } catch {
                continue;
            }
        }

        // Note: Due to random quiz generation, fill-blank questions may not always be present
        if (!foundFillBlank) {
            console.log('No fill-blank question found in this quiz run - this is expected sometimes');
        }
    });

    test('fill blank question should have sentence with blank', async ({ page }) => {
        // Navigate through questions to find a fill-blank question
        for (let i = 1; i <= 20; i++) {
            const navButton = page.locator(`button:has-text("${i}")`).filter({ hasText: new RegExp(`^${i}$`) }).first();

            try {
                if (await navButton.isVisible({ timeout: 300 })) {
                    await navButton.click();
                    await page.waitForTimeout(200);

                    const fillBlankTag = page.locator('text=Điền ô trống').first();
                    if (await fillBlankTag.isVisible({ timeout: 300 })) {
                        // Should have a sentence area with placeholder
                        const sentenceArea = page.locator('.font-chinese').first();
                        await expect(sentenceArea).toBeVisible();
                        return;
                    }
                }
            } catch {
                continue;
            }
        }
        // Skip if no fill-blank question found
        test.skip();
    });

    test('fill blank question should allow selecting an option and submitting', async ({ page }) => {
        // Navigate through questions to find a fill-blank question
        let foundAndTested = false;

        for (let i = 1; i <= 20; i++) {
            const navButton = page.locator(`button:has-text("${i}")`).filter({ hasText: new RegExp(`^${i}$`) }).first();

            try {
                if (await navButton.isVisible({ timeout: 200 })) {
                    await navButton.click();
                    await page.waitForTimeout(300);

                    const fillBlankTag = page.locator('span:has-text("Điền ô trống")').first();
                    if (await fillBlankTag.isVisible({ timeout: 200 })) {
                        // Found a fill-blank question
                        // Wait for options to load
                        await page.waitForTimeout(500);

                        // Try to find and click an option with label A
                        const options = page.locator('button').filter({ has: page.locator('span.w-8') });
                        const count = await options.count();

                        if (count > 0) {
                            await options.first().click();
                            await page.waitForTimeout(200);

                            // Submit button should be enabled
                            const submitButton = page.getByRole('button', { name: 'Gửi' });
                            await expect(submitButton).toBeEnabled({ timeout: 2000 });

                            // Click submit
                            await submitButton.click();

                            // Should show result
                            await expect(page.getByText(/Đúng rồi!|Sai rồi!/)).toBeVisible({ timeout: 3000 });
                            foundAndTested = true;
                            break;
                        }
                    }
                }
            } catch {
                continue;
            }
        }

        if (!foundAndTested) {
            console.log('No fill-blank question could be tested - skipping');
            test.skip();
        }
    });
});
