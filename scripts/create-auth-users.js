const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAuthUsers() {
  try {
    console.log('Creating/updating demo authentication users...')

    // Password for demo accounts
    const demoPassword = 'DemoRAG2025!'

    // Hash password
    const hashedPassword = await bcrypt.hash(demoPassword, 12)

    // Create/Update admin user
    const admin = await prisma.user.upsert({
      where: { email: 'demo.admin@ragplatform.ai' },
      update: {
        name: 'Demo Admin Platform',
        password: hashedPassword,
        role: 'admin' // Use lowercase 'admin' as per schema convention
      },
      create: {
        email: 'demo.admin@ragplatform.ai',
        name: 'Demo Admin Platform',
        password: hashedPassword,
        role: 'admin', // Use lowercase 'admin' as per schema convention
        emailVerified: new Date()
      }
    })

    console.log('✅ Admin user created/updated:', admin.email)

    // Create/Update regular user
    const user = await prisma.user.upsert({
      where: { email: 'demo.user@ragplatform.ai' },
      update: {
        name: 'Demo User Platform',
        password: hashedPassword,
        role: 'user' // Use lowercase 'user' as per schema convention
      },
      create: {
        email: 'demo.user@ragplatform.ai',
        name: 'Demo User Platform',
        password: hashedPassword,
        role: 'user', // Use lowercase 'user' as per schema convention
        emailVerified: new Date()
      }
    })

    console.log('✅ Regular user created/updated:', user.email)

    console.log('\n🎉 Demo authentication users created/updated successfully!')
    console.log('\nYou can now log in with:')
    console.log(`Admin: demo.admin@ragplatform.ai / ${demoPassword}`)
    console.log(`User:  demo.user@ragplatform.ai / ${demoPassword}`)

  } catch (error) {
    console.error('❌ Error creating/updating auth users:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createAuthUsers()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })