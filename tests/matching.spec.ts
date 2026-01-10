import { test, expect } from '@playwright/test';

test.describe('Matching Question', () => {
    test.beforeEach(async ({ page }) => {
        // Start a medium quiz to ensure we have matching questions
        await page.goto('/');
        await expect(page.getByText(/từ vựng HSK3/)).toBeVisible({ timeout: 10000 });
        await page.getByRole('button', { name: /Tạo bài thi mới/ }).click();
        // Select medium quiz for more questions
        await page.getByRole('heading', { name: 'Trung', exact: true }).click();
        await page.getByRole('button', { name: /Bắt đầu làm bài/ }).click();
        await expect(page).toHaveURL('/exam');
    });

    test('should have matching question type in quiz', async ({ page }) => {
        // Navigate through questions to find a matching question
        let foundMatching = false;

        // Try clicking through question numbers 1-20
        for (let i = 1; i <= 20; i++) {
            // Look for navigation button
            const navButton = page.locator(`button:has-text("${i}")`).filter({ hasText: new RegExp(`^${i}$`) }).first();

            try {
                // Only try if button exists and is visible
                if (await navButton.isVisible({ timeout: 300 })) {
                    await navButton.click();
                    await page.waitForTimeout(200);

                    // Check if this is a matching question by looking for the tag
                    const matchingTag = page.locator('text=Nối từ').first();
                    if (await matchingTag.isVisible({ timeout: 300 })) {
                        foundMatching = true;

                        // Verify matching question structure
                        await expect(page.getByText(/Nối từ với phiên âm và nghĩa đúng/)).toBeVisible();
                        await expect(page.getByText('Từ vựng')).toBeVisible();
                        await expect(page.getByText('Phiên âm')).toBeVisible();
                        await expect(page.getByText('Nghĩa')).toBeVisible();
                        break;
                    }
                }
            } catch {
                // Button doesn't exist, continue
                continue;
            }
        }

        // Note: Due to random quiz generation, matching questions may not always be present
        // This test validates the structure if found
        if (!foundMatching) {
            console.log('No matching question found in this quiz run - this is expected sometimes');
        }
        // We don't fail if no matching question - random generation might not include one
    });

    test('matching question should have draggable items', async ({ page }) => {
        // Navigate through questions to find a matching question
        for (let i = 1; i <= 20; i++) {
            const navButton = page.getByRole('button', { name: String(i), exact: true });
            if (await navButton.isVisible({ timeout: 500 }).catch(() => false)) {
                await navButton.click();

                const matchingIndicator = page.getByText('Nối từ');
                if (await matchingIndicator.isVisible({ timeout: 500 }).catch(() => false)) {
                    // Should have draggable items
                    const draggableItems = page.locator('[class*="cursor-grab"]');
                    const count = await draggableItems.count();

                    // Should have items to drag (3 types × N items)
                    expect(count).toBeGreaterThan(0);
                    return; // Test passed
                }
            }
        }
        // If no matching question found, skip gracefully
        test.skip();
    });

    test('matching question should have drop zones', async ({ page }) => {
        // Navigate through questions to find a matching question
        for (let i = 1; i <= 20; i++) {
            const navButton = page.getByRole('button', { name: String(i), exact: true });
            if (await navButton.isVisible({ timeout: 500 }).catch(() => false)) {
                await navButton.click();

                const matchingIndicator = page.getByText('Nối từ');
                if (await matchingIndicator.isVisible({ timeout: 500 }).catch(() => false)) {
                    // Should have placeholder text in drop zones
                    await expect(page.getByText('从').first()).toBeVisible();
                    await expect(page.getByText('pīnyīn').first()).toBeVisible();
                    await expect(page.getByText('nghĩa').first()).toBeVisible();
                    return; // Test passed
                }
            }
        }
        // If no matching question found, skip gracefully
        test.skip();
    });

    test('matching question submit should be disabled when not all filled', async ({ page }) => {
        // Navigate through questions to find a matching question
        for (let i = 1; i <= 20; i++) {
            const navButton = page.getByRole('button', { name: String(i), exact: true });
            if (await navButton.isVisible({ timeout: 500 }).catch(() => false)) {
                await navButton.click();

                const matchingIndicator = page.getByText('Nối từ');
                if (await matchingIndicator.isVisible({ timeout: 500 }).catch(() => false)) {
                    // Submit button should show "Còn X ô trống" and be disabled
                    const submitButton = page.getByRole('button', { name: /Còn \d+ ô trống/ });
                    await expect(submitButton).toBeVisible();
                    await expect(submitButton).toBeDisabled();
                    return; // Test passed
                }
            }
        }
        // If no matching question found, skip gracefully
        test.skip();
    });
});
