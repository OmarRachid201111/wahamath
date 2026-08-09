import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('id')

    if (!studentId) {
      return NextResponse.json({ error: 'ID étudiant requis.' }, { status: 400 })
    }

    await db.student.delete({ where: { id: studentId } })
    return NextResponse.json({ message: 'Compte supprimé.' })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
