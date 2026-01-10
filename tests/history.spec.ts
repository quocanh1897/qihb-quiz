import { test, expect } from '@playwright/test';

test.describe('Profile Page', () => {
    test('should navigate to profile page from home', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByText(/từ vựng HSK3/)).toBeVisible({ timeout: 10000 });

        // Click "Xem thống kê" button
        await page.getByRole('button', { name: /Xem thống kê/ }).click();

        // Should navigate to profile page
        await expect(page).toHaveURL('/profile');
        await expect(page.getByRole('heading', { name: /Thống kê học tập/ })).toBeVisible();
    });

    test('should show page content when visiting profile', async ({ page }) => {
        await page.goto('/profile');

        // Should show the profile page with title
        await expect(page.getByRole('heading', { name: /Thống kê học tập/ })).toBeVisible();

        // Wait for content to load
        await page.waitForTimeout(1000);

        // Page should not be empty - either shows "Chưa có dữ liệu" or history entries
        const pageContent = await page.locator('body').textContent();
        const hasContent = pageContent && (
            pageContent.includes('Chưa có dữ liệu') ||
            pageContent.includes('Bài thi') ||
            pageContent.includes('Đang tải')
        );

        expect(hasContent).toBe(true);
    });

    test('should navigate back to home from profile', async ({ page }) => {
        await page.goto('/profile');

        // Click back button
        await page.getByRole('button', { name: /Quay lại/ }).click();

        // Should navigate back to home
        await expect(page).toHaveURL('/');
    });

    test('should display profile page elements correctly', async ({ page }) => {
        await page.goto('/profile');

        // Should show the title
        await expect(page.getByRole('heading', { name: /Thống kê học tập/ })).toBeVisible();

        // Should have back button
        await expect(page.getByRole('button', { name: /Quay lại/ })).toBeVisible();

        // Should show either empty state message or stats summary
        await page.waitForTimeout(1000); // Wait for data to load

        const pageContent = await page.textContent('body');
        const hasEmptyState = pageContent?.includes('Chưa có dữ liệu');
        const hasStats = pageContent?.includes('TB tỷ lệ đúng');

        expect(hasEmptyState || hasStats).toBe(true);
    });
});
