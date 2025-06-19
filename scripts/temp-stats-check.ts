import { getEmbeddingStats } from '../src/lib/vector-db';

async function main() {
  try {
    console.log('Fetching embedding statistics...');
    const stats = await getEmbeddingStats();
    console.log(JSON.stringify(stats, null, 2));
  } catch (error) {
    console.error('Failed to get embedding stats:', error);
  }
}

main();
