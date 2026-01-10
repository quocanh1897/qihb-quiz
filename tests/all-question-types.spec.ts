import { test, expect } from '@playwright/test';

test.describe('All Question Types Present', () => {
    test('quiz should contain all three question types', async ({ page }) => {
        // Start a medium quiz
        await page.goto('/');
        await expect(page.getByText(/từ vựng HSK3/)).toBeVisible({ timeout: 10000 });
        await page.getByRole('button', { name: /Tạo bài thi mới/ }).click();
        await page.getByRole('heading', { name: 'Trung', exact: true }).click();
        await page.getByRole('button', { name: /Bắt đầu làm bài/ }).click();
        await expect(page).toHaveURL('/exam');

        // Track which question types we find
        let foundMC = false;
        let foundMatching = false;
        let foundFillBlank = false;

        // Navigate through all questions to verify all types exist
        for (let i = 1; i <= 20; i++) {
            const navButton = page.locator(`button:has-text("${i}")`).filter({ hasText: new RegExp(`^${i}$`) }).first();

            try {
                if (await navButton.isVisible({ timeout: 300 })) {
                    await navButton.click();
                    await page.waitForTimeout(200);

                    // Check for MC question
                    const mcTag = page.locator('text=Trắc nghiệm').first();
                    if (await mcTag.isVisible({ timeout: 200 }).catch(() => false)) {
                        foundMC = true;
                    }

                    // Check for Matching question
                    const matchingTag = page.locator('text=Nối từ').first();
                    if (await matchingTag.isVisible({ timeout: 200 }).catch(() => false)) {
                        foundMatching = true;
                    }

                    // Check for Fill-blank question
                    const fillBlankTag = page.locator('text=Điền ô trống').first();
                    if (await fillBlankTag.isVisible({ timeout: 200 }).catch(() => false)) {
                        foundFillBlank = true;
                    }

                    // If we found all types, we can stop
                    if (foundMC && foundMatching && foundFillBlank) {
                        break;
                    }
                }
            } catch {
                continue;
            }
        }

        // Log what was found for debugging
        console.log(`Found question types - MC: ${foundMC}, Matching: ${foundMatching}, Fill-blank: ${foundFillBlank}`);

        // Verify all types are present
        expect(foundMC).toBe(true);
        expect(foundMatching).toBe(true);
        expect(foundFillBlank).toBe(true);
    });

    test('quiz setup should mention all question types', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByText(/từ vựng HSK3/)).toBeVisible({ timeout: 10000 });
        await page.getByRole('button', { name: /Tạo bài thi mới/ }).click();

        // Info box should mention all three types
        await expect(page.getByText('trắc nghiệm', { exact: true })).toBeVisible();
        await expect(page.getByText('điền ô trống', { exact: true })).toBeVisible();
        await expect(page.getByText('nối từ', { exact: true })).toBeVisible();
    });
});
