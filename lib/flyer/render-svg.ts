import type { FlyerPayload } from "@/lib/flyer/types"
import { renderIconSvg } from "@/lib/flyer/icons"

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function multilineTspans(
  lines: string,
  x: number,
  y: number,
  lineHeight: number,
  attrs: string,
): string {
  const parts = lines.split("\n")
  if (parts.length <= 1) {
    return `<text x="${x}" y="${y}" ${attrs}>${esc(lines)}</text>`
  }
  return `<text x="${x}" y="${y}" ${attrs}>${parts
    .map(
      (line, i) =>
        `<tspan x="${x}" dy="${i === 0 ? 0 : lineHeight}">${esc(line)}</tspan>`,
    )
    .join("")}</text>`
}

export function buildFlyerSvg(payload: FlyerPayload, logoDataUri: string | null): string {
  const w = 1080
  const h = 1080
  const red = payload.brand.primaryColor
  const white = payload.brand.secondaryColor
  const bg = payload.brand.backgroundColor

  let yComp = 470
  const componentsSvg = payload.components
    .map((comp) => {
      const block = `
      <g transform="translate(50, ${yComp})">
        <rect x="0" y="6" width="86" height="76" rx="8" fill="#0a0a0a" stroke="#333333" stroke-width="1"/>
        ${renderIconSvg(comp.icon, 27, 28, 32, red)}
        <text x="100" y="32" fill="${red}" font-family="Arial Black, Impact, sans-serif" font-size="22" font-weight="bold">${esc(comp.label)}</text>
        ${multilineTspans(comp.value, 100, 62, 30, `fill="${white}" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="bold"`)}
        <line x1="0" y1="88" x2="400" y2="88" stroke="#222222" stroke-width="1"/>
      </g>`
      yComp += 88
      return block
    })
    .join("")

  const benefitW = 245
  const benefitsSvg = payload.benefits
    .map((b, i) => {
      const bx = 50 + i * benefitW
      const sep =
        i > 0
          ? `<line x1="${bx}" y1="935" x2="${bx}" y2="1005" stroke="#333333" stroke-width="1"/>`
          : ""
      return `${sep}
      <g transform="translate(${bx + 20}, 930)">
        ${renderIconSvg(b.icon, 0, 0, 28, white, 1.8)}
        <text x="40" y="18" fill="${white}" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="bold">${esc(b.line1)}</text>
        <text x="40" y="40" fill="${red}" font-family="Arial, Helvetica, sans-serif" font-size="19" font-weight="bold">${esc(b.line2)}</text>
      </g>`
    })
    .join("")

  const pcImage = payload.product.pcImageBase64
    ? `<image href="${payload.product.pcImageBase64}" x="455" y="190" width="585" height="680" preserveAspectRatio="xMidYMid meet"/>`
    : `<text x="700" y="520" text-anchor="middle" fill="#444" font-size="24" font-family="Arial">Sin imagen de gabinete</text>`

  const logoBlock = logoDataUri
    ? `<image href="${logoDataUri}" x="50" y="40" width="220" height="80" preserveAspectRatio="xMidYMid meet"/>`
    : `<text x="50" y="90" fill="${white}" font-family="Impact, sans-serif" font-size="36" font-weight="bold">TGS</text>`

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <radialGradient id="glow" cx="72%" cy="45%" r="55%">
      <stop offset="0%" stop-color="${payload.brand.accentColor}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${bg}" stop-opacity="0"/>
    </radialGradient>
    <filter id="pcShadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="30" stdDeviation="40" flood-color="${red}" flood-opacity="0.35"/>
    </filter>
  </defs>
  <rect width="${w}" height="${h}" fill="${bg}"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>
  <rect width="${w}" height="${h}" fill="url(#glow)" opacity="0.6"/>

  ${logoBlock}

  <text x="50" y="195" fill="${red}" font-family="Arial Black, Impact, sans-serif" font-size="30" font-weight="bold" letter-spacing="2">${esc(payload.product.categoryLabel)}</text>
  <text x="50" y="265" fill="${white}" font-family="Impact, Arial Black, sans-serif" font-size="88" font-weight="900">${esc(payload.product.mainTitleLine1)}</text>
  <text x="50" y="395" fill="${red}" font-family="Impact, Arial Black, sans-serif" font-size="130" font-weight="900">${esc(payload.product.mainTitleLine2)}</text>
  <line x1="50" y1="450" x2="440" y2="450" stroke="#c00000" stroke-width="2"/>

  ${componentsSvg}

  <g filter="url(#pcShadow)">
    ${pcImage}
  </g>

  <line x1="50" y1="915" x2="1030" y2="915" stroke="#333333" stroke-width="1"/>
  ${benefitsSvg}
</svg>`
}
