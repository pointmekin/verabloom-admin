import { createHash, timingSafeEqual } from 'node:crypto'

import { useSession } from '@tanstack/react-start/server'

import { createSessionConfig } from './session-config'

type AdminSession = {
  authenticated: true
}

function requiredEnvironment(
  name: 'ADMIN_EMAIL' | 'ADMIN_PASSWORD' | 'SESSION_SECRET',
) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not configured`)
  }
  return value
}

function matchesSecret(value: string, expected: string) {
  const valueHash = createHash('sha256').update(value).digest()
  const expectedHash = createHash('sha256').update(expected).digest()
  return timingSafeEqual(valueHash, expectedHash)
}

async function adminSession() {
  return useSession<AdminSession>(
    createSessionConfig(requiredEnvironment('SESSION_SECRET')),
  )
}

export async function authenticateAdmin(email: string, password: string) {
  const emailMatches = matchesSecret(email, requiredEnvironment('ADMIN_EMAIL'))
  const passwordMatches = matchesSecret(
    password,
    requiredEnvironment('ADMIN_PASSWORD'),
  )
  if (!emailMatches || !passwordMatches) {
    return false
  }
  const session = await adminSession()
  await session.update({ authenticated: true })
  return true
}

export async function hasAdminSession() {
  const session = await adminSession()
  return session.data.authenticated === true
}

export async function clearAdminSession() {
  const session = await adminSession()
  await session.clear()
}
