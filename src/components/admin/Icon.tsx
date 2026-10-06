import React from 'react'

/**
 * Kleines Zeichen links in der Kopfzeile des Backends, vor der Brotkrumen-Navigation.
 *
 * HIER PASST NUR EINE QUADRATISCHE MARKE. Payload gibt diesem Platz genau
 * 18 × 18 Pixel (`a.step-nav__home`). Davor stand hier das breite Logo
 * `/admin/icon.png` mit 800 × 182 Pixeln, also im Verhältnis 4,4 : 1 — der
 * Browser hat es auf 18 × 20,8 gestaucht, und übrig blieb ein Schmierer aus
 * Fahrzeugsilhouette und Schriftzug. Nachgemessen am 06.10.2026 im laufenden
 * Backend, nachdem Marco gefragt hatte, was das überhaupt sein soll.
 *
 * Deshalb steht hier jetzt die Bildmarke, die Kopf und Fuß der Website ohnehin
 * tragen: das Sechseck mit dem Blitz (siehe `LogoMark` in components/Icons.tsx).
 * Sie ist quadratisch und bleibt auch bei 16 Pixeln erkennbar.
 *
 * ZWEI UNTERSCHIEDE zur Fassung im Website-Kopf, beide wegen der Größe:
 *   - Das Sechseck ist gefüllt statt umrissen. Die 2 Einheiten starke Kontur
 *     wird bei 18 Pixeln rund 0,9 Pixel dünn und verschwindet fast.
 *   - Der Blitz ist ausgespart (`fill-rule="evenodd"`) statt eingefärbt. So
 *     scheint der Untergrund durch, und die Marke sitzt auf hellem wie auf
 *     dunklem Grund richtig — ohne zweite Datei und ohne Umschaltung.
 *
 * KEIN <style>-Element mehr. Das alte hier war als Text sichtbar: Payload setzt
 * die Kinder dieses Platzes auf `display: block`, womit der Browser auch ein
 * <style> darstellt. Vom Inhalt `.bt-icon { width: auto; … }` blieben im
 * 18 Pixel breiten Rahmen die Zeichen „.bt" stehen — genau das Rätsel, das
 * Marco gemeldet hat. Als SVG ohne eigene Formatierung kann das nicht
 * wiederkehren.
 */
export const Icon = () => (
  <svg viewBox="0 0 40 40" width="100%" height="100%" role="img" aria-label="Bulltron Race">
    <path
      fill="#e03e51"
      fillRule="evenodd"
      d="M20 1.5 36.5 10v20L20 38.5 3.5 30V10L20 1.5ZM21.8 10 12 21.4h6.3L17 30l10.4-12.2h-6.6L21.8 10Z"
    />
  </svg>
)

export default Icon
