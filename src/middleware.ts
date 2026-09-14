import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Passwortschutz für Vorschau- und Dev-Instanzen.
 *
 * Aktiv, sobald DEV_AUTH_USER und DEV_AUTH_PASSWORD gesetzt sind. Ohne diese
 * beiden Variablen tut die Middleware nichts — die Live-Instanz bleibt offen.
 *
 * Der Schutz sitzt in der Anwendung selbst und nicht im Reverse Proxy. Damit
 * funktioniert er unabhängig davon, ob davor nginx, Traefik oder Caddy steht.
 */

// Stripe kann keine Zugangsdaten mitschicken. Bliebe der Webhook geschützt,
// antwortete die Instanz mit 401 und Stripe würde den Endpunkt abschalten.
const OFFENE_PFADE = ['/shop/api/stripe-webhook', '/shop/api/health']

/** Vergleich ohne früh abzubrechen, damit die Laufzeit nichts über das Passwort verrät. */
function gleich(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

export function middleware(request: NextRequest) {
  const user = process.env.DEV_AUTH_USER
  const password = process.env.DEV_AUTH_PASSWORD

  if (!user || !password) return NextResponse.next()

  const { pathname } = request.nextUrl
  if (OFFENE_PFADE.some((pfad) => pathname === pfad || pathname.startsWith(`${pfad}/`))) {
    return NextResponse.next()
  }

  const header = request.headers.get('authorization')

  if (header?.startsWith('Basic ')) {
    try {
      const entschluesselt = atob(header.slice(6))
      const trenner = entschluesselt.indexOf(':')
      const eingegebenerUser = entschluesselt.slice(0, trenner)
      const eingegebenesPasswort = entschluesselt.slice(trenner + 1)

      if (gleich(eingegebenerUser, user) && gleich(eingegebenesPasswort, password)) {
        const antwort = NextResponse.next()
        antwort.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
        return antwort
      }
    } catch {
      /* Kaputter Header — behandeln wie fehlende Anmeldung. */
    }
  }

  return new NextResponse('Zugang nur mit Passwort.\n', {
    status: 401,
    headers: {
      // Achtung: HTTP-Header sind Latin-1. Kein Gedankenstrich, keine Umlaute.
      'WWW-Authenticate': 'Basic realm="Bulltron Race Vorschau", charset="UTF-8"',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}

export const config = {
  matcher: ['/((?!_next/image|favicon.ico).*)'],
}
