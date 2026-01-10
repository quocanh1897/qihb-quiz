import { test, expect } from '@playwright/test';

test.describe('Quiz Setup Page', () => {
    test.beforeEach(async ({ page }) => {
        // Go to home first to load vocabulary
        await page.goto('/');
        await expect(page.getByText(/từ vựng HSK3/)).toBeVisible({ timeout: 10000 });

        // Navigate to setup
        await page.getByRole('button', { name: /Tạo bài thi mới/ }).click();
        await expect(page).toHaveURL('/setup');
    });

    test('should display all quiz length options', async ({ page }) => {
        // Check all quiz options are visible (use exact: true to avoid matching page title)
        await expect(page.getByRole('heading', { name: 'Ngắn', exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Trung', exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Dài', exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Tối đa', exact: true })).toBeVisible();
    });

    test('should have info box with quiz information', async ({ page }) => {
        // Check info box content
        await expect(page.getByText(/Thông tin bài thi/)).toBeVisible();
        await expect(page.getByText('trắc nghiệm', { exact: true })).toBeVisible();
        await expect(page.getByText('nối từ', { exact: true })).toBeVisible();
    });

    test('should allow selecting different quiz lengths', async ({ page }) => {
        // Click on "Ngắn" option
        await page.getByRole('heading', { name: 'Ngắn' }).click();

        // Start button should be enabled
        const startButton = page.getByRole('button', { name: /Bắt đầu làm bài/ });
        await expect(startButton).toBeVisible();
    });

    test('should start quiz when clicking start button', async ({ page }) => {
        // Select short quiz
        await page.getByRole('heading', { name: 'Ngắn' }).click();

        // Click start
        await page.getByRole('button', { name: /Bắt đầu làm bài/ }).click();

        // Should navigate to exam page
        await expect(page).toHaveURL('/exam');
    });

    test('should navigate back to home when clicking back', async ({ page }) => {
        await page.getByRole('button', { name: /Quay lại/ }).click();
        await expect(page).toHaveURL('/');
    });
});
