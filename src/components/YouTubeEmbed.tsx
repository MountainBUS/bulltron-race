'use client'

import React, { useState } from 'react'
import { IconPlay } from './Icons'
import { getEmbedUrl } from '../lib/youtube'

type Props = {
  videoId: string
  title?: string | null
  previewUrl?: string | null
  previewAlt?: string | null
}

/**
 * Datenschutzfreundliche Einbindung: Vor dem Klick wird keine Verbindung zu
 * YouTube aufgebaut. Erst beim Abspielen lädt der Player über youtube-nocookie.
 */
export const YouTubeEmbed = ({ videoId, title, previewUrl, previewAlt }: Props) => {
  const [active, setActive] = useState(false)
  const label = title || 'Video'

  if (active) {
    return (
      <div className="video-frame">
        <iframe
          src={getEmbedUrl(videoId)}
          title={label}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    )
  }

  return (
    <button type="button" className="video-frame" onClick={() => setActive(true)} aria-label={`${label} abspielen`}>
      {previewUrl ? <img src={previewUrl} alt={previewAlt || ''} loading="lazy" /> : null}
      <span className="video-frame__play">
        <span className="video-frame__icon">
          <IconPlay size={26} />
        </span>
      </span>
      <span className="video-frame__hint">
        Mit dem Abspielen wird eine Verbindung zu YouTube hergestellt.
      </span>
    </button>
  )
}
