import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create demo user accounts
  console.log('👤 Creating demo user accounts...')
  
  const adminPassword = await bcrypt.hash('DemoRAG2025!', 12)
  const userPassword = await bcrypt.hash('DemoRAG2025!', 12)

  const adminUser = await prisma.user.upsert({
    where: { email: 'demo.admin@ragplatform.ai' },
    update: {},
    create: {
      email: 'demo.admin@ragplatform.ai',
      name: 'Demo Admin',
      password: adminPassword,
      role: 'admin',
    },
  })

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo.user@ragplatform.ai' },
    update: {},
    create: {
      email: 'demo.user@ragplatform.ai',
      name: 'Demo User',
      password: userPassword,
      role: 'user',
    },
  })

  console.log('✅ Demo accounts created successfully!')
  console.log(`   Admin: ${adminUser.email} (ID: ${adminUser.id})`)
  console.log(`   User:  ${demoUser.email} (ID: ${demoUser.id})`)
  console.log('')
  console.log('🔐 Demo Login Credentials:')
  console.log('   Admin: demo.admin@ragplatform.ai / DemoRAG2025!')
  console.log('   User:  demo.user@ragplatform.ai / DemoRAG2025!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 