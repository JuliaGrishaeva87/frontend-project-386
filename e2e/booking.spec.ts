import { test, expect } from '@playwright/test';

test('guest books a free slot and the owner sees the meeting', async ({ page, context }) => {
  const guestName = `E2E Guest ${Date.now()}`;
  const guestEmail = 'playwright@example.com';

  await page.goto('/');

  await expect(page.getByRole('heading', { name: /booking types/i })).toBeVisible();
  await page.getByRole('button', { name: /intro call/i }).click();

  await expect(page.getByTestId('calendar-day')).toHaveCount(14);

  const firstSlot = page.getByTestId('slot').first();
  await expect(firstSlot).toBeVisible();
  const start = await firstSlot.getAttribute('data-start');
  expect(start).toBeTruthy();

  await firstSlot.click();
  await page.getByLabel(/name/i).fill(guestName);
  await page.getByLabel(/email/i).fill(guestEmail);
  await page.getByRole('button', { name: /^book$/i }).click();

  await expect(page.getByText(/booking confirmed/i)).toBeVisible();
  await expect(page.locator(`[data-testid="slot"][data-start="${start}"]`)).toHaveCount(0);

  const host = await context.newPage();
  await host.goto('/host/bookings');
  await expect(host.getByRole('heading', { name: /upcoming meetings/i })).toBeVisible();

  const meeting = host.locator('li').filter({ hasText: guestName });
  await expect(meeting).toBeVisible();
  await expect(meeting).toContainText(guestEmail);
  await expect(meeting).toContainText(/intro call/i);
});
