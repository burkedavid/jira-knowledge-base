const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting Vercel build process...');

// Check if we're in Vercel environment
const isVercel = process.env.VERCEL === '1';
console.log(`Environment: ${isVercel ? 'Vercel' : 'Local'}`);

if (isVercel) {
  console.log('🔄 Configuring for Vercel (PostgreSQL)...');
  
  // Switch to PostgreSQL
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  let schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Replace SQLite with PostgreSQL
  schema = schema.replace(
    /provider = "sqlite"/g,
    'provider = "postgresql"'
  );
  
  fs.writeFileSync(schemaPath, schema);
  console.log('✅ Switched to PostgreSQL');
  
  // Verify environment variables
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }
  
  if (!process.env.NEXTAUTH_SECRET) {
    console.error('❌ NEXTAUTH_SECRET not found in environment variables');
    process.exit(1);
  }
  
  console.log('✅ Environment variables verified');
} else {
  console.log('🔄 Configuring for local development (SQLite)...');
  
  // Switch to SQLite
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  let schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Replace PostgreSQL with SQLite
  schema = schema.replace(
    /provider = "postgresql"/g,
    'provider = "sqlite"'
  );
  
  fs.writeFileSync(schemaPath, schema);
  console.log('✅ Switched to SQLite');
}

try {
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated');
  
  console.log('🏗️ Building Next.js application...');
  execSync('npx next build', { stdio: 'inherit' });
  console.log('✅ Next.js build completed');
  
  console.log('🎉 Build process completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} 