import { ButtonLink } from './Button'

/** Slim sticky bottom bar, mobile-only (see .mobile-cta-bar in components.css) — puts
 * the two lowest-friction actions one tap away, since ad traffic is disproportionately
 * mobile and the nearest CTA is otherwise often a full screen-scroll away. */
export function MobileCtaBar({ whatsappDigits }: { whatsappDigits: string }) {
  return (
    <div className="mobile-cta-bar">
      <ButtonLink href="#lead-form" variant="primary">
        Book a free call
      </ButtonLink>
      <ButtonLink href={`https://wa.me/${whatsappDigits}`} variant="outline">
        WhatsApp
      </ButtonLink>
    </div>
  )
}
