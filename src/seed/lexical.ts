/** Kleine Helfer, um Payload-Lexical-Inhalte im Seed zu erzeugen. */

type Node = { type: string; version: number; [key: string]: unknown }

const text = (value: string, format = 0): Node => ({
  type: 'text',
  detail: 0,
  format,
  mode: 'normal',
  style: '',
  text: value,
  version: 1,
})

const block = (type: string, children: Node[], extra: Record<string, unknown> = {}): Node => ({
  type,
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children,
  ...extra,
})

export const p = (value: string): Node => block('paragraph', [text(value)], { textFormat: 0, textStyle: '' })

export const h = (tag: 'h2' | 'h3' | 'h4', value: string): Node => block('heading', [text(value)], { tag })

export const ul = (values: string[]): Node =>
  block(
    'list',
    values.map((value, index) =>
      block('listitem', [text(value)], { value: index + 1, checked: undefined }),
    ),
    { listType: 'bullet', start: 1, tag: 'ul' },
  )

/** Der Rückgabetyp entspricht dem Lexical-Feldwert von Payload. */
export const doc = (children: Node[]): any => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children,
  },
})
