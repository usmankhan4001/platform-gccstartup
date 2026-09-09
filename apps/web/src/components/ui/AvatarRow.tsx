import Image from 'next/image'

/** Overlapping circular avatar row — humanizes "direct specialist access" copy
 * with real faces instead of an icon. Falls back to tinted placeholders for any
 * slot with no photo, so it degrades gracefully rather than showing broken images. */
export function AvatarRow({ photos }: { photos: string[] }) {
  return (
    <div className="avatar-row">
      {photos.map((src, i) => (
        <div className="avatar-row-item" key={i}>
          {src && <Image src={src} alt="" fill sizes="64px" style={{ objectFit: 'cover' }} />}
        </div>
      ))}
    </div>
  )
}
