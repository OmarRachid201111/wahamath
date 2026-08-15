import { db } from '@/lib/db'
import { clearSession, requireStudent } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest) {
  try {
    const studentId = await requireStudent()

    if (!studentId) {
      return NextResponse.json({ error: 'ID étudiant requis.' }, { status: 400 })
    }

    await db.student.delete({ where: { id: studentId } })
    await clearSession()
    return NextResponse.json({ message: 'Compte supprimé.' })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
