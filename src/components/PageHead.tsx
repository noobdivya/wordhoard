import type { ReactNode } from 'react'

interface Props {
  kicker: string
  title: ReactNode
  lead?: ReactNode
  /** Shown to the right of the heading, e.g. a progress ring */
  aside?: ReactNode
}

export function PageHead({ kicker, title, lead, aside }: Props) {
  return (
    <section className="phead">
      <div>
        <div className="kicker">{kicker}</div>
        <h1>{title}</h1>
        {lead && <p className="lead">{lead}</p>}
      </div>
      {aside}
    </section>
  )
}
