import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    const chapters = await db.chapter.findMany({
      orderBy: { number: 'asc' },
      include: { exercises: { orderBy: { number: 'asc' } } },
    })

    if (!studentId) {
      return NextResponse.json({
        chapters: chapters.map((ch) => ({
          id: ch.id,
          number: ch.number,
          title: ch.title,
          semester: ch.semester,
          exerciseCount: ch.exercises.length,
          completedCount: 0,
        })),
      })
    }

    const progressRecords = await db.studentExerciseProgress.findMany({
      where: { studentId },
    })

    const progressMap: Record<string, { status: string; studentNote?: string | null }> = {}
    for (const p of progressRecords) {
      progressMap[p.exerciseId] = { status: p.status, studentNote: p.studentNote }
    }

    const result = chapters.map((ch) => {
      const exerciseProgress = progressMap
      let completedCount = 0
      for (const ex of ch.exercises) {
        if (progressMap[ex.id]?.status === 'completed') completedCount++
      }
      return {
        id: ch.id,
        number: ch.number,
        title: ch.title,
        semester: ch.semester,
        exerciseCount: ch.exercises.length,
        completedCount,
        exerciseProgress,
      }
    })

    return NextResponse.json({ chapters: result })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
