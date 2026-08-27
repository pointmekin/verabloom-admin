import { Bike, Package, Store } from 'lucide-react'

import { useLocale } from '#/lib/i18n'
import { cn } from '#/lib/utils'

export type DeliveryMethod = 'postal' | 'messenger' | 'collection'

const deliveryIcons = {
  postal: Package,
  messenger: Bike,
  collection: Store,
} as const

interface DeliveryBadgeProps {
  method: DeliveryMethod
  className?: string
}

export function DeliveryBadge({ method, className }: DeliveryBadgeProps) {
  const { t } = useLocale()
  const Icon = deliveryIcons[method]
  return (
    <span className={cn('delivery-chip', `delivery-${method}`, className)}>
      <Icon aria-hidden="true" size={13} />
      {t(method)}
    </span>
  )
}
