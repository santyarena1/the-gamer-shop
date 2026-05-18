import "dotenv/config"
import { db } from "../lib/db"
import { generateSalariesForMonth } from "../lib/generate-salaries"

async function main() {
  await generateSalariesForMonth(6, 2026)
  const s = await db.salary.findFirst({
    where: { month: 6, year: 2026 },
    include: { user: { select: { name: true } } },
  })
  if (!s) {
    console.log("No June salary")
    return
  }
  console.log({
    user: s.user.name,
    previousBase: String(s.previousBase),
    ipcPercentage: String(s.ipcPercentage),
    ipcIncrease: String(s.ipcIncrease),
    gross: String(s.grossAmount),
    net: String(s.amount),
    paid: s.paid,
    status: s.status,
  })
}

main().finally(() => db.$disconnect())
