import { createHash, randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

const COOKIE_NAME = 'wahamath_session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14

const hash = (token: string) => createHash('sha256').update(token).digest('hex')

export async function createSession(role: 'student' | 'teacher', id: string) {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + MAX_AGE_SECONDS * 1000)
  await db.session.create({
    data: { tokenHash: hash(token), role, expiresAt, ...(role === 'student' ? { studentId: id } : { teacherId: id }) },
  })
  const jar = await cookies()
  jar.set(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', expires: expiresAt })
}

export async function getSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value
  if (!token) return null
  return db.session.findFirst({ where: { tokenHash: hash(token), expiresAt: { gt: new Date() } } })
}

export async function requireStudent() {
  const session = await getSession()
  return session?.role === 'student' && session.studentId ? session.studentId : null
}

export async function requireTeacher() {
  const session = await getSession()
  return session?.role === 'teacher' && session.teacherId ? session.teacherId : null
}

export async function clearSession() {
  const jar = await cookies()
  const token = jar.get(COOKIE_NAME)?.value
  if (token) await db.session.deleteMany({ where: { tokenHash: hash(token) } })
  jar.delete(COOKIE_NAME)
}
