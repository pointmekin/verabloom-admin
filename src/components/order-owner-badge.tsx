import { Flower, UserRound } from 'lucide-react'

import { useLocale } from '#/lib/i18n'
import type { MessageKey } from '#/lib/i18n'
import { normalizeTeamMembers, teamMemberAccentClass } from '#/lib/team-members'
import type { TeamMember, TeamMemberSelection } from '#/lib/team-members'
import { cn } from '#/lib/utils'

interface OrderOwnerBadgeProps {
  owner: TeamMemberSelection
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
  const owners = normalizeTeamMembers(owner)
  return (
    <span className={cn('order-owner-badges', className)}>
      {owners.length > 0 ? (
        owners.map((member) => {
          const Icon = Flower
          return (
            <span
              className={cn(
                'owner-chip',
                teamMemberAccentClass(member),
                size === 'large' && 'is-large',
              )}
              key={member}
            >
              <Icon aria-hidden="true" size={size === 'large' ? 15 : 13} />
              {t(ownerLabelKey(member))}
            </span>
          )
        })
      ) : (
        <span
          className={cn(
            'owner-chip',
            teamMemberAccentClass(null),
            size === 'large' && 'is-large',
          )}
        >
          <UserRound aria-hidden="true" size={size === 'large' ? 15 : 13} />
          {t('unassigned')}
        </span>
      )}
    </span>
  )
}
