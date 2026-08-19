import { db } from '@/lib/db'
import { requireStudent, requireTeacher } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const studentId = await requireStudent()
    if (!studentId) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })

    const instructions = await db.studentInstruction.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ instructions })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!await requireTeacher()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
    const { studentId, content } = await request.json()
    const trimmedContent = typeof content === 'string' ? content.trim() : ''
    if (!studentId || !trimmedContent) {
      return NextResponse.json({ error: 'Élève et instruction requis.' }, { status: 400 })
    }

    const student = await db.student.findFirst({ where: { id: studentId, status: 'approved' }, select: { id: true } })
    if (!student) return NextResponse.json({ error: 'Élève introuvable.' }, { status: 404 })

    const instruction = await db.studentInstruction.create({ data: { studentId, content: trimmedContent } })
    return NextResponse.json({ instruction }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
