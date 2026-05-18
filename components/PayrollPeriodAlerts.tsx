import type { PayrollStatus } from "@/lib/payroll"
import IpcAlert from "@/components/IpcAlert"

type Props = {
  payroll: PayrollStatus
}

/** Aviso global: un IPC por mes para todos los empleados. */
export default function PayrollPeriodAlerts({ payroll }: Props) {
  if (!payroll.showIpcPrompt) return null

  return (
    <IpcAlert
      month={payroll.month}
      year={payroll.year}
      existingPercentage={payroll.ipcPercentage}
    />
  )
}
