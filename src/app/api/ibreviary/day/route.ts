import { NextRequest } from 'next/server'
import { upstreamJson, jsonResponse, errorResponse } from '@/lib/ibreviary/upstream'

const LANG_RE = /^[a-z]{2}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export async function GET(req: NextRequest) {
  const l = req.nextUrl.searchParams.get('l') ?? 'en'
  const d = req.nextUrl.searchParams.get('d') ?? ''
  if (!LANG_RE.test(l)) return errorResponse('bad l, expected 2-letter language code', 400)
  if (!DATE_RE.test(d)) return errorResponse('bad d, expected yyyy-MM-dd', 400)
  try {
    const body = await upstreamJson(`/service/services.php?s=get_daily_text&l=${l}&d=${d}`)
    // one hour: enough that a day's texts settle after overnight corrections
    return jsonResponse(body, 3600)
  } catch (e) {
    return errorResponse(`day fetch failed: ${(e as Error).message}`)
  }
}
