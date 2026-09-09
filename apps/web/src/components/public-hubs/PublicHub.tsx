import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd'
import { WebPageJsonLd } from '@/components/seo/WebPageJsonLd'
import styles from './PublicHub.module.css'

type RouteStage = 'jurisdiction' | 'structure' | 'launch' | 'operate'

const stages: Array<{ id: RouteStage; label: string; note: string }> = [
  { id: 'jurisdiction', label: 'Choose a jurisdiction', note: 'Residency, tax, banking and market fit' },
  { id: 'structure', label: 'Choose a structure', note: 'Ownership, package and compliance scope' },
  { id: 'launch', label: 'Form and activate', note: 'Registration, banking and operational setup' },
  { id: 'operate', label: 'Stay compliant', note: 'Renewals, reporting and ongoing support' },
]

export function HubPage({ children }: { children: ReactNode }) {
  return <div className={styles.page}>{children}</div>
}

export function HubHero({
  eyebrow,
  title,
  description,
  activeStage,
  primaryHref = '/book-consultation',
  primaryLabel = 'Request a consultation',
  secondaryHref,
  secondaryLabel,
  canonicalUrl,
}: {
  eyebrow: string
  title: string
  description: string
  activeStage: RouteStage
  primaryHref?: string
  primaryLabel?: string
  secondaryHref?: string
  secondaryLabel?: string
  canonicalUrl: string
}) {
  return (
    <header className={styles.hero}>
      <WebPageJsonLd title={title} description={description} url={canonicalUrl} />
      <BreadcrumbJsonLd
        items={[
          {
            name: 'Home',
            url:
              canonicalUrl.replace(
                /\/(services|jurisdictions|pricing|resources|contact|book-consultation)\/?$/,
                ''
              ) || canonicalUrl,
          },
          { name: eyebrow, url: canonicalUrl },
        ]}
      />
      <div className="wrap">
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{eyebrow}</span>
        </nav>
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <span className="eyebrow" style={{ color: 'color-mix(in srgb, var(--white) 66%, transparent)' }}>
              {eyebrow}
            </span>
            <h1>{title}</h1>
            <p className={styles.heroLead}>{description}</p>
            <div className={styles.heroActions}>
              <Link href={primaryHref} className="btn btn-primary">
                {primaryLabel} <ArrowRight size={17} aria-hidden="true" />
              </Link>
              {secondaryHref && secondaryLabel && (
                <Link href={secondaryHref} className={styles.secondaryAction}>
                  {secondaryLabel}
                </Link>
              )}
            </div>
          </div>
          <div className={styles.routeMap} aria-label="Company formation decision route">
            <p className={styles.routeLabel}>Your formation route</p>
            {stages.map((stage, index) => (
              <div
                key={stage.id}
                className={`${styles.routeStep} ${stage.id === activeStage ? styles.routeStepActive : ''}`}
              >
                <span className={styles.routeDot}>{String(index + 1).padStart(2, '0')}</span>
                <span>
                  <strong>{stage.label}</strong>
                  <br />
                  {stage.note}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  titleId,
  id,
}: {
  eyebrow: string
  title: string
  description: string
  titleId?: string
  id?: string
}) {
  return (
    <div className={styles.sectionHeader}>
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2 id={titleId || id}>{title}</h2>
      </div>
      <p>{description}</p>
    </div>
  )
}

export function EmptyState({
  title,
  description,
  href = '/book-consultation',
}: {
  title: string
  description: string
  href?: string
}) {
  return (
    <div className={styles.empty}>
      <h3>{title}</h3>
      <p>{description}</p>
      <div className={styles.sectionActions} style={{ justifyContent: 'center' }}>
        <Link href={href} className="btn btn-outline">
          Ask a specialist
        </Link>
      </div>
    </div>
  )
}

export function ConversionBand({
  title,
  description,
  label = 'Request a consultation',
  primaryHref = '/#lead-form',
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  title: string
  description: string
  label?: string
  primaryHref?: string
  primaryLabel?: string
  secondaryHref?: string
  secondaryLabel?: string
}) {
  const pLabel = primaryLabel || label
  return (
    <section className={styles.conversion} aria-labelledby="hub-conversion-title">
      <div className="wrap">
        <div className={styles.conversionInner}>
          <div>
            <h2 id="hub-conversion-title">{title}</h2>
            <p>{description}</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href={primaryHref} className="btn btn-primary">
              {pLabel} <ArrowRight size={17} aria-hidden="true" />
            </Link>
            {secondaryHref && secondaryLabel && (
              <Link href={secondaryHref} className="btn btn-outline" style={{ color: 'var(--white)', borderColor: 'rgba(255,255,255,0.3)' }}>
                {secondaryLabel}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export { styles }
