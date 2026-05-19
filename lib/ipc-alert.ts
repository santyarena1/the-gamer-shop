export const IPC_ALERT_DISMISS_COOKIE = "ipc-alert-dismissed"

export function ipcAlertDismissKey(month: number, year: number) {
  return `${month}-${year}`
}

export function isIpcAlertDismissed(
  cookieValue: string | undefined,
  month: number,
  year: number,
) {
  return cookieValue === ipcAlertDismissKey(month, year)
}
