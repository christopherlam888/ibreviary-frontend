import { upstreamStatus, jsonResponse, errorResponse } from '@/lib/ibreviary/upstream'

export async function GET() {
  try {
    const body = await upstreamStatus()
    return jsonResponse(body, 3600)
  } catch (e) {
    return errorResponse(`status fetch failed: ${(e as Error).message}`)
  }
}
