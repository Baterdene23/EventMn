import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"

const connectionString = process.env.DATABASE_URL!
const adapter = new PrismaNeon({ connectionString })
const prisma = new PrismaClient({ adapter })

// Log all model names on the Prisma client
const modelNames = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'))
console.log("Available models:", modelNames)

// Check if emailOtp exists
console.log("Has emailOtp:", "emailOtp" in prisma)
console.log("Has email_otps:", "email_otps" in prisma)

// Try to access
console.log("typeof prisma.emailOtp:", typeof (prisma as any).emailOtp)
console.log("typeof prisma.email_otps:", typeof (prisma as any).email_otps)
