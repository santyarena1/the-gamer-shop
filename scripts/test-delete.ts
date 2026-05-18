import "dotenv/config"
import { db } from "../lib/db"
import { deleteSalary } from "../actions/salaries"

async function main() {
  const s = await db.salary.findFirst({ where: { paid: false } })
  if (!s) {
    console.log("no unpaid salary")
    return
  }
  console.log("deleting", s.id, s.month, s.year)
  const r = await deleteSalary(s.id)
  console.log("result:", r)
  const left = await db.salary.count()
  console.log("salaries left:", left)
}

main().finally(() => db.$disconnect())
