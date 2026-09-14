'use client'

import React, { useState } from 'react'

type Shot = { url: string; alt: string }

export const ProductGallery = ({ images, title }: { images: Shot[]; title: string }) => {
  const [index, setIndex] = useState(0)
  const active = images[index]

  return (
    <div>
      <div className="gallery__main">
        {active ? (
          <img src={active.url} alt={active.alt || title} />
        ) : (
          <span className="muted">Kein Produktbild hinterlegt</span>
        )}
      </div>

      {images.length > 1 ? (
        <div className="gallery__thumbs">
          {images.map((shot, i) => (
            <button
              key={shot.url + i}
              type="button"
              className="gallery__thumb"
              aria-current={i === index}
              aria-label={`Bild ${i + 1} anzeigen`}
              onClick={() => setIndex(i)}
            >
              <img src={shot.url} alt="" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
