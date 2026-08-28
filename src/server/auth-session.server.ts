import { createHash, timingSafeEqual } from 'node:crypto'

import { getCookie, useSession } from '@tanstack/react-start/server'

import { SESSION_COOKIE_NAME, createSessionConfig } from './session-config'

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
  // Reading a missing session makes the session library write a new empty
  // cookie. Skip that write so a request without the cookie cannot replace a
  // valid session.
  if (!getCookie(SESSION_COOKIE_NAME)) {
    return false
  }
  const session = await adminSession()
  return session.data.authenticated === true
}

export async function clearAdminSession() {
  const session = await adminSession()
  await session.clear()
}
