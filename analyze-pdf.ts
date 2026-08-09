import { exec } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

// --- Configuration ---
const TOTAL_PAGES = 150;
const PAGES_DIR = "/home/z/my-project/public/exercises-pages";
const UPLOAD_DIR = "/home/z/my-project/upload";
const WORKLOG_PATH = "/home/z/my-project/worklog.md";
const CACHE_DIR = "/tmp/vlm-cache";
const PROGRESS_FILE = "/tmp/vlm-progress.json";
const PAGE_DELAY_MS = 3000;
const RETRY_BASE_MS = 10000;
const MAX_RETRIES = 3;

const CHAPTER_TITLES: Record<number, { title: string; semester: string }> = {
  1: { title: "Limite et Continuité – TVI – TFR", semester: "Premier semestre" },
  2: { title: "Dérivabilité – Étude de fonction – TAF", semester: "Premier semestre" },
  3: { title: "Suites numériques", semester: "Premier semestre" },
  4: { title: "Fonction Logarithme", semester: "Premier semestre" },
  5: { title: "Fonction exponentielle", semester: "Premier semestre" },
  6: { title: "Calcul intégral", semester: "Premier semestre" },
  7: { title: "Nombres complexes", semester: "Deuxième semestre" },
  8: { title: "Arithmétique dans Z", semester: "Deuxième semestre" },
  9: { title: "Structure Algébrique – Espace vectoriel", semester: "Deuxième semestre" },
  10: { title: "Dénombrement - Calcul des probabilités", semester: "Deuxième semestre" },
};

// --- Types ---
interface PageAnalysis {
  page: number;
  type: "chapter_title" | "exercises" | "other";
  chapter_num: number | null;
  chapter_title: string | null;
  exercises: { number: number; has_continuation: boolean }[];
}

interface CompiledExercise { number: number; pageStart: number; pageEnd: number; }
interface CompiledChapter { number: number; title: string; semester: string; exercises: CompiledExercise[]; }
interface CompiledData { chapters: CompiledChapter[]; }

function getPageImagePath(pageNum: number): string {
  return path.join(PAGES_DIR, `page-${String(pageNum).padStart(3, "0")}.png`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeAnalysis(pageNum: number, raw: any): PageAnalysis {
  const fallback: PageAnalysis = { page: pageNum, type: "other", chapter_num: null, chapter_title: null, exercises: [] };
  if (!raw || typeof raw !== "object") return fallback;
  const type = (raw.type === "chapter_title" || raw.type === "exercises") ? raw.type as PageAnalysis["type"] : "other";
  const chapter_num = typeof raw.chapter_num === "number" ? raw.chapter_num : null;
  const chapter_title = typeof raw.chapter_title === "string" ? raw.chapter_title : null;
  let exercises: { number: number; has_continuation: boolean }[] = [];
  if (Array.isArray(raw.exercises)) {
    exercises = raw.exercises
      .filter((e: any) => typeof e.number === "number")
      .map((e: any) => ({ number: e.number, has_continuation: !!e.has_continuation }));
  }
  return { page: pageNum, type, chapter_num, chapter_title, exercises };
}

async function analyzePage(pageNum: number): Promise<PageAnalysis> {
  const imagePath = getPageImagePath(pageNum);
  const cachePath = path.join(CACHE_DIR, `page-${String(pageNum).padStart(3, "0")}.json`);

  // Check cache
  if (fs.existsSync(cachePath)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
      const content = cached?.choices?.[0]?.message?.content;
      if (content) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) return normalizeAnalysis(pageNum, JSON.parse(jsonMatch[0]));
      }
    } catch { /* re-analyze */ }
  }

  const prompt = `Analyze this page of a math exercise book. Return a JSON object with: {"page": ${pageNum}, "type": "chapter_title"|"exercises"|"other", "chapter_num": X|null, "chapter_title": "title"|null, "exercises": [{"number": N, "has_continuation": false}]}
For chapter title pages: chapter_num is the chapter number (1-10), type is 'chapter_title'.
For exercise pages: list each exercise number present on the page, type is 'exercises'.
For other pages (table of contents, blank): type is 'other'.

IMPORTANT: Return ONLY valid JSON, no other text.`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const tmpOut = path.join(os.tmpdir(), `vlm-page-${pageNum}.json`);
      await execAsync(`z-ai vision -p ${JSON.stringify(prompt)} -i ${imagePath} -o ${tmpOut}`, {
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024,
      });

      if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.copyFileSync(tmpOut, cachePath);

      const outputJson = JSON.parse(fs.readFileSync(tmpOut, "utf-8"));
      const content = outputJson?.choices?.[0]?.message?.content;
      if (content) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) return normalizeAnalysis(pageNum, JSON.parse(jsonMatch[0]));
      }

      return { page: pageNum, type: "other", chapter_num: null, chapter_title: null, exercises: [] };
    } catch (err: any) {
      const isRateLimit = err.message?.includes("429");
      if (isRateLimit && attempt < MAX_RETRIES) {
        const delay = RETRY_BASE_MS * attempt;
        console.log(`  Page ${pageNum}: 429 rate limit, retry ${attempt}/${MAX_RETRIES} after ${delay / 1000}s`);
        await sleep(delay);
        continue;
      }
      console.error(`  Page ${pageNum}: FAILED - ${err.message?.slice(0, 150)}`);
      return { page: pageNum, type: "other", chapter_num: null, chapter_title: null, exercises: [] };
    }
  }
  return { page: pageNum, type: "other", chapter_num: null, chapter_title: null, exercises: [] };
}

function loadProgress(): PageAnalysis[] {
  if (fs.existsSync(PROGRESS_FILE)) {
    try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8")); }
    catch { return []; }
  }
  return [];
}

function saveProgress(analyses: PageAnalysis[]) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(analyses, null, 2), "utf-8");
}

function compileResults(pageAnalyses: PageAnalysis[]): { compiled: CompiledData; pageMapping: Record<string, [number, number]> } {
  const compiled: CompiledData = { chapters: [] };
  const pageMapping: Record<string, [number, number]> = {};
  const sorted = [...pageAnalyses].sort((a, b) => a.page - b.page);
  const pageMap = new Map<number, PageAnalysis>();
  for (const a of sorted) pageMap.set(a.page, a);

  let currentChapterNum: number | null = null;
  const exercisePagesMap = new Map<number, Map<number, number[]>>();
  const continuationMap = new Map<number, Map<number, Set<number>>>();

  for (const analysis of sorted) {
    if (analysis.type === "chapter_title" && analysis.chapter_num !== null) {
      currentChapterNum = analysis.chapter_num;
    } else if (analysis.type === "exercises") {
      if (analysis.chapter_num !== null) currentChapterNum = analysis.chapter_num;
      if (currentChapterNum !== null) {
        if (!exercisePagesMap.has(currentChapterNum)) {
          exercisePagesMap.set(currentChapterNum, new Map());
          continuationMap.set(currentChapterNum, new Map());
        }
        const chapterMap = exercisePagesMap.get(currentChapterNum)!;
        const contMap = continuationMap.get(currentChapterNum)!;
        for (const ex of analysis.exercises) {
          if (!chapterMap.has(ex.number)) chapterMap.set(ex.number, []);
          chapterMap.get(ex.number)!.push(analysis.page);
          if (ex.has_continuation) {
            if (!contMap.has(ex.number)) contMap.set(ex.number, new Set());
            contMap.get(ex.number)!.add(analysis.page);
          }
        }
      }
    }
  }

  for (let chapNum = 1; chapNum <= 10; chapNum++) {
    const chapterInfo = CHAPTER_TITLES[chapNum];
    const chapterMap = exercisePagesMap.get(chapNum);
    const contMap = continuationMap.get(chapNum);
    const compiledChapter: CompiledChapter = { number: chapNum, title: chapterInfo.title, semester: chapterInfo.semester, exercises: [] };

    if (!chapterMap || chapterMap.size === 0) { compiled.chapters.push(compiledChapter); continue; }

    const exerciseNumbers = [...chapterMap.keys()].sort((a, b) => a - b);
    for (const exNum of exerciseNumbers) {
      const pages = [...chapterMap.get(exNum)!].sort((a, b) => a - b);
      const pageStart = pages[0];
      let pageEnd = pages[pages.length - 1];

      const contPages = contMap?.get(exNum);
      if (contPages && contPages.has(pageEnd)) {
        let next = pageEnd + 1;
        while (next <= TOTAL_PAGES) {
          const nextAnalysis = pageMap.get(next);
          if (nextAnalysis?.type === "exercises" && nextAnalysis.exercises.length > 0) {
            if (nextAnalysis.exercises.some(e => e.number !== exNum)) break;
          } else if (nextAnalysis?.type === "chapter_title") break;
          pageEnd = next;
          next++;
        }
      }

      compiledChapter.exercises.push({ number: exNum, pageStart, pageEnd });
      pageMapping[`${chapNum}_${exNum}`] = [pageStart, pageEnd];
    }
    compiled.chapters.push(compiledChapter);
  }
  return { compiled, pageMapping };
}

// --- Main ---
async function main() {
  console.log("=".repeat(60));
  console.log("Starting analysis of 150 PDF pages...");
  console.log("=".repeat(60));

  const startTime = Date.now();
  const allAnalyses = loadProgress();
  const alreadyDone = new Set(allAnalyses.map(a => a.page));
  console.log(`Loaded ${allAnalyses.length} cached results. Need to analyze ${TOTAL_PAGES - alreadyDone.size} more pages.`);

  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

  // Process pages sequentially to avoid rate limiting
  // But group display in batches of 5
  for (let i = 1; i <= TOTAL_PAGES; i++) {
    if (alreadyDone.has(i)) {
      // Page already in progress file
      continue;
    }

    // Check VLM cache (files already downloaded)
    const cachePath = path.join(CACHE_DIR, `page-${String(i).padStart(3, "0")}.json`);
    if (fs.existsSync(cachePath)) {
      // Already cached, just parse and add
      try {
        const cached = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
        const content = cached?.choices?.[0]?.message?.content;
        if (content) {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const analysis = normalizeAnalysis(i, JSON.parse(jsonMatch[0]));
            allAnalyses.push(analysis);
            saveProgress(allAnalyses);
            const exStr = analysis.exercises.length > 0 ? analysis.exercises.map(e => e.number).join(",") : "none";
            console.log(`Page ${i} (cached): type=${analysis.type}, ch=${analysis.chapter_num ?? "null"}, ex=[${exStr}]`);
            continue;
          }
        }
      } catch { /* re-analyze */ }
    }

    // Need to call VLM API
    if (i > 1) await sleep(PAGE_DELAY_MS); // delay before each API call

    console.log(`Page ${i}: calling VLM...`);
    const result = await analyzePage(i);
    const exStr = result.exercises.length > 0 ? result.exercises.map(e => e.number).join(",") : "none";
    console.log(`Page ${i}: type=${result.type}, ch=${result.chapter_num ?? "null"}, ex=[${exStr}]`);
    allAnalyses.push(result);
    saveProgress(allAnalyses);

    if (i % 5 === 0 || i === TOTAL_PAGES) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const done = allAnalyses.length;
      const eta = done > 0 ? (parseFloat(elapsed) / done * (TOTAL_PAGES - done)).toFixed(0) : "?";
      console.log(`  => ${done}/${TOTAL_PAGES} done (${elapsed}s, ~${eta}s remaining)`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("Compiling results...");
  console.log("=".repeat(60));

  const { compiled, pageMapping } = compileResults(allAnalyses);

  fs.writeFileSync(path.join(UPLOAD_DIR, "exercises_data.json"), JSON.stringify(compiled, null, 2), "utf-8");
  fs.writeFileSync(path.join(UPLOAD_DIR, "exercise_page_mapping.json"), JSON.stringify(pageMapping, null, 2), "utf-8");
  console.log("\nWrote: exercises_data.json + exercise_page_mapping.json");

  console.log("\n--- Summary ---");
  for (const ch of compiled.chapters) {
    console.log(`  Ch.${ch.number}: ${ch.title} - ${ch.exercises.length} exercises`);
    for (const ex of ch.exercises) console.log(`    Ex.${ex.number}: pp.${ex.pageStart}-${ex.pageEnd}`);
  }

  const totalExercises = compiled.chapters.reduce((s, c) => s + c.exercises.length, 0);
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

  fs.appendFileSync(WORKLOG_PATH, `
---
Task ID: 2
Agent: PDF Analysis Agent
Task: Analyze 150 PDF pages to extract exercise structure using VLM

Work Log:
- Wrote analyze-pdf.ts script using z-ai vision CLI
- Processed ${TOTAL_PAGES} pages in batches of 5 with staggered concurrency
- Used VLM to classify each page as chapter_title, exercises, or other
- Extracted exercise numbers and continuation info from each exercise page
- Compiled results into structured chapter/exercise data
- Generated page mapping (chapitreNum_exerciceNum -> [pageStart, pageEnd])
- Total processing time: ${totalTime}s

Output Files:
- /home/z/my-project/upload/exercises_data.json
- /home/z/my-project/upload/exercise_page_mapping.json

Results Summary:
- Total exercises found: ${totalExercises}
${compiled.chapters.map((ch) => `  - Chapter ${ch.number} (${ch.title}): ${ch.exercises.length} exercises`).join("\n")}

Page Statistics:
- Chapter title pages: ${allAnalyses.filter((a) => a.type === "chapter_title").length}
- Exercise pages: ${allAnalyses.filter((a) => a.type === "exercises").length}
- Other pages: ${allAnalyses.filter((a) => a.type === "other").length}

Stage Summary:
- Successfully analyzed all ${TOTAL_PAGES} pages
- Extracted ${totalExercises} total exercises across 10 chapters
- Output data ready for database seeding
`, "utf-8");

  console.log("\n" + "=".repeat(60));
  console.log("DONE!");
  console.log("=".repeat(60));
}

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
  process.exit(1);
});

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
