import { test, expect, type Page } from '@playwright/test';

const dayWithSlots = (page: Page) =>
  page.getByTestId('calendar-day').filter({ has: page.getByTestId('slot') });

test('a slot taken after the page loaded cannot be booked', async ({ page, request }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /intro call/i }).click();

  const days = dayWithSlots(page);
  await expect(days.first()).toBeVisible();
  const target = days.last().getByTestId('slot').first();
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

  // The page still shows the slot: the guest is working with stale data.
  await expect(page.locator(`[data-testid="slot"][data-start="${start}"]`)).toHaveCount(1);
  await target.click();
  await page.getByLabel(/name/i).fill('Second Guest');
  await page.getByLabel(/email/i).fill('second@example.com');
  await page.getByRole('button', { name: /^book$/i }).click();

  await expect(page.getByRole('alert')).toContainText(/not available/i);
  await expect(page.getByText(/booking confirmed/i)).toHaveCount(0);
});

test('a slot booked for another event type is not offered and cannot be re-booked', async ({
  page,
  context,
  request,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: /consultation/i }).click();

  const days = dayWithSlots(page);
  await expect(days.first()).toBeVisible();
  const total = await days.count();
  const target = days.nth(total - 2).getByTestId('slot').first();
  const start = await target.getAttribute('data-start');
  expect(start).toBeTruthy();

  // Book that time for a different event type.
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
  await fresh.getByRole('button', { name: /intro call/i }).click();
  await expect(fresh.getByTestId('calendar-day')).toHaveCount(14);
  await expect(fresh.locator(`[data-testid="slot"][data-start="${start}"]`)).toHaveCount(0);

  // Bypassing the UI is still rejected by the server.
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
