import { afterEach, describe, expect, it } from 'vitest'

import {
  resetObjectStorageForTests,
  setObjectStorageForTests,
  uploadOrderImageObject,
  uploadProductImageObject,
} from './storage.server'

describe('product image storage boundary', () => {
  afterEach(() => resetObjectStorageForTests())

  it('writes product images below the dedicated verabloom prefix', async () => {
    const writes: Array<{ key: string; body: Buffer; contentType: string }> = []
    setObjectStorageForTests({
      putObject: async (object) => {
        writes.push(object)
      },
      publicUrl: (key) => `https://cdn.example.test/${key}`,
    })

    const result = await uploadProductImageObject({
      productId: 42,
      mimeType: 'image/png',
      base64: Buffer.from('fake-image').toString('base64'),
    })

    expect(result.objectKey).toMatch(/^verabloom\/products\/42\/[\w-]+\.png$/)
    expect(result.publicUrl).toBe(
      `https://cdn.example.test/${result.objectKey}`,
    )
    expect(writes).toHaveLength(1)
    expect(writes[0]?.contentType).toBe('image/png')
    expect(writes[0]?.body.toString()).toBe('fake-image')
  })

  it('writes order reference images below the order-specific prefix', async () => {
    const writes: Array<{ key: string; body: Buffer; contentType: string }> = []
    setObjectStorageForTests({
      putObject: async (object) => {
        writes.push(object)
      },
      publicUrl: (key) => `https://cdn.example.test/${key}`,
    })

    const result = await uploadOrderImageObject({
      orderId: 42,
      mimeType: 'image/webp',
      base64: Buffer.from('order-image').toString('base64'),
    })

    expect(result.objectKey).toMatch(/^verabloom\/orders\/42\/[\w-]+\.webp$/)
    expect(result.publicUrl).toBe(
      `https://cdn.example.test/${result.objectKey}`,
    )
    expect(writes).toHaveLength(1)
    expect(writes[0]?.contentType).toBe('image/webp')
    expect(writes[0]?.body.toString()).toBe('order-image')
  })

  it('rejects unsupported image types and oversized payloads', async () => {
    await expect(
      uploadProductImageObject({
        productId: 1,
        mimeType: 'text/plain',
        base64: 'dGVzdA==',
      }),
    ).rejects.toThrow('Unsupported image type')

    await expect(
      uploadProductImageObject({
        productId: 1,
        mimeType: 'image/jpeg',
        base64: Buffer.alloc(10 * 1024 * 1024 + 1).toString('base64'),
      }),
    ).rejects.toThrow('Image is too large')
  })
})
