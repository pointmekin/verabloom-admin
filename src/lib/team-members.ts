export const TEAM_MEMBERS = ['chompooh', 'meen', 'kan'] as const

export type TeamMember = (typeof TEAM_MEMBERS)[number]

export function isTeamMember(value: unknown): value is TeamMember {
  return TEAM_MEMBERS.includes(value as TeamMember)
}

/** Accent class for a team member, or the unassigned accent when absent. */
export function teamMemberAccentClass(member: TeamMember | null | undefined) {
  return isTeamMember(member) ? `owner-${member}` : 'owner-unassigned'
}
