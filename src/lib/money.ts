const bahtPattern = /^\d+(?:\.\d{1,2})?$/

export type OrderStatusForTotals =
  'pending_review' | 'confirmed' | 'completed' | 'cancelled'

export type OrderLike = {
  status: OrderStatusForTotals
  orderValueThb: string | null
}

export type PaymentLike = { amountThb: string }

export function parseBahtToSatang(value: string | null | undefined) {
  const trimmed = value?.trim() ?? ''
  if (!bahtPattern.test(trimmed)) return null
  const [baht, satang = ''] = trimmed.split('.')
  return Number(baht) * 100 + Number(satang.padEnd(2, '0'))
}

export function satangToDecimalString(satang: number) {
  const negative = satang < 0
  const absolute = Math.abs(Math.trunc(satang))
  const baht = String(Math.trunc(absolute / 100))
  const remainder = String(absolute % 100).padStart(2, '0')
  return `${negative ? '-' : ''}${baht}.${remainder}`
}

export function sumPaymentsSatang(payments: readonly PaymentLike[]) {
  let total = 0
  for (const item of payments) {
    const satang = parseBahtToSatang(item.amountThb)
    if (satang === null) throw new Error('Enter a valid Thai baht amount')
    total += satang
  }
  return total
}

export function orderOutstandingSatang(
  order: Pick<OrderLike, 'status' | 'orderValueThb'>,
  paymentsSatang: number,
) {
  const value = parseBahtToSatang(order.orderValueThb)
  if (order.status === 'cancelled' || value === null) return 0
  return Math.max(0, value - paymentsSatang)
}

export function orderTotals(
  order: Pick<OrderLike, 'status' | 'orderValueThb'>,
  payments: readonly PaymentLike[],
): { receivedThb: string; outstandingThb: string } {
  const received = sumPaymentsSatang(payments)
  const outstanding = orderOutstandingSatang(order, received)
  return {
    receivedThb: satangToDecimalString(received),
    outstandingThb: satangToDecimalString(outstanding),
  }
}

export function formatThb(decimalString: string) {
  const [whole, fraction = '00'] = decimalString.split('.')
  const sign = whole.startsWith('-') ? '-' : ''
  const digits = sign ? whole.slice(1) : whole
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${sign}฿${grouped}.${fraction.padEnd(2, '0').slice(0, 2)}`
}
