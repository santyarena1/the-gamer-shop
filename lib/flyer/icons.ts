/** Iconos SVG inline (stroke rojo #ff0000) para la plantilla. */
export function flyerIconPath(name: string): string {
  const icons: Record<string, string> = {
    cpu: "M8 8h16v16H8z M12 12h8v8h-8z M14 4v4 M18 4v4 M14 28v4 M18 28v4 M4 14h4 M4 18h4 M28 14h4 M28 18h4",
    motherboard:
      "M6 10h20v12H6z M10 14h2v2h-2z M16 14h2v2h-2z M22 14h2v2h-2z M10 18h2v2h-2z M22 18h2v2h-2z M14 6v4 M18 6v4 M14 22v4 M18 22v4",
    ram_storage:
      "M4 12h24v8H4z M8 14h2v4H8z M14 14h2v4h-2z M20 14h2v4h-2z M26 14h2v4h-2z M6 20h20v2H6z",
    gpu: "M4 10h8v12H4z M28 10h-8v12h8z M12 14h16v4H12z M14 18h4v2h-4z M22 18h4v2h-4z",
    psu: "M8 8h16v16H8z M12 12h8v8h-8z M20 4v4 M24 8h4v8h-4 M4 16h4v4H4",
    cooler: "M16 4v4 M16 26v4 M4 16h4 M28 16h4 M8 8l3 3 M23 23l3 3 M23 8l3-3 M8 23l3-3",
    monitor: "M6 8h20v14H6z M12 22h8v4h-8z M10 12h12",
    other: "M16 8l8 8-8 8-8-8z",
    shield: "M16 4l10 4v8c0 6-10 10-10 10S6 22 6 16V8z",
    star: "M16 6l3.5 7 7.5 1-5.5 5 1.5 8-7-4-7 4 1.5-8-5.5-5 7.5-1z",
    headset:
      "M8 18v-2a8 8 0 0116 0v2 M8 18h-2v4h4v-4 M24 18h2v4h-4v-4",
    truck: "M4 16h16v-6H4z M20 10h6l2 4v6h-4 M6 20a2 2 0 104 0 2 2 0 00-4 0 M22 20a2 2 0 104 0 2 2 0 00-4 0",
  }
  return icons[name] ?? icons.other
}

export function renderIconSvg(
  name: string,
  x: number,
  y: number,
  size: number,
  color: string,
  strokeWidth = 2,
): string {
  const scale = size / 32
  const path = flyerIconPath(name)
  return `<g transform="translate(${x},${y}) scale(${scale})">
    <path d="${path}" fill="none" stroke="${color}" stroke-width="${strokeWidth / scale}" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`
}
