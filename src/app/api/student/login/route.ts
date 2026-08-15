import { db } from '@/lib/db'
import { createSession } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis.' }, { status: 400 })
    }

    const student = await db.student.findUnique({ where: { email }, include: { program: true } })
    if (!student || student.password !== password) {
      return NextResponse.json({ error: 'Identifiants incorrects.' }, { status: 401 })
    }

    if (student.status === 'pending') {
      return NextResponse.json({ error: 'Votre inscription est en attente de validation.' }, { status: 403 })
    }
    if (student.status === 'rejected') {
      return NextResponse.json({ error: 'Votre inscription a été refusée.' }, { status: 403 })
    }

    await createSession('student', student.id)

    await createSession('student', student.id)
    const { password: _, ...studentWithoutPassword } = student
    return NextResponse.json(studentWithoutPassword)
  } catch (error) {
    console.error('Student login failed:', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
