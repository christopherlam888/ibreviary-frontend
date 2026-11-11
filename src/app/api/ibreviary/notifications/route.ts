import { NextRequest } from 'next/server'
import { upstreamJson, jsonResponse, errorResponse } from '@/lib/ibreviary/upstream'

const LANG_RE = /^[a-z]{2}$/

export async function GET(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get('lang') ?? 'en'
  if (!LANG_RE.test(lang)) return errorResponse('bad lang, expected 2-letter code', 400)
  try {
    const body = await upstreamJson(`/iOS/services.php?type=getNot&lang=${lang}`)
    return jsonResponse(body, 3600)
  } catch (e) {
    return errorResponse(`notifications fetch failed: ${(e as Error).message}`)
  }
}
