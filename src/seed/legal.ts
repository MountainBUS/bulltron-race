import { doc, h, p, ul } from './lexical'

/**
 * HINWEIS: Rechtstexte als vollständig ausformulierte Entwürfe.
 * Vor dem Livegang müssen sie von einer Rechtsanwältin bzw. einem Rechtsanwalt
 * oder einem Anbieter wie eRecht24 / IT-Recht Kanzlei geprüft und auf die
 * tatsächlichen Verhältnisse des Shops angepasst werden.
 */

export const impressum = doc([
  h('h2', 'Angaben gemäß § 5 DDG'),
  p('BULLTRON GmbH\nAuf der Hude 88\n21339 Lüneburg\nDeutschland'),

  h('h2', 'Vertreten durch'),
  p('Die Geschäftsführung der BULLTRON GmbH.'),

  h('h2', 'Kontakt'),
  p('Telefon: +49 361 34948420\nMobil: +49 157 53705942\nE-Mail: info@bulltron-race.de'),

  h('h2', 'Registereintrag'),
  p('Eintragung im Handelsregister.\nRegistergericht: [Registergericht eintragen]\nRegisternummer: [HRB-Nummer eintragen]'),

  h('h2', 'Umsatzsteuer-ID'),
  p('Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:\n[USt-IdNr. eintragen]'),

  h('h2', 'Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV'),
  p('BULLTRON GmbH, Auf der Hude 88, 21339 Lüneburg'),

  h('h2', 'EU-Streitschlichtung'),
  p(
    'Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: https://ec.europa.eu/consumers/odr. Unsere E-Mail-Adresse finden Sie oben im Impressum.',
  ),

  h('h2', 'Verbraucherstreitbeilegung'),
  p(
    'Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.',
  ),

  h('h2', 'Hinweise zu Batterien und Altbatterien'),
  p(
    'Im Zusammenhang mit dem Vertrieb von Batterien sind wir als Vertreiber gemäß Batteriegesetz (BattG) verpflichtet, Sie auf Folgendes hinzuweisen: Altbatterien gehören nicht in den Hausmüll. Sie können Altbatterien unentgeltlich dort zurückgeben, wo sie erworben wurden, oder an den kommunalen Sammelstellen abgeben. Die durchgestrichene Mülltonne auf der Batterie bedeutet, dass die Batterie nicht in den Hausmüll gegeben werden darf.',
  ),
])

export const datenschutz = doc([
  h('h2', '1. Verantwortlicher'),
  p(
    'Verantwortlich für die Datenverarbeitung auf dieser Website ist:\nBULLTRON GmbH, Auf der Hude 88, 21339 Lüneburg, E-Mail: info@bulltron-race.de, Telefon: +49 361 34948420.',
  ),

  h('h2', '2. Grundsätzliches'),
  p(
    'Wir verarbeiten personenbezogene Daten ausschließlich im Rahmen der gesetzlichen Bestimmungen, insbesondere der Datenschutz-Grundverordnung (DSGVO) und des Bundesdatenschutzgesetzes (BDSG). Personenbezogene Daten sind alle Informationen, die sich auf eine identifizierte oder identifizierbare natürliche Person beziehen.',
  ),

  h('h2', '3. Hosting und Server-Logfiles'),
  p(
    'Diese Website wird auf Servern innerhalb der Europäischen Union betrieben. Beim Aufruf der Seiten erhebt der Hosting-Anbieter automatisch Informationen, die Ihr Browser übermittelt:',
  ),
  ul([
    'aufgerufene Seite und Datum sowie Uhrzeit des Zugriffs',
    'übertragene Datenmenge und Meldung über den erfolgreichen Abruf',
    'Browsertyp und Browserversion, verwendetes Betriebssystem',
    'Referrer-URL',
    'gekürzte IP-Adresse',
  ]),
  p(
    'Diese Daten sind technisch erforderlich, um die Website auszuliefern und ihre Stabilität und Sicherheit zu gewährleisten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer technisch fehlerfreien Darstellung). Die Logfiles werden nach spätestens 14 Tagen gelöscht.',
  ),

  h('h2', '4. Schriftarten'),
  p(
    'Diese Website bindet Schriftarten ausschließlich lokal vom eigenen Server ein. Es wird keine Verbindung zu Servern von Google oder anderen Dritten aufgebaut, wenn Sie unsere Seiten besuchen.',
  ),

  h('h2', '5. Cookies'),
  p(
    'Wir setzen keine Tracking- oder Marketing-Cookies. Für die Funktion des Warenkorbs speichert Ihr Browser die ausgewählten Artikel lokal auf Ihrem Gerät (Local Storage). Diese Daten verlassen Ihr Gerät nicht und werden nicht an uns übertragen, solange Sie keine Bestellung auslösen. Sie können sie jederzeit über die Einstellungen Ihres Browsers löschen.',
  ),

  h('h2', '6. Bestellung und Zahlungsabwicklung über Stripe'),
  p(
    'Wenn Sie eine Bestellung aufgeben, verarbeiten wir die zur Vertragserfüllung erforderlichen Daten: Name, Liefer- und Rechnungsanschrift, E-Mail-Adresse, Telefonnummer sowie die Angaben zu den bestellten Artikeln. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).',
  ),
  p(
    'Die Zahlungsabwicklung erfolgt über die Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, Irland. Ihre Zahlungsdaten (z. B. Kreditkartennummer) geben Sie ausschließlich direkt bei Stripe ein; wir erhalten und speichern diese Daten zu keinem Zeitpunkt. Stripe verarbeitet die Daten als eigenständig Verantwortlicher bzw. in unserem Auftrag, um die Zahlung durchzuführen und Betrug zu verhindern. Weitere Informationen finden Sie in der Datenschutzerklärung von Stripe unter https://stripe.com/de/privacy.',
  ),
  p(
    'Bestelldaten bewahren wir aufgrund handels- und steuerrechtlicher Aufbewahrungspflichten (§ 257 HGB, § 147 AO) für bis zu zehn Jahre auf.',
  ),

  h('h2', '7. Kontaktaufnahme'),
  p(
    'Wenn Sie uns per E-Mail oder Telefon kontaktieren, verarbeiten wir Ihre Angaben zur Bearbeitung der Anfrage und für den Fall von Anschlussfragen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO bei vertragsbezogenen Anfragen, sonst Art. 6 Abs. 1 lit. f DSGVO.',
  ),

  h('h2', '8. YouTube-Videos'),
  p(
    'Auf einzelnen Seiten binden wir Videos von YouTube ein. Die Videos sind so eingebunden, dass beim reinen Aufruf der Seite keine Verbindung zu YouTube hergestellt wird. Erst wenn Sie aktiv auf die Wiedergabe klicken, wird eine Verbindung zu Servern von Google Ireland Limited aufgebaut und Ihre IP-Adresse übermittelt. Wir nutzen dabei den erweiterten Datenschutzmodus (youtube-nocookie.com). Rechtsgrundlage für die Wiedergabe ist Ihre Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO, die Sie durch den Klick auf den Abspielbutton erteilen. Weitere Informationen: https://policies.google.com/privacy.',
  ),

  h('h2', '9. Ihre Rechte'),
  p('Sie haben jederzeit das Recht auf:'),
  ul([
    'Auskunft über die zu Ihrer Person gespeicherten Daten (Art. 15 DSGVO)',
    'Berichtigung unrichtiger Daten (Art. 16 DSGVO)',
    'Löschung (Art. 17 DSGVO) und Einschränkung der Verarbeitung (Art. 18 DSGVO)',
    'Datenübertragbarkeit (Art. 20 DSGVO)',
    'Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)',
    'Widerruf einer erteilten Einwilligung mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO)',
  ]),
  p(
    'Zur Ausübung genügt eine Nachricht an info@bulltron-race.de. Darüber hinaus haben Sie das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.',
  ),

  h('h2', '10. Datensicherheit'),
  p(
    'Diese Website nutzt eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie daran, dass die Adresszeile Ihres Browsers mit „https://“ beginnt.',
  ),

  h('h2', '11. Änderungen dieser Erklärung'),
  p(
    'Wir passen diese Datenschutzerklärung an, sobald Änderungen an unserer Website oder an der Rechtslage dies erforderlich machen. Es gilt jeweils die hier veröffentlichte Fassung.',
  ),
])

export const agb = doc([
  h('h2', '§ 1 Geltungsbereich'),
  p(
    '(1) Für alle Bestellungen über diesen Online-Shop gelten die nachfolgenden Allgemeinen Geschäftsbedingungen in der zum Zeitpunkt der Bestellung gültigen Fassung.',
  ),
  p(
    '(2) Verbraucher im Sinne dieser AGB ist jede natürliche Person, die ein Rechtsgeschäft zu Zwecken abschließt, die überwiegend weder ihrer gewerblichen noch ihrer selbständigen beruflichen Tätigkeit zugerechnet werden können. Unternehmer ist eine natürliche oder juristische Person oder eine rechtsfähige Personengesellschaft, die bei Abschluss eines Rechtsgeschäfts in Ausübung ihrer gewerblichen oder selbständigen beruflichen Tätigkeit handelt.',
  ),

  h('h2', '§ 2 Vertragspartner und Vertragsschluss'),
  p('(1) Der Kaufvertrag kommt zustande mit der BULLTRON GmbH, Auf der Hude 88, 21339 Lüneburg.'),
  p(
    '(2) Die Darstellung der Produkte im Online-Shop stellt kein rechtlich bindendes Angebot dar, sondern eine Aufforderung zur Bestellung. Durch Anklicken des Buttons „Zahlungspflichtig bestellen“ geben Sie eine verbindliche Bestellung der im Warenkorb enthaltenen Waren ab.',
  ),
  p(
    '(3) Der Zugang Ihrer Bestellung wird unmittelbar nach dem Absenden per E-Mail bestätigt. Diese Bestätigung stellt noch keine Annahme des Vertragsangebots dar. Der Kaufvertrag kommt zustande, sobald wir die Annahme der Bestellung erklären oder die Ware versenden.',
  ),

  h('h2', '§ 3 Preise und Versandkosten'),
  p(
    '(1) Alle angegebenen Preise sind Endpreise und enthalten die gesetzliche Umsatzsteuer. Zuzüglich fallen die auf der Produktseite und im Warenkorb ausgewiesenen Versandkosten an.',
  ),
  p(
    '(2) Ab einem Bestellwert von 250,00 EUR liefern wir innerhalb Deutschlands versandkostenfrei. Für Lieferungen nach Österreich und in die Schweiz können abweichende Kosten sowie Einfuhrabgaben anfallen, die vom Besteller zu tragen sind.',
  ),

  h('h2', '§ 4 Lieferung'),
  p(
    '(1) Wir liefern in die im Bestellprozess angegebenen Länder. Die Lieferzeit beträgt, sofern nicht anders angegeben, 2 bis 4 Werktage nach Zahlungseingang.',
  ),
  p(
    '(2) Lithium-Batterien unterliegen den Vorschriften für den Transport gefährlicher Güter. Der Versand erfolgt ausschließlich über dafür zugelassene Versanddienstleister und Verpackungen.',
  ),

  h('h2', '§ 5 Zahlung'),
  p(
    '(1) Die Zahlung erfolgt über unseren Zahlungsdienstleister Stripe. Verfügbar sind je nach Auswahl unter anderem Kreditkarte, Apple Pay, Google Pay und Klarna.',
  ),
  p('(2) Der Kaufpreis ist mit Vertragsschluss sofort zur Zahlung fällig.'),

  h('h2', '§ 6 Eigentumsvorbehalt'),
  p('Die Ware bleibt bis zur vollständigen Bezahlung unser Eigentum.'),

  h('h2', '§ 7 Widerrufsrecht für Verbraucher'),
  p(
    'Verbraucher haben ein vierzehntägiges Widerrufsrecht. Die Einzelheiten entnehmen Sie bitte der nachstehenden Widerrufsbelehrung.',
  ),

  h('h3', 'Widerrufsbelehrung'),
  p(
    'Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die letzte Ware in Besitz genommen haben bzw. hat.',
  ),
  p(
    'Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (BULLTRON GmbH, Auf der Hude 88, 21339 Lüneburg, E-Mail: info@bulltron-race.de, Telefon: +49 361 34948420) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.',
  ),

  h('h3', 'Folgen des Widerrufs'),
  p(
    'Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.',
  ),
  p(
    'Wir können die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben oder bis Sie den Nachweis erbracht haben, dass Sie die Waren zurückgesandt haben, je nachdem, welches der frühere Zeitpunkt ist. Sie haben die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem Tag, an dem Sie uns über den Widerruf dieses Vertrags unterrichten, an uns zurückzusenden oder zu übergeben. Sie tragen die unmittelbaren Kosten der Rücksendung der Waren. Für Batterien gelten wegen der Gefahrgutvorschriften besondere Versandanforderungen; bitte kontaktieren Sie uns vor der Rücksendung, damit wir den zulässigen Versandweg abstimmen können.',
  ),
  p(
    'Sie müssen für einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser Wertverlust auf einen zur Prüfung der Beschaffenheit, Eigenschaften und Funktionsweise der Waren nicht notwendigen Umgang mit ihnen zurückzuführen ist.',
  ),

  h('h2', '§ 8 Gewährleistung und Garantie'),
  p(
    '(1) Es gilt das gesetzliche Mängelhaftungsrecht. Gegenüber Verbrauchern beträgt die Verjährungsfrist für Mängelansprüche zwei Jahre ab Ablieferung der Ware.',
  ),
  p(
    '(2) Unabhängig davon gewähren wir auf die hier angebotenen Batterien eine Herstellergarantie von fünf Jahren nach Maßgabe der jeweiligen Garantiebedingungen. Die gesetzlichen Rechte werden dadurch nicht eingeschränkt.',
  ),
  p(
    '(3) Von der Garantie ausgenommen sind Schäden durch unsachgemäßen Einbau, mechanische Beschädigung, Tiefentladung infolge längerer Lagerung ohne Ladung sowie durch Verwendung ungeeigneter Ladegeräte.',
  ),

  h('h2', '§ 9 Rücknahme von Altbatterien'),
  p(
    'Wir sind gesetzlich verpflichtet, Altbatterien unentgeltlich zurückzunehmen. Sie können Altbatterien an unsere Anschrift zurücksenden oder bei den kommunalen Sammelstellen abgeben. Batterien dürfen nicht über den Hausmüll entsorgt werden.',
  ),

  h('h2', '§ 10 Schlussbestimmungen'),
  p(
    '(1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Bei Verbrauchern gilt diese Rechtswahl nur, soweit dadurch der durch zwingende Bestimmungen des Rechts des Staates des gewöhnlichen Aufenthaltes des Verbrauchers gewährte Schutz nicht entzogen wird.',
  ),
  p(
    '(2) Ist der Besteller Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen, ist ausschließlicher Gerichtsstand für alle Streitigkeiten aus diesem Vertrag unser Geschäftssitz.',
  ),
  p(
    '(3) Sollten einzelne Bestimmungen dieses Vertrages unwirksam sein oder werden, so wird dadurch die Wirksamkeit der übrigen Bestimmungen nicht berührt.',
  ),
])
