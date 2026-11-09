import { test, expect } from '@playwright/test';

test('guest books a free slot and the owner sees the meeting', async ({
  page,
  context,
}) => {
  const guestName = `E2E Guest ${Date.now()}`;
  const guestEmail = 'playwright@example.com';

  await page.goto('/');

  const bookNow = page.getByRole('button', { name: 'Записаться →' });
  await expect(bookNow).toBeVisible({ timeout: 15000 });
  await bookNow.dispatchEvent('click');

  await expect(
    page.getByRole('heading', { name: /запись на звонок/i }),
  ).toBeVisible({ timeout: 15000 });
  await page.getByText('Встреча 15 минут').dispatchEvent('click');
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  await expect(page.getByTestId('calendar-day')).toHaveCount(daysInMonth);

  const availableDays = page.locator(
    'button[data-testid="calendar-day"][data-available="true"]',
  );
  const firstAvailable = availableDays.first();
  await expect(firstAvailable).toBeVisible({ timeout: 15000 });
  const start = await firstAvailable.getAttribute('data-start');
  expect(start).toBeTruthy();
  await firstAvailable.dispatchEvent('click');

  const continueButton = page.getByRole('button', { name: /продолжить/i });
  await expect(continueButton).toBeDisabled({ timeout: 15000 });

  const firstPill = page.locator('button[data-testid="slot"]').first();
  await expect(firstPill).toBeVisible({ timeout: 15000 });
  await firstPill.dispatchEvent('click');

  await expect(continueButton).toBeEnabled({ timeout: 15000 });
  await continueButton.dispatchEvent('click');

  await expect(
    page.getByRole('heading', { name: /подтверждение записи/i }),
  ).toBeVisible({ timeout: 15000 });

  await page.getByPlaceholder(/имя/i).fill(guestName);
  await page.getByPlaceholder(/email/i).fill(guestEmail);
  await page
    .getByRole('button', { name: /подтвердить запись/i })
    .dispatchEvent('click');

  await expect(
    page.getByRole('heading', { name: /бронь подтверждена/i }),
  ).toBeVisible();

  const bookAgain = page.getByRole('button', { name: /забронировать еще/i });
  await expect(bookAgain).toBeVisible();

  const host = await context.newPage();
  await host.goto('/host/bookings');
  await expect(
    host.getByRole('heading', { name: /upcoming meetings/i }),
  ).toBeVisible();

  const meeting = host.locator('li').filter({ hasText: guestName });
  await expect(meeting).toBeVisible();
  await expect(meeting).toContainText(guestEmail);
  await expect(meeting).toContainText(/intro call/i);
});
