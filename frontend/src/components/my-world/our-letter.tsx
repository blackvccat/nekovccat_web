'use client'

import { useEffect, useRef } from 'react'
import type { RelationshipContent } from '@/lib/relationship-content'

export function LetterEnvelope() {
  return <svg viewBox="0 0 40 32" width="40" height="32" aria-hidden="true" className="letter-envelope" shapeRendering="crispEdges">
    <path d="M2 5h36v24H2z" fill="#faf2d9" stroke="#7d8267" strokeWidth="2" />
    <path d="M3 7h4v3h5v3h5v3h6v-3h5v-3h5V7h4M3 27l12-12m22 12L25 15" fill="none" stroke="#aaac8a" strokeWidth="2" />
    <path d="M16 17h3v2h2v-2h3v5h-2v2h-4v-2h-2z" fill="#a66f63" />
  </svg>
}

export default function OurLetter({ letter, onBack }: { letter: RelationshipContent['letter']; onBack: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }) }, [])

  return <div className="our-letter-reader">
    <div className="letter-toolbar"><button type="button" className="pixel-button" onClick={onBack}>← 返回小窝</button><span>{letter.toolbar}</span></div>
    <article className="letter-paper" aria-labelledby="yujuan-letter-title" tabIndex={0}>
      <div className="letter-paper-mark" aria-hidden="true"><LetterEnvelope /><span>FOR YOU, WITH LOVE.</span></div>
      <h2 id="yujuan-letter-title" tabIndex={-1} ref={headingRef}>{letter.title}</h2>
      {letter.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      <div className="letter-end-mark" aria-hidden="true">♡</div>
    </article>
  </div>
}
