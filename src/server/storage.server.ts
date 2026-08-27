import { randomUUID } from 'node:crypto'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MIME_EXTENSIONS: Record<string, string> = {
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export type StoredObject = {
  key: string
  body: Buffer
  contentType: string
}

export type ObjectStorage = {
  putObject: (
    object: Omit<StoredObject, 'key'> & { key: string },
  ) => Promise<void>
  publicUrl: (key: string) => string
  getObject?: (key: string) => Promise<StoredObject | null>
}

const storageGlobal = globalThis as typeof globalThis & {
  __verabloomLocalObjects?: Map<string, StoredObject>
}
const localObjects =
  storageGlobal.__verabloomLocalObjects ??
  (storageGlobal.__verabloomLocalObjects = new Map())

function readMemoryObject(key: string) {
  return localObjects.get(key) ?? null
}
let testStorage: ObjectStorage | undefined

function configuredPublicUrl(key: string) {
  const base =
    process.env.S3_PUBLIC_URL?.replace(/\/$/, '') ??
    (process.env.S3_BUCKET && process.env.AWS_REGION
      ? `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`
      : null)
  if (base) return `${base}/${key}`
  if (process.env.VERABLOOM_STORAGE === 'memory') {
    return `/api/catalog/image?key=${encodeURIComponent(key)}`
  }
  throw new Error('S3 storage is not configured')
}

export function getObjectStorageUrl(key: string) {
  return testStorage?.publicUrl(key) ?? configuredPublicUrl(key)
}

function createDefaultStorage(): ObjectStorage {
  const bucket = process.env.S3_BUCKET
  const region = process.env.AWS_REGION
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

  if (bucket && region) {
    return {
      async putObject(object) {
        const { PutObjectCommand, S3Client } =
          await import('@aws-sdk/client-s3')
        const client = new S3Client({
          region,
          ...(accessKeyId && secretAccessKey
            ? { credentials: { accessKeyId, secretAccessKey } }
            : {}),
        })
        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: object.key,
            Body: object.body,
            ContentType: object.contentType,
            CacheControl: 'public, max-age=31536000, immutable',
          }),
        )
      },
      publicUrl: configuredPublicUrl,
    }
  }

  if (process.env.VERABLOOM_STORAGE === 'memory') {
    return {
      async putObject(object: StoredObject) {
        localObjects.set(object.key, object)
      },
      publicUrl: configuredPublicUrl,
      async getObject(key: string) {
        return readMemoryObject(key)
      },
    }
  }

  throw new Error('S3 storage is not configured')
}

function getStorage() {
  return testStorage ?? createDefaultStorage()
}

export function setObjectStorageForTests(storage: ObjectStorage) {
  testStorage = storage
}

export function resetObjectStorageForTests() {
  testStorage = undefined
  localObjects.clear()
}

export async function uploadProductImageObject({
  productId,
  mimeType,
  base64,
}: {
  productId: number
  mimeType: string
  base64: string
}) {
  const extension = MIME_EXTENSIONS[mimeType]
  if (!extension) throw new Error('Unsupported image type')

  const body = Buffer.from(base64, 'base64')
  if (body.byteLength > MAX_IMAGE_BYTES) throw new Error('Image is too large')

  const objectKey = `verabloom/products/${productId}/${randomUUID()}.${extension}`
  const storage = getStorage()
  await storage.putObject({ key: objectKey, body, contentType: mimeType })
  return {
    objectKey,
    publicUrl: storage.publicUrl(objectKey),
  }
}

export async function getLocalObject(key: string) {
  if (process.env.VERABLOOM_STORAGE === 'memory') return readMemoryObject(key)
  const storage = getStorage()
  return storage.getObject?.(key) ?? null
}
