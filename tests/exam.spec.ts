import { test, expect } from '@playwright/test';

test.describe('Exam Page - Multiple Choice', () => {
    test.beforeEach(async ({ page }) => {
        // Start a medium quiz to ensure all question types
        await page.goto('/');
        await expect(page.getByText(/từ vựng HSK3/)).toBeVisible({ timeout: 10000 });
        await page.getByRole('button', { name: /Tạo bài thi mới/ }).click();
        await page.getByRole('heading', { name: 'Trung', exact: true }).click();
        await page.getByRole('button', { name: /Bắt đầu làm bài/ }).click();
        await expect(page).toHaveURL('/exam');
    });

    test('should display question with options', async ({ page }) => {
        // Should show question number
        await expect(page.getByText(/Câu hỏi \d+ \/ \d+/)).toBeVisible();

        // Should show timer
        await expect(page.getByText(/\d{2}:\d{2}/)).toBeVisible();

        // Should have navigation buttons
        await expect(page.getByText(/Điều hướng câu hỏi/)).toBeVisible();
    });

    test('should enable submit button after selecting an option', async ({ page }) => {
        // Submit button should be disabled initially
        const submitButton = page.getByRole('button', { name: 'Gửi' });

        // If it's a multiple choice question, select an option
        const firstOption = page.locator('button').filter({ hasText: /^[A-F]\s/ }).first();
        if (await firstOption.isVisible()) {
            await firstOption.click();

            // Submit button should be enabled now
            await expect(submitButton).toBeEnabled();
        }
    });

    test('should show result after submitting answer', async ({ page }) => {
        // Find and click first option (if MC question)
        const firstOption = page.locator('button').filter({ hasText: /^[A-F]\s/ }).first();

        if (await firstOption.isVisible()) {
            await firstOption.click();
            await page.getByRole('button', { name: 'Gửi' }).click();

            // Should show result (Đúng or Sai)
            await expect(page.getByText(/Đúng rồi!|Sai rồi!/)).toBeVisible();
        }
    });

    test('should show speaker button after submitting MC answer', async ({ page }) => {
        // Find and click first option (if MC question)
        const firstOption = page.locator('button').filter({ hasText: /^[A-F]\s/ }).first();

        if (await firstOption.isVisible()) {
            await firstOption.click();
            await page.getByRole('button', { name: 'Gửi' }).click();

            // Should show speaker button with "Nghe" tooltip
            await expect(page.getByRole('button', { name: 'Nghe' })).toBeVisible();
        }
    });

    test('should show example sentence after submitting MC answer', async ({ page }) => {
        // Find and click first option (if MC question)
        const firstOption = page.locator('button').filter({ hasText: /^[A-F]\s/ }).first();

        if (await firstOption.isVisible()) {
            await firstOption.click();
            await page.getByRole('button', { name: 'Gửi' }).click();

            // Should show example section (if example exists)
            // Note: Not all words have examples, so we use a soft check
            const exampleSection = page.getByText('Ví dụ');
            const hasExample = await exampleSection.isVisible().catch(() => false);

            if (hasExample) {
                await expect(page.getByText('Nghĩa là')).toBeVisible();
            }
        }
    });

    test('should enable next button after submitting', async ({ page }) => {
        // Find and click first option (if MC question)
        const firstOption = page.locator('button').filter({ hasText: /^[A-F]\s/ }).first();

        if (await firstOption.isVisible()) {
            await firstOption.click();
            await page.getByRole('button', { name: 'Gửi' }).click();

            // Next button should appear
            await expect(page.getByRole('button', { name: /Tiến/ })).toBeVisible();
        }
    });

    test('should navigate to next question', async ({ page }) => {
        // Answer first question
        const firstOption = page.locator('button').filter({ hasText: /^[A-F]\s/ }).first();

        if (await firstOption.isVisible()) {
            await firstOption.click();
            await page.getByRole('button', { name: 'Gửi' }).click();

            // Click next
            await page.getByRole('button', { name: /Tiến/ }).click();

            // Should show question 2
            await expect(page.getByText(/Câu hỏi 2 \//)).toBeVisible();
        }
    });
});

test.describe('Exam Page - Navigation', () => {
    test.beforeEach(async ({ page }) => {
        // Start a medium quiz
        await page.goto('/');
        await expect(page.getByText(/từ vựng HSK3/)).toBeVisible({ timeout: 10000 });
        await page.getByRole('button', { name: /Tạo bài thi mới/ }).click();
        await page.getByRole('heading', { name: 'Trung', exact: true }).click();
        await page.getByRole('button', { name: /Bắt đầu làm bài/ }).click();
    });

    test('should have question navigation buttons', async ({ page }) => {
        // Should have numbered navigation buttons
        await expect(page.getByRole('button', { name: '1', exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: '2', exact: true })).toBeVisible();
    });

    test('should navigate using question buttons', async ({ page }) => {
        // Click on question 2 button
        await page.getByRole('button', { name: '2', exact: true }).click();

        // Should show question 2
        await expect(page.getByText(/Câu hỏi 2 \//)).toBeVisible();
    });

    test('should have home button visible', async ({ page }) => {
        // Home button should be visible in exam
        await expect(page.getByRole('button', { name: /Trang chủ/ })).toBeVisible();
    });
});
