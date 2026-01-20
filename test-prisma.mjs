import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"

const connectionString = process.env.DATABASE_URL
const adapter = new PrismaNeon({ connectionString })
const prisma = new PrismaClient({ adapter })

console.log("Prisma models available:")
console.log(Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')))

try {
  const count = await prisma.emailOtp.count()
  console.log("EmailOtp count:", count)
} catch (e) {
  console.error("Error:", e.message)
}

await prisma.$disconnect()
