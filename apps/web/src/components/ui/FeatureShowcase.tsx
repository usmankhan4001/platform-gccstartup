'use client'

import Image from 'next/image'
import {
  Shield,
  TrendingUp,
  Clock,
  Globe,
  Award,
  Users,
  Lock,
  CheckCircle2,
  Check,
  type LucideIcon,
} from 'lucide-react'

const ROTATING_ICONS: LucideIcon[] = [Shield, TrendingUp, Clock, Globe, Award, Users, Lock, CheckCircle2]

export type FeatureShowcaseItem = { title: string; desc: string; image?: string | null }

export function FeatureShowcase({
  items,
  accent = 'orange',
}: {
  items: FeatureShowcaseItem[]
  accent?: 'blue' | 'orange'
}) {
  if (!items || items.length === 0) return null

  return (
    <div className="feature-card-grid" data-accent={accent}>
      {items.map((item, i) => {
        const Icon = ROTATING_ICONS[i % ROTATING_ICONS.length]
        const itemNumber = String(i + 1).padStart(2, '0')

        return (
          <div key={i} className="feature-grid-card reveal">
            {item.image && (
              <div className="feature-card-image-wrap">
                <Image
                  src={item.image}
                  alt={item.title || 'Feature image'}
                  fill
                  sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                  quality={80}
                  className="feature-card-image"
                />
              </div>
            )}

            <div className="feature-card-body">
              <div className="feature-card-top">
                <div className="feature-card-icon-badge">
                  <Icon size={22} strokeWidth={2} aria-hidden />
                </div>
                <span className="feature-card-number">{itemNumber}</span>
              </div>

              <h3 className="feature-card-title">{item.title}</h3>
              <p className="feature-card-desc">{item.desc}</p>

              <div className="feature-card-footer">
                <span className="feature-card-check">
                  <Check size={14} strokeWidth={2.5} aria-hidden /> Included
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
