import { expect, test } from '@playwright/test'

test('visitor switches the complete interface to English and keeps it after refresh', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true')
  await expect(
    page.getByRole('heading', { name: 'ดอกไม้สำหรับทุกความรู้สึก' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Switch to English' }).click()
  await expect(
    page.getByRole('heading', { name: 'Flowers for every feeling' }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'Admin sign in' })).toBeVisible()

  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Flowers for every feeling' }),
  ).toBeVisible()
})

test('invalid credentials fail without identifying the wrong field', async ({
  page,
}) => {
  await page.goto('/admin/login')
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true')
  await page.getByLabel('อีเมล').fill('wrong@verabloom.test')
  await page.getByLabel('รหัสผ่าน').fill('wrong-password')
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click()

  await expect(page.getByRole('alert')).toHaveText(
    'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
  )
})

test('admin session survives a browser restart and logout invalidates it', async ({
  browser,
}) => {
  const firstContext = await browser.newContext()
  const firstPage = await firstContext.newPage()
  await firstPage.goto('/admin/login')
  await expect(firstPage.locator('html')).toHaveAttribute(
    'data-hydrated',
    'true',
  )
  await firstPage.getByLabel('อีเมล').fill('admin@verabloom.test')
  await firstPage.getByLabel('รหัสผ่าน').fill('verabloom-test-password')
  await firstPage.getByRole('button', { name: 'เข้าสู่ระบบ' }).click()
  await expect(firstPage).toHaveURL(/\/admin$/)
  await expect(
    firstPage.getByRole('heading', { name: 'ภาพรวมร้าน' }),
  ).toBeVisible()

  const state = await firstContext.storageState()
  const sessionCookie = state.cookies.find(
    (cookie) => cookie.name === 'verabloom-admin',
  )
  expect(sessionCookie?.httpOnly).toBe(true)
  expect(sessionCookie?.sameSite).toBe('Strict')
  expect(sessionCookie?.expires ?? 0).toBeGreaterThan(Date.now() / 1000)
  await firstContext.close()

  const restartedContext = await browser.newContext({ storageState: state })
  const restartedPage = await restartedContext.newPage()
  await restartedPage.goto('/admin')
  await expect(
    restartedPage.getByRole('heading', { name: 'ภาพรวมร้าน' }),
  ).toBeVisible()
  await expect(restartedPage.locator('html')).toHaveAttribute(
    'data-hydrated',
    'true',
  )

  await restartedPage.getByRole('button', { name: 'ออกจากระบบ' }).click()
  await expect(restartedPage).toHaveURL(/\/admin\/login$/)
  await restartedPage.goto('/admin')
  await expect(restartedPage).toHaveURL(/\/admin\/login/)
  await restartedContext.close()
})

test('protected page and mutation reject unauthenticated callers while public route stays open', async ({
  page,
  request,
}) => {
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/admin\/login/)

  const mutation = await request.post('/api/admin/ping')
  expect(mutation.status()).toBe(401)

  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'ดอกไม้สำหรับทุกความรู้สึก' }),
  ).toBeVisible()
})
