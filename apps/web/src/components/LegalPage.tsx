import type { ReactNode } from 'react'

export type LegalSection = {
  id: string
  title: string
  content: ReactNode
}

type LegalPageProps = {
  eyebrow: string
  title: string
  description: string
  summary: ReactNode
  sections: LegalSection[]
}

export function LegalPage({ eyebrow, title, description, summary, sections }: LegalPageProps) {
  return (
    <article className="legal-page">
      <header className="legal-hero section-dark">
        <div className="wrap legal-hero-inner">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
          <div className="legal-review-line">
            <span>Operational draft</span>
            <span aria-hidden>/</span>
            <span>Last reviewed 1 August 2026</span>
          </div>
        </div>
      </header>

      <div className="wrap legal-layout">
        <aside className="legal-nav" aria-label={`${title} contents`}>
          <span className="legal-nav-label">On this page</span>
          <ol>
            {sections.map((section) => (
              <li key={section.id}><a href={`#${section.id}`}>{section.title}</a></li>
            ))}
          </ol>
        </aside>

        <div className="legal-content">
          <div className="legal-draft-note">
            <strong>About this draft</strong>
            <p>
              This page records the website&apos;s current intended operating practice. It is written for transparency and
              internal review; it does not invent a registered entity, regulator, governing law, certification, or guarantee
              that has not been confirmed in the site&apos;s formal business records.
            </p>
          </div>
          <div className="legal-summary">{summary}</div>
          {sections.map((section, index) => (
            <section id={section.id} className="legal-section" key={section.id}>
              <span className="legal-section-number">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h2>{section.title}</h2>
                {section.content}
              </div>
            </section>
          ))}
          <div className="legal-contact-note">
            <strong>Questions or requests</strong>
            <p>
              Use the email, telephone, or WhatsApp contact shown in the footer of this page. The displayed route is selected
              for your region where a public regional route is configured, otherwise it comes from the website&apos;s central settings.
            </p>
          </div>
        </div>
      </div>
    </article>
  )
}
