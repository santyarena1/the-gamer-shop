export const CURRENCY_LABELS: Record<string, string> = {
  ARS: "ARS ($)",
  USD: "USD (US$)",
  USDT: "USDT",
  OTHER: "Otra",
}

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  PARTIAL: "Pago parcial",
  ADVANCE: "Adelanto",
  FINAL: "Pago final",
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  CHEQUE: "Cheque",
  USDT: "USDT",
  OTRO: "Otro",
}

export function sumPaymentsArs(payments: { amountArs: unknown }[]) {
  return payments.reduce((acc, p) => acc + Number(p.amountArs), 0)
}
