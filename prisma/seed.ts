import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Seed teacher
  await prisma.teacher.upsert({
    where: { email: 'wahamath@hotmail.com' },
    update: {},
    create: {
      firstName: 'Br-Rachid',
      lastName: '',
      email: 'wahamath@hotmail.com',
      password: 'wahamath2026',
      status: 'Professeur de Mathématiques',
    },
  })

  // 10 chapters from the PDF - Analyse + Algèbre
  const chapters = [
    {
      number: 1,
      title: 'Limite et Continuité – TVI – TFR',
      semester: 'Analyse',
      exercises: [
        { number: 1, content: 'Exercice 1 — voir le cahier PDF' },
        { number: 2, content: 'Exercice 2 — voir le cahier PDF' },
        { number: 3, content: 'Exercice 3 — voir le cahier PDF' },
        { number: 4, content: 'Exercice 4 — voir le cahier PDF' },
        { number: 5, content: 'Exercice 5 — voir le cahier PDF' },
      ],
    },
    {
      number: 2,
      title: 'Dérivabilité – Étude de fonction – TAF',
      semester: 'Analyse',
      exercises: [
        { number: 1, content: 'Exercice 1 — voir le cahier PDF' },
        { number: 2, content: 'Exercice 2 — voir le cahier PDF' },
        { number: 3, content: 'Exercice 3 — voir le cahier PDF' },
        { number: 4, content: 'Exercice 4 — voir le cahier PDF' },
        { number: 5, content: 'Exercice 5 — voir le cahier PDF' },
      ],
    },
    {
      number: 3,
      title: 'Suites numériques',
      semester: 'Analyse',
      exercises: [
        { number: 1, content: 'Exercice 1 — voir le cahier PDF' },
        { number: 2, content: 'Exercice 2 — voir le cahier PDF' },
        { number: 3, content: 'Exercice 3 — voir le cahier PDF' },
        { number: 4, content: 'Exercice 4 — voir le cahier PDF' },
        { number: 5, content: 'Exercice 5 — voir le cahier PDF' },
      ],
    },
    {
      number: 4,
      title: 'Fonction Logarithme',
      semester: 'Analyse',
      exercises: [
        { number: 1, content: 'Exercice 1 — voir le cahier PDF' },
        { number: 2, content: 'Exercice 2 — voir le cahier PDF' },
        { number: 3, content: 'Exercice 3 — voir le cahier PDF' },
        { number: 4, content: 'Exercice 4 — voir le cahier PDF' },
        { number: 5, content: 'Exercice 5 — voir le cahier PDF' },
      ],
    },
    {
      number: 5,
      title: 'Fonction exponentielle',
      semester: 'Analyse',
      exercises: [
        { number: 1, content: 'Exercice 1 — voir le cahier PDF' },
        { number: 2, content: 'Exercice 2 — voir le cahier PDF' },
        { number: 3, content: 'Exercice 3 — voir le cahier PDF' },
        { number: 4, content: 'Exercice 4 — voir le cahier PDF' },
        { number: 5, content: 'Exercice 5 — voir le cahier PDF' },
      ],
    },
    {
      number: 6,
      title: 'Calcul intégral',
      semester: 'Analyse',
      exercises: [
        { number: 1, content: 'Exercice 1 — voir le cahier PDF' },
        { number: 2, content: 'Exercice 2 — voir le cahier PDF' },
        { number: 3, content: 'Exercice 3 — voir le cahier PDF' },
        { number: 4, content: 'Exercice 4 — voir le cahier PDF' },
        { number: 5, content: 'Exercice 5 — voir le cahier PDF' },
      ],
    },
    {
      number: 7,
      title: 'Nombres complexes',
      semester: 'Algèbre',
      exercises: [
        { number: 1, content: 'Exercice 1 — voir le cahier PDF' },
        { number: 2, content: 'Exercice 2 — voir le cahier PDF' },
        { number: 3, content: 'Exercice 3 — voir le cahier PDF' },
        { number: 4, content: 'Exercice 4 — voir le cahier PDF' },
        { number: 5, content: 'Exercice 5 — voir le cahier PDF' },
      ],
    },
    {
      number: 8,
      title: 'Arithmétique dans Z',
      semester: 'Algèbre',
      exercises: [
        { number: 1, content: 'Exercice 1 — voir le cahier PDF' },
        { number: 2, content: 'Exercice 2 — voir le cahier PDF' },
        { number: 3, content: 'Exercice 3 — voir le cahier PDF' },
        { number: 4, content: 'Exercice 4 — voir le cahier PDF' },
        { number: 5, content: 'Exercice 5 — voir le cahier PDF' },
      ],
    },
    {
      number: 9,
      title: 'Structure Algébrique – Espace vectoriel',
      semester: 'Algèbre',
      exercises: [
        { number: 1, content: 'Exercice 1 — voir le cahier PDF' },
        { number: 2, content: 'Exercice 2 — voir le cahier PDF' },
        { number: 3, content: 'Exercice 3 — voir le cahier PDF' },
        { number: 4, content: 'Exercice 4 — voir le cahier PDF' },
        { number: 5, content: 'Exercice 5 — voir le cahier PDF' },
      ],
    },
    {
      number: 10,
      title: 'Dénombrement - Calcul des probabilités',
      semester: 'Algèbre',
      exercises: [
        { number: 1, content: 'Exercice 1 — voir le cahier PDF' },
        { number: 2, content: 'Exercice 2 — voir le cahier PDF' },
        { number: 3, content: 'Exercice 3 — voir le cahier PDF' },
        { number: 4, content: 'Exercice 4 — voir le cahier PDF' },
        { number: 5, content: 'Exercice 5 — voir le cahier PDF' },
      ],
    },
  ]

  for (const ch of chapters) {
    const chapter = await prisma.chapter.upsert({
      where: { number: ch.number },
      update: { title: ch.title, semester: ch.semester },
      create: { number: ch.number, title: ch.title, semester: ch.semester },
    })

    for (const ex of ch.exercises) {
      await prisma.exercise.upsert({
        where: { chapterId_number: { chapterId: chapter.id, number: ex.number } },
        update: { content: ex.content },
        create: { number: ex.number, content: ex.content, chapterId: chapter.id },
      })
    }
  }

  console.log('✅ Seed completed successfully!')
  console.log(`   - 1 teacher created`)
  console.log(`   - ${chapters.length} chapters created`)
  console.log(`   - ${chapters.reduce((a, c) => a + c.exercises.length, 0)} exercises created`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
