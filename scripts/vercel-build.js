const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting Vercel build process...');

// Check if we're in Vercel environment
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV || process.env.CI;
console.log(`Environment: ${isVercel ? 'Vercel/CI' : 'Local'}`);
console.log('Environment variables:', {
  VERCEL: process.env.VERCEL,
  VERCEL_ENV: process.env.VERCEL_ENV,
  CI: process.env.CI,
  NODE_ENV: process.env.NODE_ENV
});

if (isVercel) {
  console.log('🔄 Configuring for Vercel (PostgreSQL)...');
  
  // Verify environment variables first
  console.log('🔍 Checking environment variables...');
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('DATABASE_URL preview:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'undefined');
  console.log('NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);
  console.log('NEXTAUTH_URL exists:', !!process.env.NEXTAUTH_URL);
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('DATABASE')));
    process.exit(1);
  }
  
  if (!process.env.NEXTAUTH_SECRET) {
    console.error('❌ NEXTAUTH_SECRET not found in environment variables');
    console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('NEXTAUTH')));
    process.exit(1);
  }
  
  console.log('✅ Environment variables verified');
  
  // Switch to PostgreSQL
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  console.log('📁 Schema path:', schemaPath);
  
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ Schema file not found:', schemaPath);
    process.exit(1);
  }
  
  let schema = fs.readFileSync(schemaPath, 'utf8');
  console.log('📖 Current schema provider:', schema.match(/provider = "(\w+)"/)?.[1] || 'unknown');
  
  // Replace SQLite with PostgreSQL
  const originalSchema = schema;
  schema = schema.replace(
    /provider = "sqlite"/g,
    'provider = "postgresql"'
  );
  
  if (schema === originalSchema) {
    console.log('⚠️ No SQLite provider found to replace, schema might already be PostgreSQL');
  } else {
    console.log('🔄 Replaced SQLite with PostgreSQL');
  }
  
  fs.writeFileSync(schemaPath, schema);
  console.log('✅ Schema updated');
  
  // Verify the change
  const updatedSchema = fs.readFileSync(schemaPath, 'utf8');
  console.log('📖 Updated schema provider:', updatedSchema.match(/provider = "(\w+)"/)?.[1] || 'unknown');
  
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
  console.error('Error details:', error);
  process.exit(1);
} 