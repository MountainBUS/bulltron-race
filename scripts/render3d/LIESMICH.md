# 3D-Ansichten der Batterien

Erzeugt Produktbilder der Bulltron-Race-Batterien als 3D-Rendering. Kein Foto
und kein Bildmodell, sondern ein Modell aus Quadern, dessen Maße und
Etikettaufteilung an den Produktfotos abgemessen sind.

## Erzeugen

```bash
npm install three
python3 -m http.server 8077      # in diesem Verzeichnis
node final.mjs                   # alle Modelle in allen Stilen
node schuss.mjs 12ah studio      # einzeln, kleiner, zum Ausprobieren
node etikett-test.mjs            # nur die Etiketten, ohne 3D
```

## Stile

| Aufruf | Beschreibung |
|--------|--------------|
| `?v=studio` | Weiches Studiolicht auf hellem Grund |
| `?v=dunkel` | Dunkler Grund mit rotem Streiflicht, der Look der Website |
| `?v=flach` | Isometrisch und flach schattiert, wie eine technische Illustration |

Zusätzlich: `?m=<modell>` wählt die Baureihe, `?winkel=<grad>` dreht die
Batterie (0 = frontal, Vorgabe 22).

## Woher die Maße stammen

`modelle.js` enthält für jede Baureihe:

- **Gehäuse**: Verhältnis Breite zu Gesamthöhe, Tiefe zu Breite
- **Etikett**: Anteil an Gehäusebreite und -höhe, Abstand von oben
- **Jedes Textelement**: Höhe und Breite in Prozent der ETIKETTBREITE,
  Position in Prozent der ETIKETTHÖHE

Alle Werte sind aus den Produktfotos gemessen, nicht geschätzt. Prozent der
Etikettbreite als Maß für die Schriftgrößen, weil die Druckvorlage auf die
Breite skaliert wurde: die Werte sind über die Baureihen hinweg fast gleich,
die Etiketthöhen dagegen nicht.

Eine neue Baureihe braucht deshalb ein frontales Foto und einen neuen Eintrag
in `modelle.js` — keinen Eingriff in den Code.

## Drei Punkte zur Schrift

1. Das Originaletikett ist in einer **normal breiten Grotesk** gesetzt, nicht
   in einer schmalen: gemessene Versalbreite zu Versalhöhe rund 0,85, das passt
   zu Arial/Helvetica. Gesetzt wird deshalb in Liberation Sans, das mit Arial
   maßgleich ist. Mit der schmalen Barlow Condensed sahen die Etiketten
   deutlich anders aus als das Vorbild.
2. Jede Zeile wird auf die gemessene Höhe **und** Breite gebracht: die
   Schriftgröße folgt der Versalhöhe, danach wird waagerecht ausgeglichen. Die
   verbleibenden Faktoren liegen zwischen 0,99 und 1,2 — ein guter Beleg, dass
   die Schriftwahl stimmt.
3. Kleine Zeilen (LiFePO4, 12V, Claim) werden nach der Breite gesetzt. Bei
   kleiner Schrift ist die am Foto gemessene Höhe durch die Kantenglättung zu
   groß.

## Polklemmen

Auch die sind gemessen, nicht geschätzt. Motorrad-Baureihe, am Foto der 12 Ah:

- Metallblock 9,2 % der Gehäusebreite breit, 10,4 % der Gehäusehöhe hoch
- Mitte bei 10,5 % und 89,5 % der Gehäusebreite
- oben bündig mit dem Deckel, vorn bündig mit der Gehäusevorderseite
- darin eine ovale Senkung, rund 46 % der Blockbreite und 56 % der Blockhöhe

Der Deckel ist als Rahmen aus vier Wänden gebaut, nicht als ein Quader mit
aufgesetzter dunkler Fläche. Nur so ist die Mulde in der Mitte eine echte
Vertiefung und wirft auch Schatten.

## Etikett

Das Etikett bleibt im Rendering unbeleuchtet (`MeshBasicMaterial`,
`toneMapped: false`). Beleuchtet bricht das Markenrot bei Helligkeiten über
eins aus und kippt ins Rosa. Den Eindruck einer folierten Fläche macht
stattdessen ein schwacher additiver Lichtschleier darüber.

Das eingebundene Logo schreibt „HIGH PERFORMANCE ENERGY“. Auf dem Etikett der
echten Batterien steht „HIGH PERFOMANCE ENERGY“ — dort fehlt ein R.

Das Siegel der Auto-Baureihe ist vereinfacht: ein Kreis mit den Landesfarben
statt „Designed & developed in Germany“ mit Deutschlandkarte.
