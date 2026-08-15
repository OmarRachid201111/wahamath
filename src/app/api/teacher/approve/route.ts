import { db } from '@/lib/db'
import { requireTeacher } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    if (!await requireTeacher()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
    const body = await request.json()
    const { studentId, action } = body

    if (!studentId || !action || !['approved', 'rejected'].includes(action)) {
      return NextResponse.json({ error: 'Paramètres invalides.' }, { status: 400 })
    }

    await db.student.update({
      where: { id: studentId },
      data: { status: action },
    })

    return NextResponse.json({ message: `Étudiant ${action === 'approved' ? 'approuvé' : 'refusé'}.` })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
