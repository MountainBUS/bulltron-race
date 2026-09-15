import React from 'react'

/**
 * Logo auf der Anmeldeseite des Backends.
 *
 * Payload zeigt hier sonst sein eigenes Zeichen. Die Dateien liegen unter
 * `public/admin/` und damit im Auslieferungsverzeichnis — der Umweg über die
 * Medienverwaltung scheidet aus, weil die Anmeldeseite vor jeder Anmeldung
 * erreichbar sein muss.
 *
 * Zwei Fassungen: Das Logo ist für dunklen Grund gemacht, Wortmarke „RACE",
 * Fahrzeugsilhouette und Claim sind weiß. Im hellen Admin-Design wäre davon
 * nichts zu sehen, deshalb gibt es eine Fassung mit dunkel eingefärbten
 * Teilen. Umgeschaltet wird über `data-theme` am Wurzelelement, das Payload
 * setzt — nicht über `prefers-color-scheme`, denn die Wahl im Backend ist
 * unabhängig von der Einstellung des Betriebssystems.
 */
export const Logo = () => (
  <>
    <style>{`
      .bt-logo { width: min(20rem, 70vw); height: auto; display: block; margin: 0 auto; }
      .bt-logo--hell { display: none; }
      [data-theme='light'] .bt-logo--dunkel { display: none; }
      [data-theme='light'] .bt-logo--hell { display: block; }
    `}</style>
    <img className="bt-logo bt-logo--dunkel" src="/admin/logo.png" alt="Bulltron Race" width={1000} height={276} />
    <img className="bt-logo bt-logo--hell" src="/admin/logo-hell.png" alt="Bulltron Race" width={1000} height={276} />
  </>
)

export default Logo
