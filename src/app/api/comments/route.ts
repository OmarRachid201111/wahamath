import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const exerciseId = searchParams.get('exerciseId')

    const where: Record<string, unknown> = {}
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
    const { studentId, exerciseId, content } = body

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
