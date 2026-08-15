import { db } from '@/lib/db'
import { requireTeacher } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const teacherId = await requireTeacher()
    if (!teacherId) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
    const teacher = await db.teacher.findUnique({ where: { id: teacherId } })
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
    const teacherId = await requireTeacher()
    if (!teacherId) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
    const body = await request.json()
    const { currentPassword, newPassword } = body

    const teacher = await db.teacher.findUnique({ where: { id: teacherId } })
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
