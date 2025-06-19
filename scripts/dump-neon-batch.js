const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Initialize Prisma client with Neon connection
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://jira-knowledge-base-dev_owner:npg_Okd5mxq2oarw@ep-yellow-silence-ab6lez0s-pooler.eu-west-2.aws.neon.tech/jira-knowledge-base-dev?sslmode=require'
    }
  }
});

const outputFile = path.join(__dirname, '..', 'database-dump.sql');
const BATCH_SIZE = 50; // Small batch size to stay within limits

async function dumpDatabase() {
  try {
    console.log('🚀 Connecting to Neon PostgreSQL database via Prisma...');
    console.log('⚠️  Using small batch sizes to work within data transfer limits...');
    
    let sqlDump = '';
    
    // Add header
    sqlDump += `-- Database dump from Neon PostgreSQL\n`;
    sqlDump += `-- Generated on: ${new Date().toISOString()}\n`;
    sqlDump += `-- Source: jira-knowledge-base-dev\n\n`;

    // Function to process data in batches
    async function processBatch(tableName, findManyFn, formatRowFn, columns) {
      console.log(`📦 Dumping ${tableName} table in batches...`);
      
      // Get total count first
      const totalCount = await prisma[tableName.toLowerCase()].count();
      console.log(`   Total ${tableName}: ${totalCount}`);
      
      if (totalCount === 0) return;
      
      sqlDump += `-- Table: ${tableName}\n`;
      sqlDump += `TRUNCATE TABLE "${tableName}" CASCADE;\n`;
      
      let processed = 0;
      
      while (processed < totalCount) {
        console.log(`   Processing batch ${Math.floor(processed / BATCH_SIZE) + 1} (${processed + 1}-${Math.min(processed + BATCH_SIZE, totalCount)} of ${totalCount})`);
        
        const batch = await findManyFn({
          skip: processed,
          take: BATCH_SIZE
        });
        
        for (const row of batch) {
          const values = formatRowFn(row);
          sqlDump += `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});\n`;
        }
        
        processed += batch.length;
        
        // Small delay to be gentle on the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      sqlDump += '\n';
    }

    // User Stories
    await processBatch(
      'UserStory',
      (options) => prisma.userStory.findMany(options),
      (story) => [
        story.id ? `'${story.id}'` : 'NULL',
        story.jiraKey ? `'${story.jiraKey.replace(/'/g, "''")}'` : 'NULL',
        story.title ? `'${story.title.replace(/'/g, "''")}'` : 'NULL',
        story.description ? `'${story.description.replace(/'/g, "''")}'` : 'NULL',
        story.acceptanceCriteria ? `'${story.acceptanceCriteria.replace(/'/g, "''")}'` : 'NULL',
        story.priority ? `'${story.priority}'` : 'NULL',
        story.status ? `'${story.status.replace(/'/g, "''")}'` : 'NULL',
        story.assignee ? `'${story.assignee.replace(/'/g, "''")}'` : 'NULL',
        story.reporter ? `'${story.reporter.replace(/'/g, "''")}'` : 'NULL',
        story.labels ? `'${JSON.stringify(story.labels).replace(/'/g, "''")}'` : 'NULL',
        story.components ? `'${JSON.stringify(story.components).replace(/'/g, "''")}'` : 'NULL',
        story.fixVersions ? `'${JSON.stringify(story.fixVersions).replace(/'/g, "''")}'` : 'NULL',
        story.createdAt ? `'${story.createdAt.toISOString()}'` : 'NULL',
        story.updatedAt ? `'${story.updatedAt.toISOString()}'` : 'NULL',
        story.embedding ? `'${JSON.stringify(story.embedding).replace(/'/g, "''")}'` : 'NULL'
      ],
      ['id', 'jiraKey', 'title', 'description', 'acceptanceCriteria', 'priority', 'status', 'assignee', 'reporter', 'labels', 'components', 'fixVersions', 'createdAt', 'updatedAt', 'embedding']
    );

    // Defects
    await processBatch(
      'Defect',
      (options) => prisma.defect.findMany(options),
      (defect) => [
        defect.id ? `'${defect.id}'` : 'NULL',
        defect.jiraKey ? `'${defect.jiraKey.replace(/'/g, "''")}'` : 'NULL',
        defect.title ? `'${defect.title.replace(/'/g, "''")}'` : 'NULL',
        defect.description ? `'${defect.description.replace(/'/g, "''")}'` : 'NULL',
        defect.severity ? `'${defect.severity}'` : 'NULL',
        defect.priority ? `'${defect.priority}'` : 'NULL',
        defect.status ? `'${defect.status.replace(/'/g, "''")}'` : 'NULL',
        defect.assignee ? `'${defect.assignee.replace(/'/g, "''")}'` : 'NULL',
        defect.reporter ? `'${defect.reporter.replace(/'/g, "''")}'` : 'NULL',
        defect.labels ? `'${JSON.stringify(defect.labels).replace(/'/g, "''")}'` : 'NULL',
        defect.components ? `'${JSON.stringify(defect.components).replace(/'/g, "''")}'` : 'NULL',
        defect.fixVersions ? `'${JSON.stringify(defect.fixVersions).replace(/'/g, "''")}'` : 'NULL',
        defect.createdAt ? `'${defect.createdAt.toISOString()}'` : 'NULL',
        defect.updatedAt ? `'${defect.updatedAt.toISOString()}'` : 'NULL',
        defect.embedding ? `'${JSON.stringify(defect.embedding).replace(/'/g, "''")}'` : 'NULL'
      ],
      ['id', 'jiraKey', 'title', 'description', 'severity', 'priority', 'status', 'assignee', 'reporter', 'labels', 'components', 'fixVersions', 'createdAt', 'updatedAt', 'embedding']
    );

    // Documents
    await processBatch(
      'Document',
      (options) => prisma.document.findMany(options),
      (doc) => [
        doc.id ? `'${doc.id}'` : 'NULL',
        doc.title ? `'${doc.title.replace(/'/g, "''")}'` : 'NULL',
        doc.content ? `'${doc.content.replace(/'/g, "''")}'` : 'NULL',
        doc.type ? `'${doc.type}'` : 'NULL',
        doc.source ? `'${doc.source.replace(/'/g, "''")}'` : 'NULL',
        doc.metadata ? `'${JSON.stringify(doc.metadata).replace(/'/g, "''")}'` : 'NULL',
        doc.createdAt ? `'${doc.createdAt.toISOString()}'` : 'NULL',
        doc.updatedAt ? `'${doc.updatedAt.toISOString()}'` : 'NULL',
        doc.embedding ? `'${JSON.stringify(doc.embedding).replace(/'/g, "''")}'` : 'NULL'
      ],
      ['id', 'title', 'content', 'type', 'source', 'metadata', 'createdAt', 'updatedAt', 'embedding']
    );

    // Write to file
    console.log('💾 Writing dump to file...');
    fs.writeFileSync(outputFile, sqlDump);
    
    const stats = fs.statSync(outputFile);
    console.log('✅ Database dump completed successfully!');
    console.log(`📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📁 Location: ${outputFile}`);
    console.log('\n🔧 To restore to local PostgreSQL:');
    console.log('1. Create a local database: createdb knowledge_base_local');
    console.log(`2. Import the dump: psql -d knowledge_base_local -f "${outputFile}"`);
    console.log('   OR use: cat database-dump.sql | psql -d knowledge_base_local');

  } catch (error) {
    console.error('❌ Error:', error);
    
    if (error.message.includes('data transfer quota')) {
      console.log('\n💡 Alternative approaches:');
      console.log('1. Wait for your Neon quota to reset (usually monthly)');
      console.log('2. Upgrade your Neon plan for higher limits');
      console.log('3. Use the Neon CLI or pg_dump directly with connection limits');
      console.log('4. Export data through your application interface');
    }
  } finally {
    await prisma.$disconnect();
  }
}

dumpDatabase(); 