import type { FlyerPayload } from "@/lib/flyer/types"

function formatComponents(payload: FlyerPayload): string {
  return payload.components
    .map(
      (c, i) =>
        `${i + 1}. Label (red caps): "${c.label}" | Value (white): "${c.value.replace(/\n/g, " / ")}"`,
    )
    .join("\n")
}

function formatBenefits(payload: FlyerPayload): string {
  return payload.benefits
    .map((b, i) => `${i + 1}. Line1: "${b.line1}" | Line2 (red): "${b.line2}"`)
    .join("\n")
}

export function buildOpenAiFlyerPrompt(payload: FlyerPayload, shopName: string): string {
  const { product, brand } = payload

  return [
    `Create a professional square gaming PC retail flyer advertisement for "${shopName}".`,
    "",
    "VISUAL STYLE:",
    "- Premium dark gamer aesthetic: deep black background, intense red and white, subtle red radial glow behind the PC on the right.",
    "- High contrast, clean commercial layout, similar to top Argentine PC gamer store social media posts.",
    `- Primary red approximately ${brand.primaryColor}, background ${brand.backgroundColor}.`,
    "",
    "LAYOUT (mandatory):",
    "- Top-left: reserved empty area ~220px wide for brand logo overlay (do not draw a fake logo).",
    "- Left column (~45%): category, two-line hero title, red divider, vertical component list with red icon boxes.",
    "- Right side (~55%): large PC case from the provided product reference — same product, angle and proportions, RGB visible, soft red glow, no distortion.",
    "- Bottom: horizontal bar with exactly four benefit blocks and thin vertical separators.",
    "",
    "EXACT TEXT — copy verbatim (Spanish, same spelling and capitalization, do not invent, translate, fix or omit):",
    `Category (small red): "${product.categoryLabel}"`,
    `Title line 1 (large white condensed): "${product.mainTitleLine1}"`,
    `Title line 2 (larger red, white outline): "${product.mainTitleLine2}"`,
    "",
    "COMPONENTS:",
    formatComponents(payload),
    "",
    "BOTTOM BENEFITS:",
    formatBenefits(payload),
    "",
    "RULES:",
    "- No price. No extra slogans or text beyond the list above.",
    "- Bold condensed gamer typography (Impact / Bebas Neue style).",
    "- Component rows: dark box, red linear icon, red uppercase label, white value.",
    "- If a second reference image is provided, match its overall style, color balance and layout mood closely.",
    "- Do not crop or simplify the PC hardware from the product image.",
  ].join("\n")
}
