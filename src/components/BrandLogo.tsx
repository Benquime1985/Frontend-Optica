import { brand } from '../config/brand'

export default function BrandLogo({ className, suffix, ariaLabel }: { className: string; suffix?: string; ariaLabel?: string }) {
  return <span className={className} aria-label={ariaLabel ?? `${brand.name} ${brand.subtitle}`}>
    <img className="brand-logo-image" src={brand.logoSrc} alt="" />
    <span>
      <strong>{brand.name}</strong>
      <small>{brand.subtitle}{suffix ? ` · ${suffix}` : ''}</small>
    </span>
  </span>
}

