const { PrismaClient } = require('@prisma/client');

async function setupNeonDatabase() {
  console.log('🚀 Setting up Neon database for AI audit...');
  
  // Check if we have the DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable not found');
    console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('DATABASE')));
    process.exit(1);
  }
  
  console.log('✅ DATABASE_URL found:', process.env.DATABASE_URL.substring(0, 30) + '...');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
  
  try {
    console.log('🔍 Checking database connection...');
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // Check if AI audit tables exist
    console.log('🔍 Checking for AI audit tables...');
    
    try {
      const auditCount = await prisma.aIAuditLog.count();
      console.log(`✅ AIAuditLog table exists with ${auditCount} records`);
    } catch (error) {
      console.log('❌ AIAuditLog table does not exist:', error.message);
    }
    
    try {
      const settingsCount = await prisma.aISettings.count();
      console.log(`✅ AISettings table exists with ${settingsCount} records`);
    } catch (error) {
      console.log('❌ AISettings table does not exist:', error.message);
    }
    
    // Try to create a test AI audit entry
    console.log('🧪 Testing AI audit logging...');
    try {
      const testLog = await prisma.aIAuditLog.create({
        data: {
          promptType: 'test-setup',
          promptName: 'Database Setup Test',
          endpoint: '/api/setup-test',
          model: 'Claude Sonnet 4',
          inputTokens: 100,
          outputTokens: 200,
          totalTokens: 300,
          costUSD: 0.001,
          costGBP: 0.0008,
          success: true
        }
      });
      console.log('✅ Test AI audit log created:', testLog.id);
      
      // Clean up test log
      await prisma.aIAuditLog.delete({
        where: { id: testLog.id }
      });
      console.log('✅ Test log cleaned up');
      
    } catch (error) {
      console.error('❌ Failed to create test AI audit log:', error.message);
      console.error('Error details:', error);
    }
    
    // Check for default AI settings
    console.log('🔍 Checking AI settings...');
    try {
      let settings = await prisma.aISettings.findFirst();
      if (!settings) {
        console.log('📝 Creating default AI settings...');
        settings = await prisma.aISettings.create({
          data: {
            inputTokenCostUSD: 0.000003,
            outputTokenCostUSD: 0.000015,
            exchangeRateUSDToGBP: 0.74,
            model: 'Claude Sonnet 4',
            trackingEnabled: true,
            retentionDays: 90
          }
        });
        console.log('✅ Default AI settings created:', settings.id);
      } else {
        console.log('✅ AI settings already exist:', settings.id);
      }
    } catch (error) {
      console.error('❌ Failed to check/create AI settings:', error.message);
    }
    
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup if this script is called directly
if (require.main === module) {
  setupNeonDatabase().catch(console.error);
}

module.exports = { setupNeonDatabase };