import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const allStudents = await db.student.findMany({
      orderBy: { createdAt: 'desc' },
      include: { progress: true },
    })

    const totalExercises = await db.exercise.count()

    const students = allStudents.filter((s) => s.status === 'approved').map((s) => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      phone: s.phone,
      className: s.className,
      schoolName: s.schoolName,
      status: s.status,
      createdAt: s.createdAt,
      progressCount: s.progress.length,
      totalExercises,
    }))

    const pendingStudents = allStudents.filter((s) => s.status === 'pending').map((s) => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      phone: s.phone,
      className: s.className,
      schoolName: s.schoolName,
      status: s.status,
      createdAt: s.createdAt,
      progressCount: s.progress.length,
      totalExercises,
    }))

    return NextResponse.json({ students, pendingStudents })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}