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

  // Demo chapters and exercises for 2SM
  const chapters = [
    {
      number: 1,
      title: 'Généralités sur les fonctions',
      semester: 'Premier semestre',
      exercises: [
        { number: 1, content: 'Soit f la fonction définie sur ℝ par f(x) = x² - 3x + 2. Déterminer le sens de variation de f.' },
        { number: 2, content: 'Soit g la fonction définie sur ]0;+∞[ par g(x) = 2x + 1/x. Étudier les variations de g.' },
        { number: 3, content: 'Résoudre l\'inéquation x² - 5x + 6 ≤ 0.' },
        { number: 4, content: 'Soit h(x) = √(x² + 1). Déterminer le domaine de définition et étudier la parité.' },
        { number: 5, content: 'Montrer que pour tout x ∈ ℝ, x² + 2x + 5 > 0.' },
      ],
    },
    {
      number: 2,
      title: 'Limites et continuité',
      semester: 'Premier semestre',
      exercises: [
        { number: 1, content: 'Calculer les limites suivantes : lim(x→+∞) (3x² - x + 1)/(x² + 2).' },
        { number: 2, content: 'Calculer lim(x→0) (sin x)/x.' },
        { number: 3, content: 'Étudier la continuité de la fonction f définie par f(x) = (x²-1)/(x-1) si x≠1 et f(1)=2.' },
        { number: 4, content: 'Soit f(x) = (x³ - 1)/(x - 1). Montrer que f admet une limite en x=1 et déterminer sa valeur.' },
        { number: 5, content: 'Calculer lim(x→+∞) (√(x²+1) - x).' },
        { number: 6, content: 'Démontrer que lim(x→0) (1-cos x)/x² = 1/2.' },
      ],
    },
    {
      number: 3,
      title: 'Dérivabilité et étude de fonctions',
      semester: 'Premier semestre',
      exercises: [
        { number: 1, content: 'Soit f(x) = x³ - 3x + 1. Calculer f\'(x) et dresser le tableau de variation.' },
        { number: 2, content: 'Déterminer l\'équation de la tangente à la courbe de f(x) = √x au point d\'abscisse 4.' },
        { number: 3, content: 'Soit f(x) = (x+1)/(x-1). Calculer f\'(x) et étudier les variations.' },
        { number: 4, content: 'Montrer que la fonction f(x) = x³ - 3x est bijective de [-2;2] vers [-4;4].' },
        { number: 5, content: 'Soit f(x) = x·eˣ. Calculer f\'(x), f\'\'(x) et étudier la convexité.' },
        { number: 6, content: 'Déterminer les extremums de f(x) = x⁴ - 4x² + 3.' },
        { number: 7, content: 'Étudier la position relative de la courbe de f(x)=x² et de sa tangente en x=1.' },
      ],
    },
    {
      number: 4,
      title: 'Fonctions exponentielles et logarithmes',
      semester: 'Deuxième semestre',
      exercises: [
        { number: 1, content: 'Résoudre l\'équation e²ˣ - 3eˣ + 2 = 0.' },
        { number: 2, content: 'Simplifier l\'expression ln(x²) - 2ln(x) + ln(1/x).' },
        { number: 3, content: 'Étudier les variations de f(x) = xeˣ.' },
        { number: 4, content: 'Résoudre l\'inéquation ln(x+1) > ln(3-x).' },
        { number: 5, content: 'Calculer la dérivée de f(x) = ln(x² + 1).' },
        { number: 6, content: 'Soit f(x) = eˣ/(eˣ+1). Montrer que f est croissante et déterminer ses limites.' },
        { number: 7, content: 'Résoudre le système : ln(x) + ln(y) = ln(6) et x + y = 5.' },
        { number: 8, content: 'Étudier la fonction f(x) = (ln x)² et tracer sa courbe représentative.' },
      ],
    },
    {
      number: 5,
      title: 'Nombres complexes',
      semester: 'Deuxième semestre',
      exercises: [
        { number: 1, content: 'Déterminer le module et l\'argument du nombre complexe z = 1 + i√3.' },
        { number: 2, content: 'Résoudre dans ℂ l\'équation z² - 2z + 5 = 0.' },
        { number: 3, content: 'Soit z₁ = 1+i et z₂ = 2-i. Calculer z₁·z₂ et z₁/z₂ sous forme algébrique.' },
        { number: 4, content: 'Écrire sous forme exponentielle : z = -√2 + i√2.' },
        { number: 5, content: 'Montrer que les points A(1+i), B(3+2i) et C(2+3i) forment un triangle rectangle.' },
        { number: 6, content: 'Résoudre z³ = 8 dans ℂ.' },
        { number: 7, content: 'Déterminer l\'ensemble des points M(z) tels que |z-2i| = |z+1|.' },
      ],
    },
    {
      number: 6,
      title: 'Suites numériques',
      semester: 'Deuxième semestre',
      exercises: [
        { number: 1, content: 'Soit (uₙ) définie par u₀=2 et uₙ₊₁ = 2uₙ - 1. Exprimer uₙ en fonction de n.' },
        { number: 2, content: 'Montrer que la suite (uₙ) définie par uₙ = n²/(n+1) est divergente.' },
        { number: 3, content: 'Soit (uₙ) une suite arithmétique de raison r=3 avec u₅=17. Calculer u₀ et u₂₀.' },
        { number: 4, content: 'Étudier la convergence de la suite uₙ = (2n+1)/(3n-1).' },
        { number: 5, content: 'Soit (uₙ) définie par u₀=1 et uₙ₊₁ = (uₙ+2)/(uₙ+1). Montrer que (uₙ) est croissante et majorée par 2.' },
        { number: 6, content: 'Calculer la somme S = 1 + 1/2 + 1/4 + ... + 1/2ⁿ.' },
        { number: 7, content: 'Soit (uₙ) = (-1)ⁿ/n. Étudier la convergence de cette suite.' },
        { number: 8, content: 'Déterminer la limite de la suite uₙ = √(n+1) - √n.' },
        { number: 9, content: 'Soit (uₙ) une suite géométrique de raison q=1/2 et u₀=8. Calculer S₁₀ = u₀+u₁+...+u₁₀.' },
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
