import { NextRequest } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { upstreamJson, upstreamStatus, jsonResponse, errorResponse } from '@/lib/ibreviary/upstream'

const LANG_RE = /^[a-z]{2}$/
const CACHE_DIR = path.join(process.cwd(), '.cache', 'ibreviary-fixed')

// get_fixed_text weighs ~9 MB per language. Cache it on disk and only
// re-download when the server bumps fixed_text.last_update in get_status —
// the same invalidation protocol the app runs at startup.
export async function GET(req: NextRequest) {
  const l = req.nextUrl.searchParams.get('l') ?? 'en'
  if (!LANG_RE.test(l)) return errorResponse('bad l, expected 2-letter language code', 400)

  const file = path.join(CACHE_DIR, `${l}.json`)
  try {
    let serverUpdate: string | undefined
    try {
      const status = JSON.parse(await upstreamStatus())
      serverUpdate = status?.fixed_text?.last_update
    } catch {
      // status unreachable: fall back to disk copy if any
    }

    let disk: string | null = null
    let diskUpdate: string | undefined
    try {
      const meta = JSON.parse(await fs.readFile(`${file}.meta`, 'utf8'))
      diskUpdate = meta.last_update
    } catch {
      /* no meta yet */
    }

    const fresh = serverUpdate !== undefined && diskUpdate === serverUpdate
    if (fresh) {
      try {
        disk = await fs.readFile(file, 'utf8')
      } catch {
        /* meta said fresh but body missing; refetch below */
      }
    }
    if (disk === null) {
      disk = await upstreamJson(`/service/services.php?s=get_fixed_text&l=${l}`)
      await fs.mkdir(CACHE_DIR, { recursive: true })
      await fs.writeFile(file, disk)
      const payload = JSON.parse(disk)
      await fs.writeFile(
        `${file}.meta`,
        JSON.stringify({ last_update: serverUpdate ?? payload?.last_update, saved_at: new Date().toISOString() })
      )
    }

    // immutable for a day; the meta check above is the real invalidation
    return jsonResponse(disk, 86400)
  } catch (e) {
    return errorResponse(`fixed texts fetch failed: ${(e as Error).message}`)
  }
}
