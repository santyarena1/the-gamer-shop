import { db } from "@/lib/db"
import LoginForm from "./LoginForm"
import RegisterForm from "./RegisterForm"

export default async function LoginPage() {
  const userCount = await db.user.count()
  const isFirstRun = userCount === 0
  const canResetPassword = Boolean(process.env.PASSWORD_RESET_SECRET)

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-500 text-black font-bold text-2xl mb-4">
          G
        </div>
        <h1 className="text-2xl font-bold">The Gamer Shop</h1>
        <p className="text-white/40 text-sm mt-1">
          {isFirstRun ? "Creá tu cuenta de administrador" : "Iniciá sesión para continuar"}
        </p>
      </div>

      <div className="bg-[#141414] border border-white/10 rounded-2xl p-6">
        {isFirstRun ? <RegisterForm /> : <LoginForm canResetPassword={canResetPassword} />}
      </div>
    </div>
  )
}
