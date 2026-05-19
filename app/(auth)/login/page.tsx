import { db } from "@/lib/db"
import { getCachedBranding } from "@/lib/server-cache"
import BrandLogo from "@/components/BrandLogo"
import LoginForm from "./LoginForm"
import RegisterForm from "./RegisterForm"

export default async function LoginPage() {
  const [userCount, branding] = await Promise.all([
    db.user.count(),
    getCachedBranding(),
  ])
  const isFirstRun = userCount === 0
  const canResetPassword = Boolean(process.env.PASSWORD_RESET_SECRET)

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8 flex flex-col items-center">
        <BrandLogo branding={branding} size="lg" showText />
        <p className="text-white/40 text-sm mt-4">
          {isFirstRun ? "Creá tu cuenta de administrador" : "Iniciá sesión para continuar"}
        </p>
      </div>

      <div className="bg-[#141414] border border-white/10 rounded-2xl p-6">
        {isFirstRun ? <RegisterForm /> : <LoginForm canResetPassword={canResetPassword} />}
      </div>
    </div>
  )
}
