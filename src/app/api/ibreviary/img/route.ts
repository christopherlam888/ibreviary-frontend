import { NextRequest, NextResponse } from 'next/server'

const UPSTREAM = 'http://www.ibreviary.com'
const UA = 'iBreviary/3.7.19 Android'

// Saint portraits are plain-HTTP URLs embedded in day JSON; an HTTPS page
// cannot load them directly (mixed content), so bytes pass through here.
export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get('t') ?? 'r'
  const id = req.nextUrl.searchParams.get('id') ?? ''
  const n = req.nextUrl.searchParams.get('n') ?? '2'
  if (!/^\d+$/.test(id) || !/^[a-z]$/.test(t) || !/^\d+$/.test(n)) {
    return NextResponse.json({ error: 'bad params' }, { status: 400 })
  }
  try {
    const upstream = await fetch(`${UPSTREAM}/img_db.php?t=${t}&id=${id}&n=${n}`, {
      headers: { 'User-Agent': UA },
      cache: 'no-store',
    })
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: `upstream ${upstream.status}` }, { status: 502 })
    }
    const buf = await upstream.arrayBuffer()
    return new NextResponse(buf, {
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'image/png',
        'cache-control': 'public, max-age=86400',
      },
    })
  } catch (e) {
    return NextResponse.json({ error: `image fetch failed: ${(e as Error).message}` }, { status: 502 })
  }
}
