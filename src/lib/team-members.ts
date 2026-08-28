export const TEAM_MEMBERS = ['chompooh', 'meen', 'kan'] as const

export type TeamMember = (typeof TEAM_MEMBERS)[number]

export type TeamMemberSelection =
  TeamMember | readonly TeamMember[] | null | undefined

export function isTeamMember(value: unknown): value is TeamMember {
  return TEAM_MEMBERS.includes(value as TeamMember)
}

export function normalizeTeamMembers(value: unknown): TeamMember[] {
  const values = Array.isArray(value) ? value : [value]
  return Array.from(new Set(values.filter(isTeamMember)))
}

/** Accent class for a team member, or the unassigned accent when absent. */
export function teamMemberAccentClass(member: TeamMemberSelection) {
  const owners = normalizeTeamMembers(member)
  return owners.length > 0 ? `owner-${owners[0]}` : 'owner-unassigned'
}
