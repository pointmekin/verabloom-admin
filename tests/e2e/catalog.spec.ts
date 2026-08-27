import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { randomUUID } from 'node:crypto'

const testResetToken = 'playwright-reset-token'

test.beforeEach(async ({ request }) => {
  const response = await request.post('/api/test/reset-catalog', {
    headers: { 'x-verabloom-test-reset': testResetToken },
  })
  expect(response.status()).toBe(204)
})

async function signIn(page: Page) {
  await page.goto('/admin/login')
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true')
  await page.getByLabel('อีเมล').fill('admin@verabloom.test')
  await page.getByLabel('รหัสผ่าน').fill('verabloom-test-password')
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click()
  await expect(page).toHaveURL(/\/admin$/)
}

test('admin manages a product and customers can browse, filter, and inspect it', async ({
  page,
}) => {
  const suffix = randomUUID().slice(0, 8)
  const firstName = `กุหลาบยามเช้า ${suffix}`
  const secondName = `ดอกไม้ป่า ${suffix}`

  await signIn(page)
  await page.goto('/admin/catalog')
  await page.getByRole('link', { name: 'เพิ่มช่อดอกไม้' }).first().click()
  await page.getByLabel('ชื่อช่อดอกไม้').fill(firstName)
  await page
    .getByLabel('คำอธิบาย (Markdown)')
    .fill('ช่อดอกไม้ประจำวัน\n\n- ดอกไม้สด\n- ห่อกระดาษ\n\n**จัดด้วยใจ**')
  await page.getByRole('button', { name: 'เพิ่มรูปแบบ' }).click()
  await page.getByLabel('ชื่อรูปแบบ').fill('ขนาดกลาง')
  await page.getByLabel('ราคาเริ่มต้น (บาท)').fill('890')
  await page.getByRole('button', { name: 'เพิ่มรูปแบบ' }).click()
  const initialVariationRows = page.locator('.variation-editor-row')
  await initialVariationRows.nth(1).getByLabel('ชื่อรูปแบบ').fill('ขนาดเล็ก')
  await initialVariationRows.nth(1).getByLabel('ราคาเริ่มต้น (บาท)').fill('690')
  await page.locator('input[type="file"]').setInputFiles([
    {
      name: 'first.png',
      mimeType: 'image/png',
      buffer: Buffer.from('first-image'),
    },
    {
      name: 'cover.png',
      mimeType: 'image/png',
      buffer: Buffer.from('cover-image'),
    },
    {
      name: 'remove-me.png',
      mimeType: 'image/png',
      buffer: Buffer.from('remove-image'),
    },
  ])
  await expect(page.getByText('3 เพิ่มภาพ')).toBeVisible()
  const pendingRows = page.locator('.pending-image-row')
  await pendingRows
    .filter({ hasText: 'remove-me.png' })
    .getByRole('button', { name: 'ลบ' })
    .click()
  await pendingRows.nth(0).getByRole('button', { name: 'เลื่อนลง' }).click()
  await page.getByRole('button', { name: 'สร้างช่อดอกไม้' }).click()
  await expect(page).toHaveURL(/\/admin\/catalog\/\d+/)
  await expect(
    page.getByText('ช่อดอกไม้ประจำวัน', { exact: true }),
  ).toBeVisible()
  await expect(page.getByText('ภาพปก')).toBeVisible()
  await expect(page.locator('.image-editor-list > li')).toHaveCount(2)
  const persistedImageSrcs = await page
    .locator('.image-editor-list > li img')
    .evaluateAll((images) => images.map((image) => image.getAttribute('src')))
  expect(persistedImageSrcs).toHaveLength(2)
  const coverSrc = persistedImageSrcs[0] ?? ''
  expect(coverSrc).toBeTruthy()
  const savedVariationRows = page.locator('.variation-editor-row')
  await savedVariationRows
    .nth(0)
    .getByRole('button', { name: 'เลื่อนลง' })
    .click()
  await savedVariationRows.nth(1).getByRole('button', { name: 'ลบ' }).click()
  await expect(page.locator('.variation-editor-row')).toHaveCount(1)
  await page
    .getByLabel('คำอธิบาย (Markdown)')
    .fill(
      'แก้ไขรายละเอียดช่อดอกไม้\nบรรทัดถัดไป\n\n- รายการใหม่\n\n[ดูเพิ่ม](https://example.com)\n\n**จัดด้วยใจ**',
    )
  await page
    .locator('.variation-editor-row')
    .first()
    .getByLabel('ราคาเริ่มต้น (บาท)')
    .fill('695')
  await page.getByRole('button', { name: 'บันทึกการแก้ไข' }).click()
  await expect(
    page.locator('.markdown-preview-card .markdown-content'),
  ).toContainText('แก้ไขรายละเอียดช่อดอกไม้')

  await page.goto('/admin/catalog')
  await page.getByRole('link', { name: 'เพิ่มช่อดอกไม้' }).first().click()
  await page.getByLabel('ชื่อช่อดอกไม้').fill(secondName)
  await page.getByRole('button', { name: 'สร้างช่อดอกไม้' }).click()
  await expect(page).toHaveURL(/\/admin\/catalog\/\d+/)

  await page.goto('/catalog')
  await expect(page.getByText(secondName)).toBeVisible()

  await page.getByLabel('กรองตามรูปแบบ').selectOption('ขนาดเล็ก')
  await expect(page.getByText(secondName)).not.toBeVisible()
  await page.getByRole('button', { name: 'ล้างตัวกรอง' }).click()
  await expect(page.getByText(secondName)).toBeVisible()

  await page.goto('/admin/catalog')
  const secondRow = page
    .locator('.admin-product-list > li')
    .filter({ hasText: secondName })
  await secondRow.getByRole('button', { name: 'เลื่อนขึ้น' }).click()
  await expect(page.getByText('บันทึกลำดับแล้ว')).toBeVisible()
  await page.goto('/catalog')
  await expect(page.locator('.catalog-grid > li').first()).toContainText(
    secondName,
  )

  await page.goto('/admin/catalog')
  const refreshedFirstRow = page
    .locator('.admin-product-list > li')
    .filter({ hasText: firstName })
  await refreshedFirstRow.getByRole('button', { name: 'ซ่อนสินค้า' }).click()

  await page.goto('/catalog')
  await expect(page.getByText(firstName)).not.toBeVisible()
  await expect(page.getByText(secondName)).toBeVisible()

  await page.goto('/admin/catalog')
  await page
    .locator('.admin-product-list > li')
    .filter({ hasText: firstName })
    .getByRole('button', { name: 'แสดงสินค้า' })
    .click()
  await page.goto('/catalog')
  await page.getByText(firstName, { exact: true }).click()
  await expect(page.getByRole('heading', { name: firstName })).toBeVisible()
  await expect(page.locator('.product-gallery img').first()).toHaveAttribute(
    'src',
    coverSrc,
  )
  await expect(page.getByText('ขนาดเล็ก', { exact: true }).last()).toBeVisible()
  await expect(page.getByText('ราคาเริ่มต้น: ฿695.00')).toBeVisible()
  await expect(page.locator('.product-copy .markdown-content')).toContainText(
    'แก้ไขรายละเอียดช่อดอกไม้',
  )
  await expect(page.locator('.product-copy .markdown-content')).toContainText(
    'บรรทัดถัดไป',
  )
  await expect(
    page.locator('.product-copy .markdown-content li').filter({
      hasText: 'รายการใหม่',
    }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'ดูเพิ่ม' })).toHaveAttribute(
    'href',
    'https://example.com',
  )
  await expect(page.getByText('จัดด้วยใจ')).toBeVisible()
  await page.getByRole('button', { name: 'Switch to English' }).click()
  await expect(page.getByRole('heading', { name: firstName })).toBeVisible()
  await expect(page.getByText('ขนาดเล็ก', { exact: true }).last()).toBeVisible()
  await expect(page.getByText('Starting price: ฿695.00')).toBeVisible()
  await expect(page.locator('.product-copy .markdown-content')).toContainText(
    'แก้ไขรายละเอียดช่อดอกไม้',
  )
  await expect(page.locator('.product-copy .markdown-content')).toContainText(
    'บรรทัดถัดไป',
  )
  await expect(
    page.locator('.product-copy .markdown-content li').filter({
      hasText: 'รายการใหม่',
    }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'ดูเพิ่ม' })).toHaveAttribute(
    'href',
    'https://example.com',
  )
})

test('catalog mutations and image uploads reject unauthenticated callers', async ({
  request,
}) => {
  const payload = {
    name: 'Unauthorised',
    description: '',
    visible: true,
    variations: [],
    images: [],
  }
  const product = await request.post('/api/admin/catalog/products', {
    data: payload,
  })
  expect(product.status()).toBe(401)

  const image = await request.post('/api/admin/catalog/images', {
    data: { productId: 1, mimeType: 'image/png', base64: 'ZmFrZQ==' },
  })
  expect(image.status()).toBe(401)
})
