const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🌱 Starting PostgreSQL database seeding...');

// Check if we have the required environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

if (!process.env.DATABASE_URL.startsWith('postgresql://') && !process.env.DATABASE_URL.startsWith('postgres://')) {
  console.error('❌ DATABASE_URL must be a PostgreSQL connection string');
  process.exit(1);
}

console.log('✅ PostgreSQL connection string detected');
console.log('🔍 Database URL preview:', process.env.DATABASE_URL.substring(0, 30) + '...');

try {
  // Ensure we're using PostgreSQL in the schema
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  let schema = fs.readFileSync(schemaPath, 'utf8');
  
  if (schema.includes('provider = "sqlite"')) {
    console.log('🔄 Switching schema to PostgreSQL...');
    schema = schema.replace(/provider = "sqlite"/g, 'provider = "postgresql"');
    fs.writeFileSync(schemaPath, schema);
    console.log('✅ Schema updated to PostgreSQL');
  } else {
    console.log('✅ Schema already configured for PostgreSQL');
  }

  // Generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Run migrations
  console.log('🗄️ Running database migrations...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });

  // Run seed
  console.log('🌱 Seeding database with demo accounts...');
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });

  console.log('🎉 PostgreSQL database seeded successfully!');
  console.log('');
  console.log('🔐 Demo Login Credentials:');
  console.log('   Admin: demo.admin@ragplatform.ai / DemoRAG2025!');
  console.log('   User:  demo.user@ragplatform.ai / DemoRAG2025!');

} catch (error) {
  console.error('❌ Error seeding PostgreSQL database:', error.message);
  process.exit(1);
} 