const fs = require('fs');
const path = require('path');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

console.log('Setting up local development environment...');

// Read the example file
if (!fs.existsSync(envExamplePath)) {
  console.error('env.example file not found!');
  process.exit(1);
}

const envExample = fs.readFileSync(envExamplePath, 'utf8');

// Create .env file with SQLite configuration if it doesn't exist
if (!fs.existsSync(envPath)) {
  console.log('Creating .env file with SQLite configuration...');
  
  // Use the example as template but ensure SQLite is configured
  let envContent = envExample
    .replace('# DATABASE_PROVIDER="sqlite"', 'DATABASE_PROVIDER="sqlite"')
    .replace('# DATABASE_URL="file:./dev.db"', 'DATABASE_URL="file:./dev.db"')
    .replace('DATABASE_PROVIDER="postgresql"', '# DATABASE_PROVIDER="postgresql"')
    .replace('DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"', '# DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"');
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created with SQLite configuration');
} else {
  console.log('📝 .env file already exists');
  
  // Check if it has DATABASE_PROVIDER
  const existingEnv = fs.readFileSync(envPath, 'utf8');
  if (!existingEnv.includes('DATABASE_PROVIDER')) {
    console.log('Adding DATABASE_PROVIDER to existing .env file...');
    
    // Add DATABASE_PROVIDER at the top
    const updatedEnv = `DATABASE_PROVIDER="sqlite"\n${existingEnv}`;
    fs.writeFileSync(envPath, updatedEnv);
    console.log('✅ Added DATABASE_PROVIDER to .env file');
  }
}

console.log('\n🎉 Local environment setup complete!');
console.log('📋 Next steps:');
console.log('1. Run: npm run db:generate');
console.log('2. Run: npm run db:push');
console.log('3. Run: npm run dev');
console.log('\nFor Vercel deployment, make sure to set:');
console.log('- DATABASE_PROVIDER=postgresql');
console.log('- DATABASE_URL=your-postgresql-connection-string'); 