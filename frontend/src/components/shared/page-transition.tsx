import type { ReactNode } from 'react'

/** Keep route content in the same SSR and client tree, without hiding text on navigation. */
export default function PageTransition({ children }: { children: ReactNode }) {
  return <>{children}</>
}
