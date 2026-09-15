import React from 'react'

/**
 * Kleines Zeichen in der Kopfzeile des Backends, neben dem Seitentitel.
 * Kompakte Fassung des Logos ohne Claim — in dieser Größe wäre er unlesbar.
 * Zwei Fassungen wie beim Logo, siehe Logo.tsx.
 */
export const Icon = () => (
  <>
    <style>{`
      .bt-icon { width: auto; height: 1.6rem; display: block; }
      .bt-icon--hell { display: none; }
      [data-theme='light'] .bt-icon--dunkel { display: none; }
      [data-theme='light'] .bt-icon--hell { display: block; }
    `}</style>
    <img className="bt-icon bt-icon--dunkel" src="/admin/icon.png" alt="Bulltron Race" width={800} height={182} />
    <img className="bt-icon bt-icon--hell" src="/admin/icon-hell.png" alt="Bulltron Race" width={800} height={182} />
  </>
)

export default Icon
