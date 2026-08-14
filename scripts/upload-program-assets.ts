import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { put } from '@vercel/blob'

const token = process.env.BLOB_READ_WRITE_TOKEN
if (!token) throw new Error('BLOB_READ_WRITE_TOKEN is required')

const sources = [
  { source: 'public/programs/sm1', destination: 'programs/sm1' },
  { source: 'public/programs/pc2', destination: 'programs/pc2' },
  { source: 'public/programs/tcs', destination: 'programs/tcs' },
]

async function filesIn(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? filesIn(path) : [path]
  }))
  return nested.flat()
}

async function main() {
  const groups = await Promise.all(sources.map(async ({ source, destination }) =>
    (await filesIn(source)).map((file) => ({
      file,
      pathname: `${destination}/${relative(source, file).replaceAll('\\', '/')}`,
    }))
  ))
  const jobs = groups.flat()

  let next = 0
  let completed = 0
  const worker = async () => {
    while (next < jobs.length) {
      const job = jobs[next++]
      await put(job.pathname, await readFile(job.file), {
        access: 'public',
        token,
        allowOverwrite: true,
        cacheControlMaxAge: 31_536_000,
      })
      completed++
      console.log(`${completed}/${jobs.length} ${job.pathname}`)
    }
  }

  await Promise.all(Array.from({ length: 8 }, worker))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
