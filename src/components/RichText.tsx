import React from 'react'
import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'

type Props = {
  data: unknown
  className?: string
}

/** Rendert Payload-Lexical-Inhalte als HTML im Prose-Stil. */
export const RichText = ({ data, className = 'prose' }: Props) => {
  if (!data) return null
  return <LexicalRichText className={className} data={data as never} />
}
