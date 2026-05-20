function escXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

/** Logo TGS por defecto (estilo flyer) cuando no hay logo en configuración. */
export function getDefaultTgsLogoSvg(shopName = "THE GAMER SHOP"): string {
  const parts = shopName.toUpperCase().split(/\s+/)
  const line1 = parts[0] === "THE" ? "THE" : parts[0]?.slice(0, 8) ?? "THE"
  const line2 =
    parts.length >= 2
      ? parts.slice(1, -1).join(" ") || parts[1] || "GAMER"
      : "GAMER"
  const line3 = parts.length > 2 ? parts[parts.length - 1] : parts.length === 2 ? "SHOP" : "SHOP"

  const gamer =
    line2.length > 10 ? line2.slice(0, 10) : line2 === "GAMER" ? "GAMER" : line2 || "GAMER"

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 110" width="340" height="110">
  <text x="0" y="22" fill="#ffffff" font-family="Impact, Haettenschweiler, Arial Black, sans-serif" font-size="20" font-weight="700" letter-spacing="1">${escXml(line1)}</text>
  <text x="0" y="72" fill="#ff0000" stroke="#ffffff" stroke-width="2.5" paint-order="stroke fill" font-family="Impact, Haettenschweiler, Arial Black, sans-serif" font-size="52" font-weight="900" letter-spacing="-1">${escXml(gamer)}</text>
  <g transform="translate(0, 78)" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round">
    <rect x="4" y="8" width="28" height="18" rx="4"/>
    <path d="M10 14h16 M18 8v6"/>
    <circle cx="12" cy="20" r="2.5" fill="#ffffff" stroke="none"/>
    <circle cx="24" cy="20" r="2.5" fill="#ffffff" stroke="none"/>
  </g>
  <text x="42" y="98" fill="#ffffff" font-family="Impact, Haettenschweiler, Arial Black, sans-serif" font-size="22" font-weight="700" letter-spacing="2">${escXml(line3 === "SHOP" || line3 === gamer ? "SHOP" : line3)}</text>
</svg>`
}

export function getDefaultTgsLogoDataUri(shopName?: string): string {
  const svg = getDefaultTgsLogoSvg(shopName)
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`
}
