import { db } from '@/lib/db'
import { requireStudent } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { chapterId } = await params
    const studentId = await requireStudent()

    const student = studentId ? await db.student.findUnique({ where: { id: studentId } }) : null
    if (!student) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
    const chapter = await db.chapter.findFirst({
      where: { id: chapterId, programId: student.programId },
    })
    if (!chapter) {
      return NextResponse.json({ error: 'Chapitre non trouvé.' }, { status: 404 })
    }

    const exercises = await db.exercise.findMany({
      where: { chapterId },
      orderBy: { number: 'asc' },
    })

    const progressRecords = await db.studentExerciseProgress.findMany({
      where: { studentId, exerciseId: { in: exercises.map((e) => e.id) } },
    })

    const progressMap: Record<string, { id: string; status: string; studentNote?: string | null }> = {}
    for (const p of progressRecords) {
      progressMap[p.exerciseId] = { id: p.id, status: p.status, studentNote: p.studentNote }
    }

    return NextResponse.json({
      exercises: exercises.map((ex) => ({
        id: ex.id,
        number: ex.number,
        content: ex.content,
        chapterId: ex.chapterId,
        pageStart: ex.pageStart,
        pageEnd: ex.pageEnd,
        progress: progressMap[ex.id] || null,
      })),
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
