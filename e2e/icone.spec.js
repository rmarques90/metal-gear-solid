import { test, expect } from '@playwright/test'
test('titulo e favicon', async ({ page }) => {
  await page.goto('/pt-BR')
  await expect(page).toHaveTitle('Metal Gear Solid')
  const href = await page.locator('link[rel="icon"]').getAttribute('href')
  const resp = await page.request.get(`http://localhost:4173${href}`)
  expect(resp.status()).toBe(200)
  const png = await page.request.get('http://localhost:4173/solid-snake.png')
  expect(png.status()).toBe(200)
})
