import { db } from '@/lib/db'
import { requireTeacher } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    if (!await requireTeacher()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
    const { studentId } = await params

    const student = await db.student.findUnique({ where: { id: studentId } })
    if (!student) {
      return NextResponse.json({ error: 'Student not found.' }, { status: 404 })
    }

    const totalExercises = await db.exercise.count({ where: { chapter: { programId: student.programId } } })
    const completed = await db.studentExerciseProgress.count({ where: { studentId, status: 'completed' } })
    const inProgress = await db.studentExerciseProgress.count({ where: { studentId, status: 'in_progress' } })
    const difficulty = await db.studentExerciseProgress.count({ where: { studentId, status: 'difficulty' } })

    const chapters = await db.chapter.findMany({
      where: { programId: student.programId },
      orderBy: { number: 'asc' },
      include: {
        exercises: {
          orderBy: { number: 'asc' },
          include: {
            progress: { where: { studentId } },
          },
        },
      },
    })

    const chapterData = chapters.map((ch) => {
      const completedCount = ch.exercises.filter((ex) => ex.progress[0]?.status === 'completed').length
      return {
        id: ch.id,
        number: ch.number,
        title: ch.title,
        semester: ch.semester,
        exerciseCount: ch.exercises.length,
        completedCount,
        exercises: ch.exercises.map((ex) => ({
          id: ex.id,
          number: ex.number,
          content: ex.content,
          pageStart: ex.pageStart,
          pageEnd: ex.pageEnd,
          progress: ex.progress[0] ? { id: ex.progress[0].id, status: ex.progress[0].status, studentNote: ex.progress[0].studentNote } : null,
        })),
      }
    })

    return NextResponse.json({ totalExercises, completed, inProgress, difficulty, chapters: chapterData })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
