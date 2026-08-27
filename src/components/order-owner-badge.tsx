import { Flower, UserRound } from 'lucide-react'

import { useLocale } from '#/lib/i18n'
import type { MessageKey } from '#/lib/i18n'
import { teamMemberAccentClass } from '#/lib/team-members'
import type { TeamMember } from '#/lib/team-members'
import { cn } from '#/lib/utils'

interface OrderOwnerBadgeProps {
  owner: TeamMember | null
  size?: 'default' | 'large'
  className?: string
}

export function ownerLabelKey(owner: TeamMember | null): MessageKey {
  return owner ? (`payer_${owner}` as MessageKey) : 'unassigned'
}

export function OrderOwnerBadge({
  owner,
  size = 'default',
  className,
}: OrderOwnerBadgeProps) {
  const { t } = useLocale()
  const Icon = owner ? Flower : UserRound
  return (
    <span
      className={cn(
        'owner-chip',
        teamMemberAccentClass(owner),
        size === 'large' && 'is-large',
        className,
      )}
    >
      <Icon aria-hidden="true" size={size === 'large' ? 15 : 13} />
      {t(ownerLabelKey(owner))}
    </span>
  )
}
