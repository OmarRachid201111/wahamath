import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!password) {
      return NextResponse.json({ error: 'Mot de passe requis.' }, { status: 400 })
    }

    const teacher = email
      ? await db.teacher.findUnique({ where: { email } })
      : await db.teacher.findFirst()

    if (!teacher || teacher.password !== password) {
      return NextResponse.json({ error: 'Identifiants incorrects.' }, { status: 401 })
    }

    const { password: _, ...teacherWithoutPassword } = teacher
    return NextResponse.json(teacherWithoutPassword)
  } catch (error) {
    console.error('Teacher login failed:', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
