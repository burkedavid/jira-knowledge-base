const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function resetAuthUsers() {
  try {
    console.log('🔄 Resetting authentication users...')

    // Clear existing users and related data
    console.log('🗑️  Clearing existing users...')
    await prisma.session.deleteMany({})
    await prisma.account.deleteMany({})
    await prisma.notification.deleteMany({})
    await prisma.user.deleteMany({})

    console.log('✅ Existing users cleared')

    // Hash passwords
    const adminPassword = await bcrypt.hash('DemoRAG2025!', 12)
    const userPassword = await bcrypt.hash('DemoRAG2025!', 12)

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'demo.admin@ragplatform.ai',
        name: 'Demo Admin',
        password: adminPassword,
        role: 'admin',
        emailVerified: new Date()
      }
    })

    console.log('✅ Admin user created:', admin.email)

    // Create regular user
    const user = await prisma.user.create({
      data: {
        email: 'demo.user@ragplatform.ai',
        name: 'Demo User',
        password: userPassword,
        role: 'user',
        emailVerified: new Date()
      }
    })

    console.log('✅ Regular user created:', user.email)

    console.log('\n🎉 Authentication users reset successfully!')
    console.log('\nYou can now log in with:')
    console.log('Admin: demo.admin@ragplatform.ai / DemoRAG2025!')
    console.log('User:  demo.user@ragplatform.ai / DemoRAG2025!')

  } catch (error) {
    console.error('❌ Error resetting auth users:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

resetAuthUsers()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  }) 