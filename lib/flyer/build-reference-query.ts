import type { FlyerPayload } from "@/lib/flyer/types"

export type ReferenceImageKind = "case" | "product"

function firstLine(value: string): string {
  return value.split("\n")[0]?.trim() ?? ""
}

function findComponent(payload: FlyerPayload, match: (label: string, icon: string) => boolean) {
  return payload.components.find((c) => match(c.label.toUpperCase(), c.icon))
}

export function buildReferenceImageQuery(
  payload: FlyerPayload,
  kind: ReferenceImageKind,
): string {
  const pcTitle = `${payload.product.mainTitleLine1} ${payload.product.mainTitleLine2}`.trim()

  if (kind === "case") {
    const caseComp = findComponent(
      payload,
      (label) => label.includes("GABINETE") || label.includes("CASE"),
    )
    const caseName = caseComp ? firstLine(caseComp.value) : ""
    if (caseName) {
      return `${caseName} gabinete PC gamer PNG fondo transparente`
    }
    return `${pcTitle || "PC gamer"} gabinete RGB PNG fondo transparente`
  }

  const gpu = findComponent(payload, (_, icon) => icon === "gpu")
  const gpuName = gpu ? firstLine(gpu.value) : ""
  if (gpuName) {
    return `${gpuName} placa de video producto PNG fondo blanco`
  }

  const cpu = findComponent(payload, (_, icon) => icon === "cpu")
  const cpuName = cpu ? firstLine(cpu.value) : ""
  if (cpuName) {
    return `${cpuName} procesador producto PNG fondo blanco`
  }

  if (payload.product.categoryLabel.toUpperCase().includes("PRODUCTO")) {
    return `${pcTitle || "producto"} PNG fondo blanco`
  }

  return `${pcTitle || "PC gamer"} producto PNG`
}

export function suggestReferenceImageKind(payload: FlyerPayload): ReferenceImageKind {
  const hasCase = payload.components.some((c) => {
    const label = c.label.toUpperCase()
    return label.includes("GABINETE") || label.includes("CASE")
  })
  const isProductCategory = payload.product.categoryLabel.toUpperCase().includes("PRODUCTO")
  if (isProductCategory && !hasCase) return "product"
  return "case"
}
