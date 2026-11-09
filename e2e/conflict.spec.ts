import { test, expect, type Page } from '@playwright/test';

const availableDays = (page: Page) =>
  page.locator('button[data-testid="calendar-day"][data-available="true"]');

test('a slot taken after the page loaded cannot be booked', async ({
  page,
  request,
}) => {
  await page.goto('/');

  await page.getByRole('button', { name: /intro call/i }).click();

  await page
    .getByRole('button', { name: 'Записаться →' })
    .dispatchEvent('click');

  const days = availableDays(page);
  await expect(days.first()).toBeVisible({ timeout: 15000 });
  const target = days.last();
  const start = await target.getAttribute('data-start');
  expect(start).toBeTruthy();

  const rival = await request.post('/api/bookings', {
    data: {
      eventTypeId: 'intro',
      start,
      guestName: 'Rival Guest',
      guestEmail: 'rival@example.com',
    },
  });
  expect(rival.status()).toBe(201);

  await target.dispatchEvent('click');
  const continueButton = page.getByRole('button', { name: /продолжить/i });
  await expect(continueButton).toBeDisabled({ timeout: 15000 });

  const firstPill = page.locator('[data-testid="slot-pill"]').first();
  await expect(firstPill).toBeVisible({ timeout: 15000 });
  await firstPill.dispatchEvent('click');

  await expect(continueButton).toBeEnabled({ timeout: 15000 });
  await continueButton.dispatchEvent('click');

  await expect(
    page.getByRole('heading', { name: /подтверждение записи/i }),
  ).toBeVisible({ timeout: 15000 });

  await page.getByPlaceholder(/имя/i).fill('E2E Guest');
  await page.getByPlaceholder(/email/i).fill('playwright@example.com');
  await page
    .getByRole('button', { name: /подтвердить запись/i })
    .dispatchEvent('click');

  await expect(
    page.getByRole('heading', { name: /бронь подтверждена/i }),
  ).toBeVisible();

  const bookAgain = page.getByRole('button', { name: /забронировать еще/i });
  await expect(bookAgain).toBeVisible();
});

test('a slot booked for another event type is not offered and cannot be re-booked', async ({
  page,
  context,
  request,
}) => {
  await page.goto('/');

  await page.getByRole('button', { name: /intro call/i }).click();

  await page
    .getByRole('button', { name: 'Записаться →' })
    .dispatchEvent('click');

  const days = availableDays(page);
  await expect(days.first()).toBeVisible({ timeout: 15000 });
  const total = await days.count();
  const target = days.nth(total - 2);
  const start = await target.getAttribute('data-start');
  expect(start).toBeTruthy();

  const booked = await request.post('/api/bookings', {
    data: {
      eventTypeId: 'consult',
      start,
      guestName: 'Consult Guest',
      guestEmail: 'consult@example.com',
    },
  });
  expect(booked.status()).toBe(201);

  const fresh = await context.newPage();
  await fresh.goto('/');
  await fresh
    .getByRole('button', { name: 'Записаться →' })
    .dispatchEvent('click');
  const freshNow = new Date();
  const freshYear = freshNow.getUTCFullYear();
  const freshMonth = freshNow.getUTCMonth();
  const freshDaysInMonth = new Date(
    Date.UTC(freshYear, freshMonth + 1, 0),
  ).getUTCDate();
  await expect(fresh.getByTestId('calendar-day')).toHaveCount(freshDaysInMonth);
  await expect(
    fresh.locator(`[data-testid="slot"][data-start="${start}"]`),
  ).toHaveCount(0);

  const conflict = await request.post('/api/bookings', {
    data: {
      eventTypeId: 'intro',
      start,
      guestName: 'Third Guest',
      guestEmail: 'third@example.com',
    },
  });
  expect(conflict.status()).toBe(409);
});
