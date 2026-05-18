import "dotenv/config"
import { db } from "../lib/db"

async function main() {
  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      role: true,
      baseSalary: true,
      ipcAdjusted: true,
      active: true,
    },
  })
  const ipcs = await db.monthlyIpc.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
  })
  const salaries = await db.salary.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: { user: { select: { name: true } } },
  })
  console.log("USERS", users)
  console.log("IPCS", ipcs)
  console.log(
    "SALARIES",
    salaries.map((s) => ({
      user: s.user.name,
      month: s.month,
      year: s.year,
      paid: s.paid,
      gross: String(s.grossAmount),
      amount: String(s.amount),
    })),
  )
}

main()
  .finally(() => db.$disconnect())
