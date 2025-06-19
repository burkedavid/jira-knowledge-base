const { PrismaClient } = require('@prisma/client');

async function findStory() {
  const prisma = new PrismaClient();
  
  try {
    // Count total stories
    const total = await prisma.userStory.count();
    console.log(`📊 Total stories: ${total}`);
    
    // Find FL-14773 story
    const flStory = await prisma.userStory.findFirst({
      where: { jiraKey: { contains: 'FL-14773' } },
      select: { 
        id: true, 
        jiraKey: true, 
        title: true, 
        createdAt: true,
        qualityScore: true
      }
    });
    
    if (!flStory) {
      console.log('❌ FL-14773 story not found');
      return;
    }
    
    console.log(`\n🎯 Found FL-14773:`);
    console.log(`  - ID: ${flStory.id}`);
    console.log(`  - Key: ${flStory.jiraKey}`);
    console.log(`  - Quality Score: ${flStory.qualityScore}`);
    console.log(`  - Created: ${flStory.createdAt}`);
    
    // Find position in default order (createdAt desc)
    const storiesBeforeCount = await prisma.userStory.count({
      where: {
        createdAt: { gt: flStory.createdAt }
      }
    });
    
    console.log(`\n📍 Position in default order: ${storiesBeforeCount + 1}`);
    
    // Test API call with limit 100
    const first100 = await prisma.userStory.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { jiraKey: true, qualityScore: true }
    });
    
    const flInFirst100 = first100.find(s => s.jiraKey?.includes('FL-14773'));
    console.log(`\n🔍 FL-14773 in first 100 stories: ${flInFirst100 ? '✅ YES' : '❌ NO'}`);
    
    if (flInFirst100) {
      console.log(`  - Quality Score in API result: ${flInFirst100.qualityScore}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

findStory().catch(console.error); 