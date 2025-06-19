const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const client = new Client({
  connectionString: 'postgresql://jira-knowledge-base-dev_owner:npg_Okd5mxq2oarw@ep-yellow-silence-ab6lez0s-pooler.eu-west-2.aws.neon.tech/jira-knowledge-base-dev?sslmode=require'
});

const outputFile = path.join(__dirname, '..', 'database-dump.sql');

async function dumpDatabase() {
  try {
    console.log('🚀 Connecting to Neon PostgreSQL database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    let sqlDump = '';
    
    // Add header
    sqlDump += `-- Database dump from Neon PostgreSQL\n`;
    sqlDump += `-- Generated on: ${new Date().toISOString()}\n`;
    sqlDump += `-- Source: jira-knowledge-base-dev\n\n`;

    // Get all tables
    console.log('📋 Getting table list...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const tables = tablesResult.rows.map(row => row.table_name);
    console.log(`📊 Found ${tables.length} tables:`, tables);

    // Get schema for each table
    for (const tableName of tables) {
      console.log(`🔧 Processing table: ${tableName}`);
      
      // Get table schema
      const schemaResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [tableName]);

      // Create table statement
      sqlDump += `-- Table: ${tableName}\n`;
      sqlDump += `DROP TABLE IF EXISTS "${tableName}" CASCADE;\n`;
      sqlDump += `CREATE TABLE "${tableName}" (\n`;
      
      const columns = schemaResult.rows.map(col => {
        let colDef = `  "${col.column_name}" ${col.data_type}`;
        if (col.is_nullable === 'NO') {
          colDef += ' NOT NULL';
        }
        if (col.column_default) {
          colDef += ` DEFAULT ${col.column_default}`;
        }
        return colDef;
      });
      
      sqlDump += columns.join(',\n');
      sqlDump += '\n);\n\n';

      // Get data count
      const countResult = await client.query(`SELECT COUNT(*) FROM "${tableName}"`);
      const rowCount = parseInt(countResult.rows[0].count);
      
      if (rowCount > 0) {
        console.log(`📦 Dumping ${rowCount} rows from ${tableName}...`);
        
        // Get all data
        const dataResult = await client.query(`SELECT * FROM "${tableName}"`);
        
        if (dataResult.rows.length > 0) {
          const columnNames = Object.keys(dataResult.rows[0]);
          sqlDump += `-- Data for table: ${tableName}\n`;
          
          // Insert statements
          for (const row of dataResult.rows) {
            const values = columnNames.map(col => {
              const val = row[col];
              if (val === null) return 'NULL';
              if (typeof val === 'string') {
                return `'${val.replace(/'/g, "''")}'`;
              }
              if (val instanceof Date) {
                return `'${val.toISOString()}'`;
              }
              if (typeof val === 'object') {
                return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
              }
              return val;
            });
            
            sqlDump += `INSERT INTO "${tableName}" ("${columnNames.join('", "')}") VALUES (${values.join(', ')});\n`;
          }
          sqlDump += '\n';
        }
      } else {
        console.log(`⚠️  Table ${tableName} is empty`);
      }
    }

    // Get sequences
    console.log('🔢 Getting sequences...');
    const sequencesResult = await client.query(`
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_schema = 'public'
    `);

    for (const seq of sequencesResult.rows) {
      const seqResult = await client.query(`SELECT last_value FROM "${seq.sequence_name}"`);
      sqlDump += `-- Sequence: ${seq.sequence_name}\n`;
      sqlDump += `SELECT setval('${seq.sequence_name}', ${seqResult.rows[0].last_value}, true);\n\n`;
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
    await client.end();
  }
}

dumpDatabase(); 