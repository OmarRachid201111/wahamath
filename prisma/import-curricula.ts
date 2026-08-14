import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PrismaClient } from '@prisma/client'
import { chaptersData as sm1Chapters } from '../data/curricula/sm1'

const prisma = new PrismaClient()

type ExerciseInput = { number: number; content?: string; pageStart?: number | null; pageEnd?: number | null }
type ChapterInput = { number: number; title: string; semester: string; exercises: ExerciseInput[] }
type PageMap = Record<string, number[]>

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(join(process.cwd(), relativePath), 'utf8')) as T
}

async function replaceProgramCurriculum(code: string, chapters: ChapterInput[], pageMap?: PageMap) {
  const program = await prisma.program.findUniqueOrThrow({ where: { code } })

  // This delete is intentionally scoped to one program. It never touches SM2 or another curriculum.
  await prisma.chapter.deleteMany({ where: { programId: program.id } })

  for (const chapter of chapters) {
    await prisma.chapter.create({
      data: {
        number: chapter.number,
        title: chapter.title,
        semester: chapter.semester,
        programId: program.id,
        exercises: {
          create: chapter.exercises.map((exercise) => {
            const mappedPages = pageMap?.[`${chapter.number}_${exercise.number}`]
            return {
              number: exercise.number,
              content: exercise.content || `Exercice ${exercise.number}`,
              pageStart: mappedPages?.[0] ?? exercise.pageStart ?? null,
              pageEnd: mappedPages?.[1] ?? exercise.pageEnd ?? null,
            }
          }),
        },
      },
    })
  }

  console.log(`${code}: ${chapters.length} chapters imported`)
}

async function main() {
  const pc2Chapters = readJson<ChapterInput[]>('data/curricula/pc2/chapters.json')
  const pc2PageMap = readJson<PageMap>('data/curricula/pc2/page-map.json')
  const tcsChapters = readJson<ChapterInput[]>('data/curricula/tcs/chapters.json')
  const tcsPageMap = readJson<PageMap>('data/curricula/tcs/page-map.json')

  await replaceProgramCurriculum('sm1', sm1Chapters)
  await replaceProgramCurriculum('pc2', pc2Chapters, pc2PageMap)
  await replaceProgramCurriculum('tcs', tcsChapters, tcsPageMap)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => prisma.$disconnect())
