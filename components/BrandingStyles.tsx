import { brandingCssVars } from "@/lib/branding"
import type { BrandingSettings } from "@/lib/branding-constants"

export default function BrandingStyles({ branding }: { branding: BrandingSettings }) {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `:root{${brandingCssVars(branding)}}`,
      }}
    />
  )
}
