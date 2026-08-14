import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const programCode = new URL(request.url).searchParams.get('program')
    const allStudents = await db.student.findMany({
      where: programCode ? { program: { code: programCode } } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { progress: true, program: true },
    })

    const students = allStudents.filter((s) => s.status === 'approved').map((s) => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      phone: s.phone,
      className: s.className,
      program: s.program,
      schoolName: s.schoolName,
      status: s.status,
      createdAt: s.createdAt,
      progressCount: s.progress.length,
      totalExercises: 0,
    }))

    const pendingStudents = allStudents.filter((s) => s.status === 'pending').map((s) => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      phone: s.phone,
      className: s.className,
      program: s.program,
      schoolName: s.schoolName,
      status: s.status,
      createdAt: s.createdAt,
      progressCount: s.progress.length,
      totalExercises: 0,
    }))

    return NextResponse.json({ students, pendingStudents })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
