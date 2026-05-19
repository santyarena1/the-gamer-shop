import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getPayrollStatus } from "@/lib/payroll"
import { getSession } from "@/lib/session"
import { getBranding } from "@/lib/branding"
import Header from "@/components/Header"
import IpcAlert from "@/components/IpcAlert"
import BrandingForm from "@/components/configuracion/BrandingForm"
import OpenAiSettingsForm from "@/components/configuracion/OpenAiSettingsForm"
import SerperSettingsForm from "@/components/configuracion/SerperSettingsForm"
import { getOpenAiPublicSettings } from "@/lib/openai-integration"
import { getSerperPublicSettings } from "@/lib/serper-integration"
import { MONTHS } from "@/lib/utils"

export default async function ConfiguracionPage() {
  const session = await getSession()
  if (!session) redirect("/login")
  if (session.role !== "ADMIN") redirect(`/empleados/${session.userId}`)

  const [payroll, history, branding, openAi, serper] = await Promise.all([
    getPayrollStatus(),
    db.monthlyIpc.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 12,
    }),
    getBranding(),
    getOpenAiPublicSettings(),
    getSerperPublicSettings(),
  ])

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header title="Configuración" />
      <main className="flex-1 p-6 space-y-10 max-w-2xl">
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Apariencia</h2>
            <p className="text-sm text-white/50 mt-1">
              Color de acento, nombre, subtítulo y logo del panel y la pantalla de login.
            </p>
          </div>
          <BrandingForm initial={branding} />
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Integración API</h2>
            <p className="text-sm text-white/50 mt-1">
              Claves para funciones opcionales con IA (mejora de imágenes de gabinete).
            </p>
          </div>
          <OpenAiSettingsForm initial={openAi} />
          <SerperSettingsForm initial={serper} />
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">IPC mensual</h2>
            <p className="text-sm text-white/50 mt-1">
              Porcentaje único del mes para empleados con ajuste por inflación. Al guardar se
              generan las liquidaciones automáticamente.
            </p>
          </div>
          <IpcAlert
            month={payroll.month}
            year={payroll.year}
            existingPercentage={payroll.ipcPercentage}
          />
        </section>

        {history.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-white/70">Historial reciente</h2>
            <ul className="bg-[#141414] border border-white/10 rounded-xl divide-y divide-white/10">
              {history.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <span>
                    {MONTHS[row.month - 1]} {row.year}
                    {row.month === payroll.month && row.year === payroll.year && (
                      <span className="ml-2 text-xs text-brand">(período actual)</span>
                    )}
                  </span>
                  <span className="font-medium text-brand">{Number(row.percentage)}%</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  )
}
