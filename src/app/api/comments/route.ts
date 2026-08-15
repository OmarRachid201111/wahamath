import { db } from '@/lib/db'
import { getSession, requireStudent } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const exerciseId = searchParams.get('exerciseId')

    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
    const where: Record<string, unknown> = session.role === 'student' ? { studentId: session.studentId! } : {}
    if (exerciseId) where.exerciseId = exerciseId

    const comments = await db.studentComment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, className: true, schoolName: true } },
        exercise: { select: { id: true, number: true, chapter: { select: { id: true, number: true, title: true } } } },
        remarks: { orderBy: { createdAt: 'asc' } },
      },
    })

    return NextResponse.json({ comments })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { exerciseId, content } = body
    const studentId = await requireStudent()

    if (!studentId || !content) {
      return NextResponse.json({ error: 'studentId et content requis.' }, { status: 400 })
    }

    const comment = await db.studentComment.create({
      data: { content, studentId, exerciseId: exerciseId || null },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, className: true, schoolName: true } },
      },
    })

    return NextResponse.json({ comment }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
