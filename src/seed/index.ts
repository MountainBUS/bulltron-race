import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'
import config from '../payload.config'
import { seedProducts } from './products'
import { agb, datenschutz, impressum } from './legal'
import { doc, h, p, ul } from './lexical'

const assets = path.join(path.dirname(fileURLToPath(import.meta.url)), 'assets')

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@bulltron-race.de'
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'BulltronRace2026!'

export const seed = async () => {
  const payload = await getPayload({ config })

  /* -------------------------------------------------- Aufräumen ---------- */
  // Verweise aus den Globals lösen, sonst blockieren sie das Löschen der Medien
  // und Kategorien. Beim allerersten Lauf existieren die Globals noch nicht —
  // dann ist hier nichts zu tun.
  try {
    await payload.updateGlobal({
      slug: 'home',
      overrideAccess: true,
      data: {
        categoryCards: [],
        featuredProducts: [],
        image: null,
        backgroundImage: null,
        teaser: { image: null },
        partners: [],
      },
    })
  } catch {
    /* Startseite noch nicht angelegt */
  }
  try {
    await payload.updateGlobal({
      slug: 'site-settings',
      overrideAccess: true,
      data: { logo: null, footerLogo: null, defaultSeoImage: null },
    })
  } catch {
    /* Einstellungen noch nicht angelegt */
  }

  for (const collection of ['products', 'categories', 'pages', 'dealers', 'media'] as const) {
    const existing = await payload.find({ collection, limit: 500, depth: 0, overrideAccess: true })
    for (const entry of existing.docs) {
      await payload.delete({ collection, id: entry.id, overrideAccess: true })
    }
  }

  /* -------------------------------------------------- Admin -------------- */
  const users = await payload.find({ collection: 'users', limit: 1, overrideAccess: true })
  if (users.totalDocs === 0) {
    await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, name: 'Bulltron Administrator' },
    })
    payload.logger.info(`Admin angelegt: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
  }

  /* -------------------------------------------------- Medien ------------- */
  const upload = async (file: string, alt: string) =>
    payload.create({
      collection: 'media',
      overrideAccess: true,
      data: { alt },
      filePath: path.join(assets, file),
    })

  const productImages: Record<string, number> = {}
  for (const product of seedProducts) {
    if (productImages[product.image]) continue
    const media = await upload(product.image, `${product.title} — ${product.subtitle}`)
    productImages[product.image] = media.id as number
  }

  const coverMotorsport = await upload('cover-motorsport.png', 'Motorsport-Starterbatterien von Bulltron Race')
  const coverRennsport = await upload('cover-rennsport.png', 'Rennsportbatterien in LiFePO4-Technik')
  const coverMotorrad = await upload('cover-motorrad.png', 'Motorradbatterien von Bulltron Race')
  const teaserImage = await upload('teaser-werk.png', 'Bulltron-Race-Batterie aus deutscher Fertigung')
  const heroBild = await upload(
    'hero-rennstrecke.jpg',
    'Bulltron-Race-Fahrzeuge auf der Rennstrecke, angeführt von einem Porsche 911 GT3 Cup',
  )
  const logoKopf = await upload('logo-bulltron-race-kompakt.png', 'BULLTRON RACE')
  const logoFooter = await upload('logo-bulltron-race.png', 'BULLTRON RACE — High Performance Energy')
  const videoKaltstart = await upload('video-kaltstart.png', 'Vorschaubild: Kaltstart-Vergleich bei minus 15 Grad')
  const videoEinbau = await upload('video-einbau.png', 'Vorschaubild: Einbau der Batterie im Rennwagen')
  const videoFertigung = await upload('video-fertigung.png', 'Vorschaubild: Blick in die Fertigung')
  const videoProdukt = await upload('video-produkt.png', 'Vorschaubild: Die Batterie im Einsatz')

  /* -------------------------------------------------- Kategorien --------- */
  const categoryDefs = [
    {
      slug: 'motorsportbatterien',
      title: 'Motorsportbatterien',
      sortOrder: 1,
      headline: 'Starterbatterien für den Motorsport',
      subline:
        '27 Ah mit 700 A Kaltstartstrom, wahlweise im kompakten Metall-Gehäuse oder in den genormten Maßen L1, L2 und L3. Für Fahrzeuge, die zwischen Boxenstopp und Startaufstellung keine Zweifel vertragen.',
      image: coverMotorsport.id,
      highlights: [
        { title: '700 A Kaltstartstrom', text: 'Reserve auch dann, wenn der heiße Motor beim Restart mehr verlangt.' },
        { title: 'Leichter gebaut', text: 'Bis 45 % kleiner und bis 35 % leichter als andere LiFePO4-Batterien.' },
        { title: 'Bleibatterie-Ersatz', text: 'Bis zu 10-fache Lebensdauer gegenüber einer Blei-Säure-Batterie.' },
      ],
      body: doc([
        h('h2', 'Welche Batterie passt zu welchem Fahrzeug?'),
        p(
          'Alle vier Ausführungen haben dieselbe Technik: 27 Ah Kapazität, 700 A Kaltstartstrom, aktiver Balancer mit 1 A. Der Unterschied liegt allein im Gehäuse — miss dein Batteriefach aus und nimm das Maß, das hineinpasst.',
        ),
        ul([
          'Metall-Gehäuse: 175 x 125 x 129 mm, 3,0 kg — die kompakteste Ausführung',
          'L1-Gehäuse: 207 x 175 x 189 mm, 3,5 kg',
          'L2-Gehäuse: 244 x 175 x 189 mm, 3,5 kg',
          'L3-Gehäuse: 279 x 175 x 189 mm, 3,5 kg',
        ]),
        p(
          'Wenn du unsicher bist, ruf an. Startstrom, Einbaumaß und Ladesystem klären wir in wenigen Minuten — das ist schneller als jede Tabelle.',
        ),
      ]),
      faq: [
        {
          question: 'Brauche ich ein spezielles Ladegerät?',
          answer:
            'Ja. Lithium-Batterien benötigen ein Ladegerät mit Lithium-Kennlinie. Ein klassisches Bleiladegerät lädt die Batterie nicht vollständig und kann die Lebensdauer verkürzen.',
        },
        {
          question: 'Sind die Batterien für das Reglement meiner Rennserie zugelassen?',
          answer:
            'Das hängt von der jeweiligen Serie ab. Die Batterien sind für den Motorsporteinsatz konstruiert; Reglementfragen klären wir gern gemeinsam mit dir vorab.',
        },
        {
          question: 'Wie lange hält die Batterie?',
          answer:
            'Gegenüber einer Blei-Säure-Batterie erreichen unsere Zellen bis zur zehnfachen Lebensdauer. Wir geben fünf Jahre deutsche Herstellergarantie.',
        },
      ],
    },
    {
      slug: 'rennsportbatterien',
      title: 'Rennsportbatterien',
      sortOrder: 2,
      headline: 'Die stärkste Batterie der Baureihe',
      subline:
        '55 Ah Kapazität und 1400 A Kaltstartstrom, in den genormten Maßen L1 und L2. Für Fahrzeuge, die neben dem Anlasser auch das Bordnetz über eine ganze Veranstaltung versorgen müssen.',
      image: coverRennsport.id,
      highlights: [
        { title: '1400 A Kaltstartstrom', text: 'Der höchste Startstrom im Programm.' },
        { title: 'Aktiver Balancer, 5 A', text: 'Die 55 Ah hat den größeren Balancer der Baureihe.' },
        { title: 'Zwei Normmaße', text: 'L1 mit 207 mm und L2 mit 244 mm Länge, beide 6,5 kg.' },
      ],
      body: doc([
        h('h2', 'Warum LiFePO4?'),
        p(
          'Lithium-Eisenphosphat ist die gutmütigere Zellchemie. Sie verträgt Temperatur besser, altert langsamer und liefert über den gesamten Entladebereich eine sehr konstante Spannung. Im Gegenzug ist sie pro Kilowattstunde etwas schwerer als andere Lithium-Varianten.',
        ),
        p(
          'Für Fahrzeuge, die an vielen Wochenenden im Jahr laufen, rechnet sich das schnell: Die höhere Zyklenzahl verlängert die Standzeit deutlich.',
        ),
      ]),
      faq: [
        {
          question: 'Was ist der Unterschied zwischen 12 V und 12,8 V?',
          answer:
            'Die 12,8 V beziehen sich auf die Nennspannung der LiFePO4-Zellkonfiguration. In der Praxis ist der Unterschied für das Bordnetz unkritisch — wichtiger ist die passende Ladeschlussspannung des Ladegeräts.',
        },
        {
          question: 'Kann ich mehrere Batterien parallel betreiben?',
          answer:
            'Grundsätzlich ja, aber die Auslegung muss stimmen. Sprich uns vorher an, damit wir Verkabelung und BMS-Konfiguration gemeinsam prüfen.',
        },
      ],
    },
    {
      slug: 'motorradbatterien',
      title: 'Motorradbatterien',
      sortOrder: 3,
      headline: 'Kompakt, leicht, vibrationsfest',
      subline:
        'Ab 500 Gramm: die drei Batterien im Kunststoff-Gehäuse, für Supersportler, Youngtimer, Quads und jedes Projekt, bei dem Gewicht eine Rolle spielt.',
      image: coverMotorrad.id,
      highlights: [
        { title: 'Ab 500 Gramm', text: 'Die 4 Ah wiegt 0,5 kg, die 12 Ah 1,3 kg — ein Bruchteil einer Bleibatterie.' },
        { title: 'Startet auch im Winter', text: 'Laden bis −20 °C, entladen bis −30 °C. Nach der Standzeit trotzdem startbereit.' },
        { title: 'Fünf Jahre Garantie', text: 'Deutsche Herstellergarantie auf jede Batterie der Baureihe.' },
      ],
      body: doc([
        h('h2', 'Die richtige Größe finden'),
        ul([
          'Race 4 Ah: 500 A Kaltstartstrom, 0,5 kg, 113 x 70 x 82 mm',
          'Race 6 Ah: 650 A Kaltstartstrom, 0,7 kg, 150 x 87 x 93 mm',
          'Race 12 Ah: 1000 A Kaltstartstrom, 1,3 kg, 150 x 87 x 132 mm',
        ]),
        p(
          'Wichtig ist neben dem Startstrom das Einbaumaß. Miss das Batteriefach aus, bevor du bestellst — oder schick uns ein Foto, wir schauen drauf.',
        ),
      ]),
      faq: [
        {
          question: 'Was mache ich im Winter?',
          answer:
            'Lithium-Batterien haben eine geringe Selbstentladung und überstehen die Winterpause meist ohne Nachladen. Bei Standzeiten über mehrere Monate empfehlen wir trotzdem ein Erhaltungsladegerät mit Lithium-Kennlinie.',
        },
        {
          question: 'Kann ich die Batterie liegend einbauen?',
          answer:
            'Ja, die Zellen sind lageunabhängig. Achte lediglich darauf, dass die Batterie mechanisch sicher fixiert ist und die Pole keinen Kurzschluss verursachen können.',
        },
      ],
    },
  ]

  const categoryIds: Record<string, number> = {}
  for (const category of categoryDefs) {
    const created = await payload.create({
      collection: 'categories',
      overrideAccess: true,
      data: {
        title: category.title,
        slug: category.slug,
        sortOrder: category.sortOrder,
        eyebrow: 'Bulltron Race',
        headline: category.headline,
        subline: category.subline,
        image: category.image,
        highlights: category.highlights,
        body: category.body,
        faq: category.faq,
        seo: {
          title: `${category.title} — leicht, stark, Made in Germany`,
          description: category.subline.slice(0, 175),
        },
      },
    })
    categoryIds[category.slug] = created.id as number
  }

  /* -------------------------------------------------- Produkte ----------- */
  let order = 0
  for (const product of seedProducts) {
    order += 1
    await payload.create({
      collection: 'products',
      overrideAccess: true,
      data: {
        title: product.title,
        slug: product.slug,
        status: 'published',
        category: categoryIds[product.categorySlug],
        sortOrder: order,
        featured: Boolean(product.featured),
        subtitle: product.subtitle,
        badge: product.badge,
        shortDescription: product.shortDescription,
        keyData: product.keyData,
        highlights: product.highlights.map((text) => ({ text })),
        price: product.price,
        sku: product.sku,
        ean: product.ean,
        /* Keine Lieferzusage im Seed: welche Batterie am Lager liegt, weiß nur
           Bulltron. Im Backend je Produkt auf „Auf Lager“ stellen. */
        availability: 'on_request',
        deliveryTime: '2–4 Werktage',
        shippingNote: 'Versand als Gefahrgut über zugelassene Dienstleister.',
        mainImage: productImages[product.image],
        video: product.video
          ? {
              url: product.video.url,
              title: product.video.title,
              description: product.video.description,
              previewImage: videoProdukt.id,
            }
          : { title: 'Das Produkt im Einsatz' },
        description: product.description,
        specs: product.specs.map(([label, value]) => ({ label, value })),
        downloads: [{ label: `Datenblatt ${product.title} (PDF)`, url: '#' }],
        seo: {
          title: `${product.title} — ${product.subtitle}`,
          description: product.shortDescription.slice(0, 175),
        },
      },
    })
  }

  /* -------------------------------------------------- Seiten ------------- */
  const pages = [
    {
      slug: 'datenschutz',
      title: 'Datenschutzerklärung',
      subtitle: 'Wie wir mit deinen Daten umgehen — vollständig und ohne Kleingedrucktes.',
      content: datenschutz,
    },
    {
      slug: 'impressum',
      title: 'Impressum',
      subtitle: 'Anbieterkennzeichnung gemäß § 5 DDG.',
      content: impressum,
    },
    {
      slug: 'agb',
      title: 'AGB und Widerrufsbelehrung',
      subtitle: 'Allgemeine Geschäftsbedingungen für Bestellungen über bulltron-race.de.',
      content: agb,
    },
  ]

  for (const page of pages) {
    await payload.create({
      collection: 'pages',
      overrideAccess: true,
      data: {
        ...page,
        lastUpdated: new Date().toISOString(),
        // Rechtstexte dürfen indexiert werden — sie sollen auffindbar sein.
        seo: { noindex: false },
      },
    })
  }

  /* -------------------------------------------------- Händler ------------ */
  /* Die echten Partner. Weitere kommen im Backend unter „Shop → Händler“ dazu;
     die Koordinaten für die Umkreissuche entstehen dort automatisch aus der
     Postleitzahl. */
  const haendlerListe = [
    {
      name: 'Saker Sportcars GmbH',
      street: 'Bauerngasse 4',
      postalCode: '73450',
      city: 'Neresheim-Elchingen',
      email: 'info@sakersportscars.com',
      phone: '+49 176 87730705',
      status: ['haendler'],
      featured: false,
    },
    {
      name: 'ProVerDa GmbH',
      street: 'An der Lache 40-42',
      postalCode: '99086',
      city: 'Erfurt',
      email: 'info@proverda-erfurt.de',
      phone: '+49 361 34948420',
      status: ['haendler', 'einbaupartner'],
      statusFreitext: 'Schulungsbetrieb',
      featured: false,
    },
  ]

  for (const haendler of haendlerListe) {
    await payload.create({
      collection: 'dealers',
      overrideAccess: true,
      data: { ...haendler, country: 'DE', published: true } as never,
    })
  }

  /* -------------------------------------------------- Globals ------------ */
  const featuredIds = (
    await payload.find({
      collection: 'products',
      where: { featured: { equals: true } },
      limit: 10,
      overrideAccess: true,
    })
  ).docs.map((doc) => doc.id)

  await payload.updateGlobal({
    slug: 'site-settings',
    overrideAccess: true,
    data: {
      siteName: 'BULLTRON RACE',
      tagline: 'High Performance Energy',
      logo: logoKopf.id,
      footerLogo: logoFooter.id,
      defaultSeoDescription:
        'Lithium-Starterbatterien für Motorsport, Rennsport und Motorrad. Entwickelt und konfektioniert in Lüneburg — leicht, stark, mit fünf Jahren deutscher Herstellergarantie.',
      mainNav: [
        { label: 'Alle Batterien', url: '/produkte' },
        { label: 'Motorsport', url: '/motorsportbatterien' },
        { label: 'Rennsport', url: '/rennsportbatterien' },
        { label: 'Motorrad', url: '/motorradbatterien' },
        { label: 'Händler', url: '/haendler' },
        { label: 'Teams', url: '/teams' },
      ],
      headerCtaLabel: 'Beratung',
      headerCtaUrl: 'tel:+4936134948420',
      announcement: 'Made in Germany · 5 Jahre Herstellergarantie · Beratung unter +49 361 34948420',
      companyName: 'BULLTRON GmbH',
      street: 'Auf der Hude 88',
      postalCode: '21339',
      city: 'Lüneburg',
      phone: '+49 361 34948420',
      mobile: '+49 157 53705942',
      email: 'info@bulltron-race.de',
      /* Keine Öffnungszeiten: der bisherige Auftritt nannte keine. Im Backend
         unter „Inhalte → Website-Einstellungen“ eintragen, wenn gewünscht. */
      openingHours: '',
      footerText:
        'Lithium-Starterbatterien für den Motorsport. Entwickelt und konfektioniert in Lüneburg — von Profis für PS-Profis.',
      footerColumns: [
        {
          title: 'Sortiment',
          links: [
            { label: 'Alle Batterien', url: '/produkte' },
            { label: 'Motorsportbatterien', url: '/motorsportbatterien' },
            { label: 'Rennsportbatterien', url: '/rennsportbatterien' },
            { label: 'Motorradbatterien', url: '/motorradbatterien' },
          ],
        },
        {
          title: 'Service',
          links: [
            { label: 'Händler und Einbaupartner', url: '/haendler' },
            { label: 'Teams und Fahrer', url: '/teams' },
            { label: 'Beratung anrufen', url: 'tel:+4936134948420' },
            { label: 'E-Mail schreiben', url: 'mailto:info@bulltron-race.de' },
            { label: 'Warenkorb', url: '/warenkorb' },
          ],
        },
        {
          title: 'Rechtliches',
          links: [
            { label: 'Impressum', url: '/impressum' },
            { label: 'Datenschutz', url: '/datenschutz' },
            { label: 'AGB und Widerruf', url: '/agb' },
          ],
        },
      ],
      copyright: '© BULLTRON GmbH',
      paymentNote: 'Sichere Zahlung über Stripe:',
      shippingCost: 6.9,
      freeShippingFrom: 250,
      taxRate: 19,
      shippingCountries: [
        { code: 'DE', name: 'Deutschland' },
        { code: 'AT', name: 'Österreich' },
        { code: 'CH', name: 'Schweiz' },
      ],
      checkoutNote:
        'Lithium-Batterien sind Gefahrgut. Wir versenden ausschließlich über zugelassene Dienstleister in geprüfter Verpackung.',
      legal: {
        priceNote: 'Alle Preise inkl. gesetzlicher MwSt., zzgl. Versandkosten.',
        termsUrl: '/agb',
        privacyUrl: '/datenschutz',
        imprintUrl: '/impressum',
      },
    },
  })

  await payload.updateGlobal({
    slug: 'home',
    overrideAccess: true,
    data: {
      eyebrow: 'Made in Germany',
      headline: 'Die Batterie für den Motorsport',
      headlineAccent: 'Motorsport',
      subline:
        'Zuverlässig, nachhaltig, stark und Made in Germany. Entwickelt und konfektioniert in Lüneburg — von Profis für PS-Profis.',
      primaryCtaLabel: 'Batterien ansehen',
      primaryCtaUrl: '/produkte',
      secondaryCtaLabel: 'Beratung anrufen',
      secondaryCtaUrl: 'tel:+4936134948420',
      backgroundImage: heroBild.id,
      backgroundFocus: 'center-right',
      image: productImages['batterie-55ah.png'],
      stats: [
        { value: '10.000+', label: 'zufriedene Kunden' },
        { value: '5 Jahre', label: 'Herstellergarantie' },
        { value: '−30 °C', label: 'Entladetemperatur' },
        { value: '1400 A', label: 'max. Kaltstartstrom' },
      ],
      teaser: {
        enabled: true,
        eyebrow: 'Unser Versprechen',
        headline: 'Entwickelt und konfektioniert in Lüneburg',
        text: doc([
          p(
            'Bulltron Race ist eine Marke der BULLTRON GmbH. Die Batterien werden in Lüneburg entwickelt und konfektioniert.',
          ),
          p(
            'Lithium statt Blei heißt: derselbe Startstrom bei einem Bruchteil des Gewichts, dazu eine Lebensdauer, die ein Vielfaches einer Blei-Säure-Batterie erreicht.',
          ),
        ]),
        image: teaserImage.id,
        imagePosition: 'right',
        bullets: [
          { text: 'Bis zu 10-fache Lebensdauer gegenüber Blei-Säure' },
          { text: 'Bis 75 % höhere Zyklenlebensdauer als andere LiFePO4-Batterien' },
          { text: 'Bis 45 % kleiner und bis 35 % leichter als andere LiFePO4-Batterien' },
          { text: '5 Jahre deutsche Herstellergarantie' },
        ],
        ctaLabel: 'Technik im Detail',
        ctaUrl: '/produkte',
      },
      categoriesHeadline: 'Für jede Disziplin die passende Batterie',
      categoriesSubline:
        'Drei Baureihen, ein Anspruch: maximale Startleistung bei minimalem Gewicht. Wähle die Kategorie, die zu deinem Fahrzeug passt.',
      categoryCards: [
        { category: categoryIds.motorsportbatterien },
        { category: categoryIds.rennsportbatterien },
        { category: categoryIds.motorradbatterien },
      ],
      productsHeadline: 'Aus dem Programm',
      productsSubline:
        'Neun Ausführungen in fünf Kapazitäten — vom 500-Gramm-Leichtgewicht bis zur 55 Ah mit 1400 A.',
      featuredProducts: featuredIds,
      videoSection: {
        /* Aus, solange keine echten Videos vorliegen. Die drei Einträge unten
           sind Platzhalter mit Beispiel-Links — im Backend die echten
           YouTube-Adressen eintragen und dann einschalten. */
        enabled: false,
        eyebrow: 'Bulltron Race TV',
        headline: 'Sieh die Technik in Aktion',
        subline:
          'Kaltstart-Vergleiche, Einbau-Anleitungen und Eindrücke von der Strecke. Videos starten erst auf Klick — vorher wird keine Verbindung zu YouTube aufgebaut.',
        videos: [
          {
            url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
            title: 'Kaltstart bei −15 °C',
            description: 'Lithium gegen Blei, gleiches Fahrzeug, direkt hintereinander gemessen.',
            previewImage: videoKaltstart.id,
          },
          {
            url: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
            title: 'Einbau im Rennwagen',
            description: 'Worauf es bei Befestigung, Kabelquerschnitt und Hauptschalter ankommt.',
            previewImage: videoEinbau.id,
          },
          {
            url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
            title: 'Aus der Fertigung',
            description: 'Wie eine Bulltron-Race-Batterie entsteht — von der Zelle bis zur Endprüfung.',
            previewImage: videoFertigung.id,
          },
        ],
      },
      uspHeadline: 'Warum Bulltron Race',
      usps: [
        { icon: 'bolt', title: 'Bis 1400 A', text: 'Kaltstartstrom der 55-Ah-Batterie — der höchste im Programm.' },
        { icon: 'weight', title: 'Bis 35 % leichter', text: 'Und bis 45 % kleiner als andere LiFePO4-Batterien.' },
        { icon: 'temp', title: '−20 °C bis +60 °C', text: 'Laden bis −20 °C, entladen bis −30 °C. Auch nach der Winterpause startbereit.' },
        { icon: 'cycle', title: '10-fache Lebensdauer', text: 'Bleibatterie-Ersatz mit bis zu 10-facher Lebensdauer.' },
        { icon: 'shield', title: '5 Jahre Garantie', text: 'Deutsche Herstellergarantie auf jede Batterie der Baureihe.' },
        { icon: 'factory', title: 'Made in Germany', text: 'Entwickelt und konfektioniert in Lüneburg.' },
        { icon: 'truck', title: 'Schnelle Lieferung', text: 'Versand über zugelassene Dienstleister in geprüfter Verpackung.' },
        { icon: 'support', title: 'Direkte Beratung', text: 'Fragen zu Startstrom und Einbaumaß klären wir am Telefon.' },
      ],
      /* Kein Partner eingetragen: welche Partner genannt werden dürfen, weiß
         nur Bulltron. Im Backend unter „Inhalte → Startseite“ ergänzen. */
      partnerHeadline: '',
      partners: [],
      ctaBand: {
        enabled: true,
        headline: 'Unsicher, welche Batterie passt?',
        text: 'Sag uns, was du fährst — wir sagen dir, welche Batterie reinpasst und was sie leistet. Ohne Verkaufsgespräch.',
        ctaLabel: 'Jetzt anrufen',
        ctaUrl: 'tel:+4936134948420',
      },
      seo: {
        title: 'BULLTRON RACE — Lithium-Starterbatterien aus Deutschland',
        description:
          'Lithium-Starterbatterien für Motorsport, Rennsport und Motorrad. Bis 1400 A Kaltstartstrom, bis 35 % leichter, 5 Jahre deutsche Herstellergarantie. Made in Germany.',
      },
    },
  })

  payload.logger.info('Seed abgeschlossen.')
}

await seed()
process.exit(0)
