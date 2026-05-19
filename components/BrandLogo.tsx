import Image from "next/image"
import type { BrandingSettings } from "@/lib/branding-constants"

function logoMark(branding: BrandingSettings): string {
  return branding.shopName.trim().charAt(0).toUpperCase() || "G"
}

type Props = {
  branding: BrandingSettings
  size?: "sm" | "md" | "lg"
  showText?: boolean
}

const sizes = {
  sm: { box: "w-8 h-8 text-sm", img: 32, title: "text-sm", sub: "text-xs" },
  md: { box: "w-10 h-10 text-base", img: 40, title: "text-sm", sub: "text-xs" },
  lg: { box: "w-14 h-14 text-2xl", img: 56, title: "text-2xl", sub: "text-sm" },
}

export default function BrandLogo({ branding, size = "sm", showText = true }: Props) {
  const s = sizes[size]
  const mark = logoMark(branding)

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div
        className={`${s.box} rounded-lg bg-brand flex items-center justify-center text-black font-bold shrink-0 overflow-hidden`}
      >
        {branding.logoUrl ? (
          <Image
            src={branding.logoUrl}
            alt={branding.shopName}
            width={s.img}
            height={s.img}
            className="w-full h-full object-contain"
            unoptimized
          />
        ) : (
          mark
        )}
      </div>
      {showText && (
        <div className="min-w-0">
          <p className={`font-semibold truncate ${s.title}`}>{branding.shopName}</p>
          <p className={`text-white/40 truncate ${s.sub}`}>{branding.tagline}</p>
        </div>
      )}
    </div>
  )
}
