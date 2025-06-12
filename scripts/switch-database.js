const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

function switchToSQLite() {
  console.log('🔄 Switching to SQLite configuration...');
  
  let schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Replace PostgreSQL with SQLite
  schema = schema.replace(
    /provider = "postgresql"/g,
    'provider = "sqlite"'
  );
  
  fs.writeFileSync(schemaPath, schema);
  console.log('✅ Switched to SQLite');
}

function switchToPostgreSQL() {
  console.log('🔄 Switching to PostgreSQL configuration...');
  
  let schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Replace SQLite with PostgreSQL
  schema = schema.replace(
    /provider = "sqlite"/g,
    'provider = "postgresql"'
  );
  
  fs.writeFileSync(schemaPath, schema);
  console.log('✅ Switched to PostgreSQL');
}

// Get command line argument
const target = process.argv[2];

if (target === 'sqlite') {
  switchToSQLite();
} else if (target === 'postgresql') {
  switchToPostgreSQL();
} else {
  console.log('Usage: node scripts/switch-database.js [sqlite|postgresql]');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/switch-database.js sqlite     # Switch to SQLite for local development');
  console.log('  node scripts/switch-database.js postgresql # Switch to PostgreSQL for production');
  process.exit(1);
} 