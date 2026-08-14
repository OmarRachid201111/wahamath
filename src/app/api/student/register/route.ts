import { db } from '@/lib/db'
import { getProgram } from '@/lib/programs'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, className, password, phone, schoolName, programCode } = body

    if (!firstName || !lastName || !email || !className || !password || !programCode) {
      return NextResponse.json({ error: 'Tous les champs requis doivent être remplis.' }, { status: 400 })
    }

    if (!getProgram(programCode)) {
      return NextResponse.json({ error: 'Programme scolaire invalide.' }, { status: 400 })
    }

    const program = await db.program.findUnique({ where: { code: programCode } })
    if (!program) {
      return NextResponse.json({ error: 'Les programmes ne sont pas encore initialisés.' }, { status: 503 })
    }

    const existing = await db.student.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé.' }, { status: 409 })
    }

    const student = await db.student.create({
      data: { firstName, lastName, email, className, password, phone: phone || null, schoolName: schoolName || null, programId: program.id, role: 'student', status: 'pending' },
    })

    return NextResponse.json({ message: 'Inscription envoyée, en attente de validation.', studentId: student.id }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
