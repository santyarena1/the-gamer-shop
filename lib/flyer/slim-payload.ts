import type { FlyerPayload } from "@/lib/flyer/types"

/** Payload sin imagen embebida (va en disco en caseImagePath). */
export function slimFlyerPayload(payload: FlyerPayload): FlyerPayload {
  return {
    ...payload,
    styleReference: payload.styleReference?.path
      ? { path: payload.styleReference.path }
      : undefined,
    product: {
      ...payload.product,
      pcImageBase64: null,
    },
  }
}
