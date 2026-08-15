import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const unread = session.role === 'teacher'
    ? await db.studentComment.count({ where: { teacherUnread: true } })
    : await db.teacherRemark.count({ where: { studentId: session.studentId!, studentUnread: true } })
  return NextResponse.json({ unread })
}

export async function PATCH() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  if (session.role === 'teacher') {
    await db.studentComment.updateMany({ where: { teacherUnread: true }, data: { teacherUnread: false } })
  } else {
    await db.teacherRemark.updateMany({ where: { studentId: session.studentId!, studentUnread: true }, data: { studentUnread: false } })
  }
  return NextResponse.json({ ok: true })
}
