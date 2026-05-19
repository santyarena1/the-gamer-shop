export type FlyerComponentIcon =
  | "cpu"
  | "motherboard"
  | "ram_storage"
  | "gpu"
  | "psu"
  | "cooler"
  | "monitor"
  | "other"

export type FlyerComponent = {
  icon: FlyerComponentIcon
  label: string
  value: string
}

export type FlyerBenefitIcon = "shield" | "star" | "headset" | "truck"

export type FlyerBenefit = {
  icon: FlyerBenefitIcon
  line1: string
  line2: string
}

export type FlyerPayload = {
  template: string
  output: { width: number; height: number; format: "png" }
  brand: {
    logoPath?: string | null
    primaryColor: string
    secondaryColor: string
    backgroundColor: string
    accentColor: string
  }
  product: {
    categoryLabel: string
    mainTitleLine1: string
    mainTitleLine2: string
    pcImageBase64?: string | null
  }
  components: FlyerComponent[]
  benefits: FlyerBenefit[]
}

export const DEFAULT_BENEFITS: FlyerBenefit[] = [
  { icon: "shield", line1: "COMPONENTES", line2: "DE CALIDAD" },
  { icon: "star", line1: "RENDIMIENTO", line2: "CONFIABLE" },
  { icon: "headset", line1: "GARANTÍA", line2: "OFICIAL" },
  { icon: "truck", line1: "ENVÍOS A", line2: "TODO EL PAÍS" },
]

export const FLYER_TEMPLATE_ID = "tgs_pc_gamer_1080_v1"
