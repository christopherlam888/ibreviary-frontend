import { NextResponse } from 'next/server'

// One shared upstream client for all ibreviary routes. The origin serves
// plain HTTP with no CORS headers, so the browser can never talk to it
// directly from an HTTPS page; every request funnels through here.

const UPSTREAM = 'http://www.ibreviary.com'
const UA = 'iBreviary/3.7.19 Android'

// memory cache: upstream asks for the same catalog on every page load and
// it changes about once a year
let statusCache: { body: string; at: number } | null = null
const STATUS_TTL = 60 * 60 * 1000

export async function upstreamStatus(): Promise<string> {
  if (statusCache && Date.now() - statusCache.at < STATUS_TTL) return statusCache.body
  const r = await fetch(`${UPSTREAM}/service/services.php?s=get_status`, {
    headers: { 'User-Agent': UA },
    cache: 'no-store',
  })
  if (!r.ok) throw new Error(`upstream status ${r.status}`)
  const body = await r.text()
  statusCache = { body, at: Date.now() }
  return body
}

export async function upstreamJson(path: string): Promise<string> {
  const r = await fetch(`${UPSTREAM}${path}`, { headers: { 'User-Agent': UA }, cache: 'no-store' })
  if (!r.ok) throw new Error(`upstream ${path} ${r.status}`)
  return r.text()
}

export function jsonResponse(body: string, maxAgeSeconds: number): NextResponse {
  return new NextResponse(body, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': `public, max-age=${maxAgeSeconds}`,
    },
  })
}

export function errorResponse(message: string, status = 502): NextResponse {
  return NextResponse.json({ error: message }, { status })
}
