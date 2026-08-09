import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { chapterId } = await params
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    const chapter = await db.chapter.findUnique({ where: { id: chapterId } })
    if (!chapter) {
      return NextResponse.json({ error: 'Chapitre non trouvé.' }, { status: 404 })
    }

    const exercises = await db.exercise.findMany({
      where: { chapterId },
      orderBy: { number: 'asc' },
    })

    if (!studentId) {
      return NextResponse.json({
        exercises: exercises.map((ex) => ({
          id: ex.id,
          number: ex.number,
          content: ex.content,
          chapterId: ex.chapterId,
          pageStart: ex.pageStart,
          pageEnd: ex.pageEnd,
          progress: null,
        })),
      })
    }

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
