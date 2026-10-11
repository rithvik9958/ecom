'use client'

/**
 * RichEditor – CKEditor 5 (free/open-source, GPL) wrapper for Next.js App Router.
 *
 * Features included (all from the free `ckeditor5` package):
 *   Bold, Italic, Underline, Strikethrough, Subscript, Superscript
 *   Headings (H1–H6), Paragraph, Block-quote, Code block
 *   Alignment (left / center / right / justify)
 *   Bullet list, Numbered list, To-do list, Indent / Outdent
 *   Link (with decorators), Image (upload + URL), Media embed
 *   Table (with full toolbar), Horizontal rule
 *   Find & Replace, Word count, Special characters
 *   Undo / Redo, Remove format
 *   Source editing (raw HTML)
 *   Font size, Font color, Background color
 *   Page break, Highlight
 */

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

// We lazy-load the inner component to prevent SSR issues
const CKEditorInner = dynamic(() => import('./CKEditorInner'), { ssr: false })

export default function RichEditor({ value = '', onChange, placeholder = 'Enter content here...', minHeight = 220 }) {
  return (
    <CKEditorInner
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      minHeight={minHeight}
    />
  )
}
