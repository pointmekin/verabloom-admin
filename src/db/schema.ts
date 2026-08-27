import {
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  visible: boolean('visible').notNull().default(true),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const productVariations = pgTable('product_variations', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  startingPriceThb: numeric('starting_price_thb', { precision: 12, scale: 2 }),
  displayOrder: integer('display_order').notNull().default(0),
})

export const productImages = pgTable('product_images', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  objectKey: text('object_key').notNull(),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  socialChannel: text('social_channel').notNull(),
  socialContact: text('social_contact').notNull(),
  phone: text('phone'),
  defaultAddress: text('default_address'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  requestReference: text('request_reference').notNull().unique(),
  status: text('status').notNull().default('pending_review'),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'restrict' }),
  variationId: integer('variation_id')
    .notNull()
    .references(() => productVariations.id, { onDelete: 'restrict' }),
  productNameSnapshot: text('product_name_snapshot').notNull(),
  variationNameSnapshot: text('variation_name_snapshot').notNull(),
  startingPriceThbSnapshot: numeric('starting_price_thb_snapshot', {
    precision: 12,
    scale: 2,
  }),
  quantity: integer('quantity').notNull(),
  customerName: text('customer_name').notNull(),
  socialChannel: text('social_channel').notNull(),
  socialContact: text('social_contact').notNull(),
  phone: text('phone'),
  requestDetails: text('request_details').notNull().default(''),
  deliveryMethod: text('delivery_method').notNull(),
  orderAddress: text('order_address'),
  requiredDate: date('required_date', { mode: 'string' }).notNull(),
  customerId: integer('customer_id').references(() => customers.id, {
    onDelete: 'restrict',
  }),
  orderValueThb: numeric('order_value_thb', { precision: 12, scale: 2 }),
  internalNote: text('internal_note'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  amountThb: numeric('amount_thb', { precision: 12, scale: 2 }).notNull(),
  paymentDate: date('payment_date', { mode: 'string' }).notNull(),
  method: text('method').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  description: text('description').notNull(),
  payer: text('payer').notNull(),
  totalAmountThb: numeric('total_amount_thb', {
    precision: 12,
    scale: 2,
  }).notNull(),
  expenseDate: date('expense_date', { mode: 'string' }).notNull(),
  quantity: integer('quantity'),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export type Product = typeof products.$inferSelect
export type ProductVariation = typeof productVariations.$inferSelect
export type ProductImage = typeof productImages.$inferSelect
export type Customer = typeof customers.$inferSelect
export type Order = typeof orders.$inferSelect
export type Payment = typeof payments.$inferSelect
export type Expense = typeof expenses.$inferSelect
