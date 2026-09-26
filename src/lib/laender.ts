/**
 * Ländernamen für Anschriften.
 *
 * Steht hier und nicht in einem der Bauteile, weil die Händlerliste und die
 * Karte beide darauf zugreifen — und HaendlerSuche die Karte einbindet. Ein
 * gegenseitiger Import wäre ein Ring.
 */
const LAND_LABEL: Record<string, string> = {
  AT: 'Österreich',
  CH: 'Schweiz',
  SE: 'Schweden',
}

/**
 * Deutschland bleibt ungenannt — es ist der Normalfall und stünde sonst unter
 * jeder Adresse. Alles andere wird ausgeschrieben, sonst liest sich
 * „Borggatan 2, 343 37 Älmhult" wie eine deutsche Anschrift.
 */
export const landName = (code?: string | null): string | null =>
  code && code !== 'DE' ? (LAND_LABEL[code] ?? code) : null
