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

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
console.log('📁 Schema path:', schemaPath);

if (!fs.existsSync(schemaPath)) {
  console.error('❌ Schema file not found:', schemaPath);
  process.exit(1);
}

if (isVercel) {
  console.log('🔄 Configuring for Vercel (PostgreSQL)...');
  
  // Verify critical environment variables
  const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
    console.error('Available DATABASE vars:', Object.keys(process.env).filter(key => key.includes('DATABASE')));
    console.error('Available NEXTAUTH vars:', Object.keys(process.env).filter(key => key.includes('NEXTAUTH')));
    process.exit(1);
  }
  
  console.log('✅ Required environment variables found');
  console.log('DATABASE_URL preview:', process.env.DATABASE_URL.substring(0, 20) + '...');
  
  // Read and update schema
  let schema = fs.readFileSync(schemaPath, 'utf8');
  console.log('📖 Current schema provider:', schema.match(/provider = "(\w+)"/)?.[1] || 'unknown');
  
  // Ensure we're using PostgreSQL
  if (schema.includes('provider = "sqlite"')) {
    schema = schema.replace(/provider = "sqlite"/g, 'provider = "postgresql"');
    fs.writeFileSync(schemaPath, schema);
    console.log('🔄 Switched from SQLite to PostgreSQL');
  } else if (schema.includes('provider = "postgresql"')) {
    console.log('✅ Already using PostgreSQL');
  } else {
    console.error('❌ Unknown database provider in schema');
    process.exit(1);
  }
  
} else {
  console.log('🔄 Configuring for local development (SQLite)...');
  
  // Read and update schema for local development
  let schema = fs.readFileSync(schemaPath, 'utf8');
  
  if (schema.includes('provider = "postgresql"')) {
    schema = schema.replace(/provider = "postgresql"/g, 'provider = "sqlite"');
    fs.writeFileSync(schemaPath, schema);
    console.log('🔄 Switched from PostgreSQL to SQLite');
  } else if (schema.includes('provider = "sqlite"')) {
    console.log('✅ Already using SQLite');
  }
}

// Verify the final schema state
const finalSchema = fs.readFileSync(schemaPath, 'utf8');
const finalProvider = finalSchema.match(/provider = "(\w+)"/)?.[1] || 'unknown';
console.log('📖 Final schema provider:', finalProvider);

try {
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated');
  
  if (isVercel) {
    console.log('🗄️ Pushing database schema...');
    try {
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
      console.log('✅ Database schema pushed successfully');
    } catch (pushError) {
      console.warn('⚠️ Schema push failed, trying without --accept-data-loss flag:', pushError.message);
      try {
        execSync('npx prisma db push', { stdio: 'inherit' });
        console.log('✅ Database schema pushed successfully (second attempt)');
      } catch (secondError) {
        console.error('❌ Schema push failed completely:', secondError.message);
        // Don't exit here - let the build continue in case the schema is already up to date
        console.warn('⚠️ Continuing with build despite schema push failure...');
      }
    }
  }
  
  console.log('🏗️ Building Next.js application...');
  execSync('npx next build', { stdio: 'inherit' });
  console.log('✅ Next.js build completed');
  
  console.log('🎉 Build process completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.error('Error details:', error);
  process.exit(1);
} 