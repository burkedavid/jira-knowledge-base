const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Database connection string
const DATABASE_URL = 'postgresql://jira-knowledge-base-dev_owner:npg_Okd5mxq2oarw@ep-yellow-silence-ab6lez0s-pooler.eu-west-2.aws.neon.tech/jira-knowledge-base-dev?sslmode=require';

// Output file
const outputFile = path.join(__dirname, '..', 'database-dump.sql');

console.log('🚀 Starting database dump from Neon...');
console.log(`📁 Output file: ${outputFile}`);

// Use pg_dump to create a complete database dump
const dumpCommand = `pg_dump "${DATABASE_URL}" --verbose --clean --no-acl --no-owner --format=plain --file="${outputFile}"`;

console.log('⏳ Running pg_dump command...');

exec(dumpCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error during dump:', error);
    return;
  }

  if (stderr) {
    console.log('📝 pg_dump output:', stderr);
  }

  if (fs.existsSync(outputFile)) {
    const stats = fs.statSync(outputFile);
    console.log('✅ Database dump completed successfully!');
    console.log(`📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📁 Location: ${outputFile}`);
    console.log('\n🔧 To restore to local PostgreSQL:');
    console.log('1. Create a local database: createdb knowledge_base_local');
    console.log(`2. Import the dump: psql -d knowledge_base_local -f "${outputFile}"`);
  } else {
    console.error('❌ Dump file was not created');
  }
}); 