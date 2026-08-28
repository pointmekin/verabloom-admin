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
  size?: 'default' | 'large'
  className?: string
}

export function DeliveryBadge({
  method,
  size = 'default',
  className,
}: DeliveryBadgeProps) {
  const { t } = useLocale()
  const Icon = deliveryIcons[method]
  return (
    <span
      className={cn(
        'delivery-chip',
        `delivery-${method}`,
        size === 'large' && 'is-large',
        className,
      )}
    >
      <Icon aria-hidden="true" size={size === 'large' ? 15 : 13} />
      {t(method)}
    </span>
  )
}
