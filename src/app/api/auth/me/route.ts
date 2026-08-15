import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const user = session.role === 'student' ? await db.student.findUnique({ where: { id: session.studentId! }, include: { program: true } }) : await db.teacher.findUnique({ where: { id: session.teacherId! } })
  if (!user) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const { password: _, ...safeUser } = user
  return NextResponse.json({ user: safeUser, view: session.role })
}
