export const QUOTE_BUTTON_VARIANTS: Record<
  string,
  { button: string; badge: string }
> = {
  default: {
    button: "bg-white/10 text-white/80 hover:bg-white/15",
    badge: "bg-white/10 text-white/60",
  },
  green: {
    button: "bg-green-500/15 text-green-400 hover:bg-green-500/25",
    badge: "bg-green-500/20 text-green-400",
  },
  amber: {
    button: "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25",
    badge: "bg-amber-500/20 text-amber-400",
  },
  blue: {
    button: "bg-blue-500/15 text-blue-400 hover:bg-blue-500/25",
    badge: "bg-blue-500/20 text-blue-400",
  },
  red: {
    button: "bg-red-500/15 text-red-400 hover:bg-red-500/25",
    badge: "bg-red-500/20 text-red-400",
  },
  purple: {
    button: "bg-purple-500/15 text-purple-400 hover:bg-purple-500/25",
    badge: "bg-purple-500/20 text-purple-400",
  },
}

export const QUOTE_VARIANT_OPTIONS = Object.keys(QUOTE_BUTTON_VARIANTS)

export type QuickButton = {
  id: string
  label: string
  variant: string
  sortOrder: number
  active: boolean
}
