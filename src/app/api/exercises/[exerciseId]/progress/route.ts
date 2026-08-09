import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ exerciseId: string }> }
) {
  try {
    const { exerciseId } = await params
    const body = await request.json()
    const { studentId, status, studentNote } = body

    if (!studentId || !status) {
      return NextResponse.json({ error: 'studentId et status requis.' }, { status: 400 })
    }

    const validStatuses = ['not_started', 'in_progress', 'completed', 'difficulty']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Statut invalide.' }, { status: 400 })
    }

    const progress = await db.studentExerciseProgress.upsert({
      where: { studentId_exerciseId: { studentId, exerciseId } },
      update: { status, studentNote: studentNote ?? null },
      create: { studentId, exerciseId, status, studentNote: studentNote ?? null },
    })

    return NextResponse.json({ progress: { id: progress.id, status: progress.status, studentNote: progress.studentNote } })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
