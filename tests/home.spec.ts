import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
    test('should load home page with vocabulary data', async ({ page }) => {
        await page.goto('/');

        // Check page title
        await expect(page).toHaveTitle(/QIHB-Quiz/);

        // Check main heading
        await expect(page.getByRole('heading', { name: 'QIHB-Quiz' })).toBeVisible();

        // Wait for vocabulary data to load (shows "290" or similar count)
        await expect(page.getByText(/từ vựng HSK3/)).toBeVisible({ timeout: 10000 });

        // Check "Tạo bài thi mới" button exists
        await expect(page.getByRole('button', { name: /Tạo bài thi mới/ })).toBeVisible();
    });

    test('should navigate to quiz setup when clicking create quiz', async ({ page }) => {
        await page.goto('/');

        // Wait for data to load
        await expect(page.getByText(/từ vựng HSK3/)).toBeVisible({ timeout: 10000 });

        // Click create quiz button
        await page.getByRole('button', { name: /Tạo bài thi mới/ }).click();

        // Should navigate to setup page
        await expect(page).toHaveURL('/setup');
        await expect(page.getByRole('heading', { name: /Chọn độ dài bài thi/ })).toBeVisible();
    });

    test('should have reload data button', async ({ page }) => {
        await page.goto('/');

        // Wait for data to load
        await expect(page.getByText(/từ vựng HSK3/)).toBeVisible({ timeout: 10000 });

        // Check reload button exists
        await expect(page.getByRole('button', { name: /Tải lại dữ liệu/ })).toBeVisible();
    });
});
