import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, className, password, phone, schoolName } = body

    if (!firstName || !lastName || !email || !className || !password) {
      return NextResponse.json({ error: 'Tous les champs requis doivent être remplis.' }, { status: 400 })
    }

    const existing = await db.student.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé.' }, { status: 409 })
    }

    const student = await db.student.create({
      data: { firstName, lastName, email, className, password, phone: phone || null, schoolName: schoolName || null, role: 'student', status: 'pending' },
    })

    return NextResponse.json({ message: 'Inscription envoyée, en attente de validation.', studentId: student.id }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
