const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAuthUsers() {
  try {
    console.log('Creating authentication users...')

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 12)
    const userPassword = await bcrypt.hash('user123', 12)

    // Create admin user
    const admin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {
        password: adminPassword,
        role: 'admin'
      },
      create: {
        email: 'admin@example.com',
        name: 'Demo Admin',
        password: adminPassword,
        role: 'admin',
        emailVerified: new Date()
      }
    })

    console.log('✅ Admin user created:', admin.email)

    // Create regular user
    const user = await prisma.user.upsert({
      where: { email: 'user@example.com' },
      update: {
        password: userPassword,
        role: 'user'
      },
      create: {
        email: 'user@example.com',
        name: 'Demo User',
        password: userPassword,
        role: 'user',
        emailVerified: new Date()
      }
    })

    console.log('✅ Regular user created:', user.email)

    console.log('\n🎉 Authentication users created successfully!')
    console.log('\nYou can now log in with:')
    console.log('Admin: admin@example.com / admin123')
    console.log('User:  user@example.com / user123')

  } catch (error) {
    console.error('❌ Error creating auth users:', error)
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