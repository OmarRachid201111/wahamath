import { db } from '@/lib/db'
import { requireTeacher } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    if (!await requireTeacher()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
    const comments = await db.studentComment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, className: true, schoolName: true } },
        exercise: { select: { id: true, number: true, chapter: { select: { id: true, number: true, title: true } } } },
        remarks: { orderBy: { createdAt: 'asc' } },
      },
    })

    return NextResponse.json({ comments })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!await requireTeacher()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
    const body = await request.json()
    const { studentId, commentId, content } = body

    if (!studentId || !commentId || !content) {
      return NextResponse.json({ error: 'Tous les champs sont requis.' }, { status: 400 })
    }

    const remark = await db.teacherRemark.create({
      data: { content, studentId, commentId },
    })

    return NextResponse.json({ remark }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!await requireTeacher()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Réponse requise.' }, { status: 400 })

    const result = await db.teacherRemark.deleteMany({ where: { id } })
    if (!result.count) return NextResponse.json({ error: 'Réponse introuvable.' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
