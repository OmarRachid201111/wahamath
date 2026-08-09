import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const teacher = await db.teacher.findFirst()
    if (!teacher) {
      return NextResponse.json({ error: 'Enseignant non trouvé.' }, { status: 404 })
    }
    const { password: _, ...teacherWithoutPassword } = teacher
    return NextResponse.json(teacherWithoutPassword)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { currentPassword, newPassword } = body

    const teacher = await db.teacher.findFirst()
    if (!teacher) {
      return NextResponse.json({ error: 'Enseignant non trouvé.' }, { status: 404 })
    }

    if (teacher.password !== currentPassword) {
      return NextResponse.json({ error: 'Mot de passe actuel incorrect.' }, { status: 401 })
    }

    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json({ error: 'Le nouveau mot de passe doit contenir au moins 4 caractères.' }, { status: 400 })
    }

    await db.teacher.update({
      where: { id: teacher.id },
      data: { password: newPassword },
    })

    return NextResponse.json({ message: 'Mot de passe modifié avec succès.' })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}