import { db } from '@/lib/db'
import { requireTeacher } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    if (!await requireTeacher()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
    const { studentId } = await params
    await db.student.delete({ where: { id: studentId } })
    return NextResponse.json({ message: 'Élève supprimé.' })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
