import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Arpit Labs/);
  });

  test('should display navigation', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();
  });

  test('should navigate to projects page', async ({ page }) => {
    await page.goto('/');
    const projectsLink = page.getByRole('link', { name: /projects/i });
    await projectsLink.click();
    await expect(page).toHaveURL(/\/projects/);
  });
});

test.describe('Projects Page', () => {
  test('should display projects list', async ({ page }) => {
    await page.goto('/projects');
    const projects = page.getByTestId('project-card');
    await expect(projects.first()).toBeVisible();
  });

  test('should filter projects by domain', async ({ page }) => {
    await page.goto('/projects');
    const filterButton = page.getByRole('button', { name: /filter/i });
    await filterButton.click();
    
    const domainFilter = page.getByRole('combobox', { name: /domain/i });
    await domainFilter.selectOption('web-development');
    
    await expect(page).toHaveURL(/domain=web-development/);
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
  });

  test('should have skip to main content link', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.getByRole('link', { name: /skip to main content/i });
    await expect(skipLink).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('should load within performance budget', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });
});
