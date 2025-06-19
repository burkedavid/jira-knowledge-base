const { PrismaClient } = require('@prisma/client');

async function exploreDataForQuestions() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Exploring database for diverse question creation...\n');
    
    // Get diverse documents
    console.log('📄 DOCUMENTS SAMPLE:');
    const documents = await prisma.document.findMany({
      take: 10,
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    documents.forEach((doc, i) => {
      console.log(`  ${i+1}. ${doc.title}`);
      console.log(`     Type: ${doc.type} | Created: ${doc.createdAt.toISOString().split('T')[0]}`);
      console.log(`     Content: ${doc.content.substring(0, 100)}...`);
      console.log('');
    });
    
    // Get diverse user stories with different components
    console.log('📖 USER STORIES SAMPLE (by component):');
    const userStories = await prisma.userStory.findMany({
      take: 15,
      select: {
        id: true,
        title: true,
        description: true,
        component: true,
        priority: true,
        jiraKey: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Group by component
    const storyGroups = {};
    userStories.forEach(story => {
      const comp = story.component || 'Other';
      if (!storyGroups[comp]) storyGroups[comp] = [];
      storyGroups[comp].push(story);
    });
    
    Object.keys(storyGroups).forEach(component => {
      console.log(`  📂 Component: ${component}`);
      storyGroups[component].slice(0, 3).forEach(story => {
        console.log(`    • ${story.jiraKey}: ${story.title}`);
        console.log(`      Priority: ${story.priority} | Created: ${story.createdAt.toISOString().split('T')[0]}`);
        console.log(`      Description: ${story.description.substring(0, 120)}...`);
      });
      console.log('');
    });
    
    // Get diverse defects with different severities
    console.log('🐛 DEFECTS SAMPLE (by severity):');
    const defects = await prisma.defect.findMany({
      take: 15,
      select: {
        id: true,
        title: true,
        description: true,
        component: true,
        severity: true,
        jiraKey: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Group by severity
    const defectGroups = {};
    defects.forEach(defect => {
      const sev = defect.severity || 'Unknown';
      if (!defectGroups[sev]) defectGroups[sev] = [];
      defectGroups[sev].push(defect);
    });
    
    Object.keys(defectGroups).forEach(severity => {
      console.log(`  🔴 Severity: ${severity}`);
      defectGroups[severity].slice(0, 3).forEach(defect => {
        console.log(`    • ${defect.jiraKey}: ${defect.title}`);
        console.log(`      Component: ${defect.component} | Created: ${defect.createdAt.toISOString().split('T')[0]}`);
        console.log(`      Description: ${defect.description.substring(0, 120)}...`);
      });
      console.log('');
    });
    
    // Get date ranges for time-based questions
    console.log('📅 DATE RANGES:');
    const dateRanges = await prisma.$queryRaw`
      SELECT 
        'user_stories' as type,
        MIN("createdAt") as earliest,
        MAX("createdAt") as latest,
        COUNT(*) as count
      FROM "UserStory"
      UNION ALL
      SELECT 
        'defects' as type,
        MIN("createdAt") as earliest,
        MAX("createdAt") as latest,
        COUNT(*) as count
      FROM "Defect"
      UNION ALL
      SELECT 
        'documents' as type,
        MIN("createdAt") as earliest,
        MAX("createdAt") as latest,
        COUNT(*) as count
      FROM "Document"
    `;
    
    dateRanges.forEach(range => {
      console.log(`  ${range.type}: ${range.count} items`);
      console.log(`    From: ${range.earliest.toISOString().split('T')[0]} to ${range.latest.toISOString().split('T')[0]}`);
    });
    
    // Get unique components and keywords
    console.log('\n🏷️  COMPONENTS & KEYWORDS:');
    const components = await prisma.$queryRaw`
      SELECT DISTINCT component, COUNT(*) as count
      FROM (
        SELECT component FROM "UserStory" WHERE component IS NOT NULL
        UNION ALL
        SELECT component FROM "Defect" WHERE component IS NOT NULL
      ) as all_components
      GROUP BY component
      ORDER BY count DESC
      LIMIT 10
    `;
    
    console.log('  Top Components:');
    components.forEach(comp => {
      console.log(`    • ${comp.component} (${comp.count} items)`);
    });
    
    return { documents, userStories, defects, dateRanges, components };
    
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

exploreDataForQuestions(); 