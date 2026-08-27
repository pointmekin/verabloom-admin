import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const lowercaseText = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value
const socialChannelSchema = z.preprocess(
  lowercaseText,
  z.enum(['line', 'instagram', 'tiktok']),
)
const deliveryMethodSchema = z.preprocess(
  lowercaseText,
  z.enum(['postal', 'messenger', 'collection']),
)

function isCalendarDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  if (![year, month, day].every(Number.isInteger)) return false
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

export const orderRequestSchema = z
  .object({
    productId: z.coerce
      .number()
      .refine(
        (value) => Number.isSafeInteger(value) && value > 0,
        'Choose a product',
      ),
    variationId: z.coerce
      .number()
      .refine(
        (value) => Number.isSafeInteger(value) && value > 0,
        'Choose a variation',
      ),
    quantity: z.coerce
      .number()
      .refine(
        (value) => Number.isSafeInteger(value) && value > 0,
        'Quantity must be a positive whole number',
      ),
    customerName: z.string().trim().min(1, 'Name is required').max(200),
    socialChannel: socialChannelSchema,
    socialContact: z.string().trim().min(1, 'Contact is required').max(320),
    phone: z.string().trim().max(60).default(''),
    requestDetails: z.string().trim().max(5000).default(''),
    deliveryMethod: deliveryMethodSchema,
    orderAddress: z.string().trim().max(1000).default(''),
    requiredDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a required date')
      .refine(isCalendarDate, 'Enter a valid date'),
    honeypot: z.string().max(200).default(''),
    website: z.string().max(200).optional(),
  })
  .superRefine((value, context) => {
    if (
      (value.deliveryMethod === 'postal' ||
        value.deliveryMethod === 'messenger') &&
      !value.orderAddress
    ) {
      context.addIssue({
        code: 'custom',
        path: ['orderAddress'],
        message: 'Address is required for delivery',
      })
    }
  })

export type OrderRequestInput = z.infer<typeof orderRequestSchema>

export const createOrderRequestFn = createServerFn({ method: 'POST' })
  .validator(orderRequestSchema)
  .handler(async ({ data }) => {
    const { createOrderRequest } = await import('./order-store.server')
    return createOrderRequest(data)
  })

export const getSocialContactsFn = createServerFn({ method: 'GET' }).handler(
  async () => getConfiguredSocialContacts(),
)

export type SocialContact = {
  channel: 'line' | 'instagram' | 'tiktok'
  url: string
}

export function getConfiguredSocialContacts(): SocialContact[] {
  const configured: Array<SocialContact | null> = [
    readSocialContact('line', ['VERABLOOM_LINE_URL', 'LINE_URL']),
    readSocialContact('instagram', [
      'VERABLOOM_INSTAGRAM_URL',
      'INSTAGRAM_URL',
    ]),
    readSocialContact('tiktok', ['VERABLOOM_TIKTOK_URL', 'TIKTOK_URL']),
  ]
  return configured.filter((contact): contact is SocialContact =>
    Boolean(contact),
  )
}

function readSocialContact(
  channel: SocialContact['channel'],
  names: string[],
): SocialContact | null {
  const url = names.map((name) => process.env[name]?.trim()).find(Boolean)
  return url ? { channel, url } : null
}
