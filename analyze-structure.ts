import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'
import path from 'path'

const PAGES_DIR = '/home/z/my-project/public/exercises-pages'
const TOTAL_PAGES = 150

async function analyzePages(pageNums: number[], zai: any) {
  const images = pageNums.map(n => {
    const filename = `page-${String(n).padStart(3, '0')}.png`
    const filepath = path.join(PAGES_DIR, filename)
    const buf = fs.readFileSync(filepath)
    return `data:image/png;base64,${buf.toString('base64')}`
  })

  const content: any[] = [
    { type: 'text', text: `Analyze these ${images.length} pages of a 2SM math exercise book. For EACH page, identify:
1. Is this a chapter title page? If yes, which chapter number (1-10) and title?
2. Is this an exercise page? If yes, list ALL exercise numbers visible on the page.
3. Is this something else (TOC, blank, etc)?

The 10 chapters are:
Ch1: Limite et Continuité – TVI – TFR
Ch2: Dérivabilité – Étude de fonction – TAF
Ch3: Suites numériques
Ch4: Fonction Logarithme
Ch5: Fonction exponentielle
Ch6: Calcul intégral
Ch7: Nombres complexes
Ch8: Arithmétique dans Z
Ch9: Structure Algébrique – Espace vectoriel
Ch10: Dénombrement - Calcul des probabilités

Return ONLY a JSON array. Each element: {"page": N, "type": "chapter_title"|"exercises"|"other", "chapter": X|null, "exercises": [1,2,...] or []}
Do NOT include markdown fences. Just the JSON array.` }
  ]
  for (const url of images) {
    content.push({ type: 'image_url', image_url: { url } })
  }

  const response = await zai.chat.completions.createVision({
    messages: [{ role: 'user', content }],
    thinking: { type: 'disabled' }
  })
  return response.choices[0]?.message?.content || '[]'
}

function parseJSON(text: string): any[] {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  try { return JSON.parse(cleaned) }
  catch { 
    const match = cleaned.match(/\[[\s\S]*\]/)
    if (match) try { return JSON.parse(match[0]) } catch { return [] }
    return []
  }
}

async function main() {
  const zai = await ZAI.create()
  const allResults: any[] = []

  // Process in batches of 15 pages
  const batchSize = 15
  for (let start = 1; start <= TOTAL_PAGES; start += batchSize) {
    const batch = Array.from({ length: Math.min(batchSize, TOTAL_PAGES - start + 1) }, (_, i) => start + i)
    console.error(`Analyzing pages ${batch[0]}-${batch[batch.length - 1]}...`)
    try {
      const raw = await analyzePages(batch, zai)
      const parsed = parseJSON(raw)
      console.error(`  Got ${parsed.length} results`)
      allResults.push(...parsed)
    } catch (e: any) {
      console.error(`  Error: ${e.message}`)
      // Retry with smaller batches of 5
      for (let i = 0; i < batch.length; i += 5) {
        const sub = batch.slice(i, i + 5)
        try {
          const raw = await analyzePages(sub, zai)
          const parsed = parseJSON(raw)
          allResults.push(...parsed)
        } catch (e2: any) {
          console.error(`  Sub-error pages ${sub[0]}-${sub[sub.length-1]}: ${e2.message}`)
          sub.forEach(p => allResults.push({ page: p, type: 'unknown', chapter: null, exercises: [] }))
        }
      }
    }
    // Small delay between batches
    await new Promise(r => setTimeout(r, 1000))
  }

  // Sort by page number
  allResults.sort((a, b) => a.page - b.page)

  // Build chapter structure
  const chapterTitles: Record<number, string> = {
    1: 'Limite et Continuité – TVI – TFR',
    2: 'Dérivabilité – Étude de fonction – TAF',
    3: 'Suites numériques',
    4: 'Fonction Logarithme',
    5: 'Fonction exponentielle',
    6: 'Calcul intégral',
    7: 'Nombres complexes',
    8: 'Arithmétique dans Z',
    9: 'Structure Algébrique – Espace vectoriel',
    10: 'Dénombrement - Calcul des probabilités',
  }

  // Track current chapter while scanning pages
  let currentChapter = 0
  const chapters: any = {}
  const exercisePages: Record<string, number[]> = {}

  for (const r of allResults) {
    if (r.type === 'chapter_title' && r.chapter) {
      currentChapter = r.chapter
      chapters[currentChapter] = { number: currentChapter, title: r.title || chapterTitles[currentChapter] || '', exercises: [], startPage: r.page }
      continue
    }
    if (r.type === 'exercises' && currentChapter > 0) {
      if (!chapters[currentChapter]) {
        chapters[currentChapter] = { number: currentChapter, title: chapterTitles[currentChapter] || '', exercises: [], startPage: r.page }
      }
      for (const exNum of (r.exercises || [])) {
        const key = `${currentChapter}_${exNum}`
        if (!exercisePages[key]) exercisePages[key] = []
        if (!exercisePages[key].includes(r.page)) exercisePages[key].push(r.page)
      }
    }
  }

  // For exercises without pages detected, estimate from chapter start
  for (const chNum of Object.keys(chapters).map(Number)) {
    const ch = chapters[chNum]
    const chExercises = Object.keys(exercisePages)
      .filter(k => k.startsWith(`${chNum}_`))
      .map(k => ({ num: parseInt(k.split('_')[1]), pages: exercisePages[k] }))
      .sort((a, b) => a.num - b.num)

    // Fill gaps - if exercise N has pages but N+1 doesn't, estimate
    for (let i = 0; i < chExercises.length; i++) {
      const ex = chExercises[i]
      const pageStart = ex.pages[0] || ch.startPage
      let pageEnd = ex.pages[ex.pages.length - 1] || pageStart
      // If next exercise starts on a later page, use page before as end
      if (i + 1 < chExercises.length && chExercises[i + 1].pages.length > 0) {
        const nextStart = chExercises[i + 1].pages[0]
        if (nextStart > pageEnd) pageEnd = nextStart - 1
      }
      ch.exercises.push({ number: ex.num, pageStart, pageEnd })
    }

    ch.totalExercises = ch.exercises.length
  }

  // Build final output
  const semesterMap: Record<number, string> = { 1: 'Premier semestre', 2: 'Premier semestre', 3: 'Premier semestre', 4: 'Premier semestre', 5: 'Premier semestre', 6: 'Premier semestre', 7: 'Deuxième semestre', 8: 'Deuxième semestre', 9: 'Deuxième semestre', 10: 'Deuxième semestre' }

  const output = {
    chapters: Object.values(chapters).sort((a: any, b: any) => a.number - b.number).map((ch: any) => ({
      number: ch.number,
      title: ch.title,
      semester: semesterMap[ch.number] || 'Premier semestre',
      exercises: ch.exercises.map((e: any) => ({ number: e.number, pageStart: e.pageStart, pageEnd: e.pageEnd }))
    }))
  }

  // Save exercises_data.json
  fs.writeFileSync('/home/z/my-project/upload/exercises_data.json', JSON.stringify(output, null, 2))
  console.error(`Saved exercises_data.json with ${output.chapters.length} chapters`)
  for (const ch of output.chapters) {
    console.error(`  Ch${ch.number}: ${ch.title} (${ch.exercises.length} exercises, pages ${ch.exercises[0]?.pageStart}-${ch.exercises[ch.exercises.length-1]?.pageEnd})`)
  }

  // Save exercise_page_mapping.json
  const mapping: Record<string, number[]> = {}
  for (const ch of output.chapters) {
    for (const ex of ch.exercises) {
      mapping[`${ch.number}_${ex.number}`] = [ex.pageStart, ex.pageEnd]
    }
  }
  fs.writeFileSync('/home/z/my-project/upload/exercise_page_mapping.json', JSON.stringify(mapping, null, 2))
  console.error(`Saved exercise_page_mapping.json`)
}

main().catch(console.error)
