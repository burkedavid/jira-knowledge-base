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

async function dumpDatabase() {
  try {
    console.log('🚀 Connecting to Neon PostgreSQL database via Prisma...');
    
    let sqlDump = '';
    
    // Add header
    sqlDump += `-- Database dump from Neon PostgreSQL\n`;
    sqlDump += `-- Generated on: ${new Date().toISOString()}\n`;
    sqlDump += `-- Source: jira-knowledge-base-dev\n\n`;

    // Get all data from each table
    console.log('📋 Dumping data from all tables...');

    // User Stories
    console.log('📦 Dumping UserStory table...');
    const userStories = await prisma.userStory.findMany();
    console.log(`   Found ${userStories.length} user stories`);
    
    if (userStories.length > 0) {
      sqlDump += `-- Table: UserStory\n`;
      sqlDump += `TRUNCATE TABLE "UserStory" CASCADE;\n`;
      
      for (const story of userStories) {
        const values = [
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
        ];
        
        sqlDump += `INSERT INTO "UserStory" ("id", "jiraKey", "title", "description", "acceptanceCriteria", "priority", "status", "assignee", "reporter", "labels", "components", "fixVersions", "createdAt", "updatedAt", "embedding") VALUES (${values.join(', ')});\n`;
      }
      sqlDump += '\n';
    }

    // Defects
    console.log('📦 Dumping Defect table...');
    const defects = await prisma.defect.findMany();
    console.log(`   Found ${defects.length} defects`);
    
    if (defects.length > 0) {
      sqlDump += `-- Table: Defect\n`;
      sqlDump += `TRUNCATE TABLE "Defect" CASCADE;\n`;
      
      for (const defect of defects) {
        const values = [
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
        ];
        
        sqlDump += `INSERT INTO "Defect" ("id", "jiraKey", "title", "description", "severity", "priority", "status", "assignee", "reporter", "labels", "components", "fixVersions", "createdAt", "updatedAt", "embedding") VALUES (${values.join(', ')});\n`;
      }
      sqlDump += '\n';
    }

    // Documents
    console.log('📦 Dumping Document table...');
    const documents = await prisma.document.findMany();
    console.log(`   Found ${documents.length} documents`);
    
    if (documents.length > 0) {
      sqlDump += `-- Table: Document\n`;
      sqlDump += `TRUNCATE TABLE "Document" CASCADE;\n`;
      
      for (const doc of documents) {
        const values = [
          doc.id ? `'${doc.id}'` : 'NULL',
          doc.title ? `'${doc.title.replace(/'/g, "''")}'` : 'NULL',
          doc.content ? `'${doc.content.replace(/'/g, "''")}'` : 'NULL',
          doc.type ? `'${doc.type}'` : 'NULL',
          doc.source ? `'${doc.source.replace(/'/g, "''")}'` : 'NULL',
          doc.metadata ? `'${JSON.stringify(doc.metadata).replace(/'/g, "''")}'` : 'NULL',
          doc.createdAt ? `'${doc.createdAt.toISOString()}'` : 'NULL',
          doc.updatedAt ? `'${doc.updatedAt.toISOString()}'` : 'NULL',
          doc.embedding ? `'${JSON.stringify(doc.embedding).replace(/'/g, "''")}'` : 'NULL'
        ];
        
        sqlDump += `INSERT INTO "Document" ("id", "title", "content", "type", "source", "metadata", "createdAt", "updatedAt", "embedding") VALUES (${values.join(', ')});\n`;
      }
      sqlDump += '\n';
    }

    // Test Cases
    console.log('📦 Dumping TestCase table...');
    try {
      const testCases = await prisma.testCase.findMany();
      console.log(`   Found ${testCases.length} test cases`);
      
      if (testCases.length > 0) {
        sqlDump += `-- Table: TestCase\n`;
        sqlDump += `TRUNCATE TABLE "TestCase" CASCADE;\n`;
        
        for (const testCase of testCases) {
          const values = [
            testCase.id ? `'${testCase.id}'` : 'NULL',
            testCase.title ? `'${testCase.title.replace(/'/g, "''")}'` : 'NULL',
            testCase.description ? `'${testCase.description.replace(/'/g, "''")}'` : 'NULL',
            testCase.steps ? `'${JSON.stringify(testCase.steps).replace(/'/g, "''")}'` : 'NULL',
            testCase.expectedResult ? `'${testCase.expectedResult.replace(/'/g, "''")}'` : 'NULL',
            testCase.priority ? `'${testCase.priority}'` : 'NULL',
            testCase.status ? `'${testCase.status}'` : 'NULL',
            testCase.userStoryId ? `'${testCase.userStoryId}'` : 'NULL',
            testCase.createdAt ? `'${testCase.createdAt.toISOString()}'` : 'NULL',
            testCase.updatedAt ? `'${testCase.updatedAt.toISOString()}'` : 'NULL',
            testCase.embedding ? `'${JSON.stringify(testCase.embedding).replace(/'/g, "''")}'` : 'NULL'
          ];
          
          sqlDump += `INSERT INTO "TestCase" ("id", "title", "description", "steps", "expectedResult", "priority", "status", "userStoryId", "createdAt", "updatedAt", "embedding") VALUES (${values.join(', ')});\n`;
        }
        sqlDump += '\n';
      }
    } catch (error) {
      console.log('   TestCase table not found or accessible, skipping...');
    }

    // Users
    console.log('📦 Dumping User table...');
    try {
      const users = await prisma.user.findMany();
      console.log(`   Found ${users.length} users`);
      
      if (users.length > 0) {
        sqlDump += `-- Table: User\n`;
        sqlDump += `TRUNCATE TABLE "User" CASCADE;\n`;
        
        for (const user of users) {
          const values = [
            user.id ? `'${user.id}'` : 'NULL',
            user.email ? `'${user.email.replace(/'/g, "''")}'` : 'NULL',
            user.name ? `'${user.name.replace(/'/g, "''")}'` : 'NULL',
            user.role ? `'${user.role}'` : 'NULL',
            user.passwordHash ? `'${user.passwordHash.replace(/'/g, "''")}'` : 'NULL',
            user.createdAt ? `'${user.createdAt.toISOString()}'` : 'NULL',
            user.updatedAt ? `'${user.updatedAt.toISOString()}'` : 'NULL'
          ];
          
          sqlDump += `INSERT INTO "User" ("id", "email", "name", "role", "passwordHash", "createdAt", "updatedAt") VALUES (${values.join(', ')});\n`;
        }
        sqlDump += '\n';
      }
    } catch (error) {
      console.log('   User table not found or accessible, skipping...');
    }

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
  } finally {
    await prisma.$disconnect();
  }
}

dumpDatabase(); 