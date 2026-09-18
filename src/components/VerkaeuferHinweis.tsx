import React from 'react'
import { IconTruck } from './Icons'

/**
 * Hinweis darauf, wer verkauft, versendet und abrechnet.
 *
 * Hintergrund: Marke und Verkäufer sind hier nicht dieselbe Firma. Auf der
 * Seite steht BULLTRON RACE, auf der Stripe-Bezahlseite, dem Kontoauszug und
 * der Rechnung steht die ProVerDa GmbH. Ein Kunde, der das zum ersten Mal beim
 * Bezahlen sieht, hält es im Zweifel für einen Fehler und bricht ab. Der
 * Hinweis steht deshalb dort, wo er gebraucht wird: im Warenkorb, auf der
 * Kasse, auf der Bestellbestätigung und in der Bestätigungsmail.
 *
 * Text und Überschrift stehen in den Website-Einstellungen. Sind beide leer,
 * erscheint nichts — der Hinweis ist abschaltbar, ohne dass jemand Code
 * anfassen muss.
 */
export const VerkaeuferHinweis = ({
  titel,
  text,
  abstandOben = false,
}: {
  titel?: string | null
  text?: string | null
  abstandOben?: boolean
}) => {
  const ueberschrift = titel?.trim()
  const inhalt = text?.trim()
  if (!ueberschrift && !inhalt) return null

  return (
    <aside className="verkaeufer-hinweis" style={abstandOben ? { marginTop: '1.5rem' } : undefined}>
      <span className="verkaeufer-hinweis__symbol" aria-hidden="true">
        <IconTruck size={20} />
      </span>
      <div>
        {ueberschrift ? <strong className="verkaeufer-hinweis__titel">{ueberschrift}</strong> : null}
        {inhalt ? <p className="verkaeufer-hinweis__text">{inhalt}</p> : null}
      </div>
    </aside>
  )
}
