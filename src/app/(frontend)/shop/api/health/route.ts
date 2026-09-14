import { NextResponse } from 'next/server'
import { getPayloadClient } from '../../../../../lib/payload'

export const dynamic = 'force-dynamic'

/**
 * Healthcheck für Docker und Coolify. Prüft nicht nur, ob der Node-Prozess
 * antwortet, sondern auch ob die Datenbank erreichbar ist — sonst gilt ein
 * Container als gesund, obwohl das Backend nichts laden kann.
 *
 * Dieser Pfad ist vom Passwortschutz ausgenommen (siehe src/middleware.ts).
 */
export async function GET() {
  try {
    const payload = await getPayloadClient()
    await payload.count({ collection: 'products' })
    return NextResponse.json({ status: 'ok', time: new Date().toISOString() })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unbekannt'
    return NextResponse.json({ status: 'error', message }, { status: 503 })
  }
}
