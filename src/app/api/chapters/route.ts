import { db } from '@/lib/db'
import { requireStudent } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const studentId = await requireStudent()

    if (!studentId) {
      return NextResponse.json({ error: 'Student id is required.' }, { status: 400 })
    }

    const student = await db.student.findUnique({ where: { id: studentId }, include: { program: true } })
    if (!student) {
      return NextResponse.json({ error: 'Student not found.' }, { status: 404 })
    }

    const chapters = await db.chapter.findMany({
      where: { programId: student.programId },
      orderBy: { number: 'asc' },
      include: { exercises: { orderBy: { number: 'asc' } } },
    })

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
        // The unified dashboard currently has one chapter list. Keep every
        // imported curriculum visible, regardless of its original category.
        semester: 'Analyse',
        exerciseCount: ch.exercises.length,
        completedCount,
        exerciseProgress,
      }
    })

    return NextResponse.json({ chapters: result, program: student.program })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
