import { prisma } from './prisma';
import type { Prisma } from '@prisma/client';
import { generateEmbedding, cosineSimilarity } from './embeddings';

export type SourceType = 'user_story' | 'defect' | 'document' | 'document_section' | 'test_case'

export interface EmbeddingResult {
  id: string
  content: string
  sourceId: string
  sourceType: SourceType
  similarity: number
  createdAt?: Date
}

export interface DateFilter {
  fromDate?: Date
  toDate?: Date
}

export async function embedContent(
  content: string,
  sourceId: string,
  sourceType: SourceType,
  version: string = '1.0',
  documentDate?: Date,
  forceRegenerate: boolean = false,
  isImportContext: boolean = false
): Promise<{ action: 'created' | 'updated' | 'skipped', reason?: string }> {
  try {
    // Check if embedding already exists
    const existingEmbedding = await prisma.embedding.findFirst({
      where: {
        sourceType,
        sourceId,
      },
    })

    if (existingEmbedding && !forceRegenerate) {
      // Check if content has changed
      const contentHash = Buffer.from(content).toString('base64')
      const existingContentHash = Buffer.from(existingEmbedding.content).toString('base64')
      
      if (contentHash === existingContentHash) {
        // Content hasn't changed, skip regeneration
        return { 
          action: 'skipped', 
          reason: 'Content unchanged since last embedding generation' 
        }
      }
      
      // Content has changed, check if it's recent enough to warrant regeneration
      const timeSinceCreation = Date.now() - existingEmbedding.createdAt.getTime()
      const oneHourInMs = 60 * 60 * 1000
      
      // During import context, be more aggressive about regenerating embeddings
      // Skip the time check if this is an import context and content has changed
      if (timeSinceCreation < oneHourInMs && !forceRegenerate && !isImportContext) {
        return { 
          action: 'skipped', 
          reason: 'Embedding recently created (less than 1 hour ago)' 
        }
      }
    }

    // Generate new embedding (either new item, content changed, or forced)
    const vector = await generateEmbedding(content)

    if (existingEmbedding) {
      // Update existing embedding
      await prisma.embedding.update({
        where: { id: existingEmbedding.id },
        data: {
          content,
          vector: JSON.stringify(vector),
          version,
          documentDate,
          createdAt: new Date(), // Update timestamp to reflect regeneration
        },
      })
      return { 
        action: 'updated', 
        reason: forceRegenerate ? 'Force regeneration requested' : 'Content changed since last embedding' 
      }
    } else {
      // Create new embedding
      await prisma.embedding.create({
        data: {
          content,
          vector: JSON.stringify(vector),
          sourceId,
          sourceType,
          version,
          documentDate,
        },
      })
      return { 
        action: 'created', 
        reason: 'New content, first embedding generation' 
      }
    }
  } catch (error) {
    console.error('Error embedding content:', error)
    throw new Error('Failed to embed content')
  }
}

export async function vectorSearch(
  query: string,
  sourceTypes?: SourceType[],
  limit: number = 10,
  threshold: number = 0.7,
  dateFilter?: DateFilter
): Promise<EmbeddingResult[]> {
  try {
    const queryVector = await generateEmbedding(query);

    const where: Prisma.EmbeddingWhereInput = {};
    if (sourceTypes && sourceTypes.length > 0) {
      where.sourceType = { in: sourceTypes };
    }
    if (dateFilter) {
      where.documentDate = {};
      if (dateFilter.fromDate) {
        where.documentDate.gte = dateFilter.fromDate;
      }
      if (dateFilter.toDate) {
        where.documentDate.lte = dateFilter.toDate;
      }
    }

    const embeddings = await prisma.embedding.findMany({ where });

    // 1. Calculate similarity for all embeddings
    const allResults = embeddings
      .map(embedding => {
        try {
          const vector = JSON.parse(embedding.vector) as number[]
          const similarity = cosineSimilarity(queryVector, vector)
          return {
            id: embedding.id,
            content: embedding.content,
            sourceId: embedding.sourceId,
            sourceType: embedding.sourceType as SourceType,
            similarity,
          }
        } catch (error) {
          console.error('Error parsing vector for embedding:', embedding.id, error)
          return null
        }
      })
      .filter((r): r is EmbeddingResult => r !== null)

    // 2. Sort all results by similarity
    allResults.sort((a, b) => b.similarity - a.similarity)

    // 3. Filter by threshold
    const thresholdResults = allResults.filter(r => r.similarity >= threshold)

    // 4. If threshold results are found, return them (up to the limit)
    if (thresholdResults.length > 0) {
      return thresholdResults.slice(0, limit)
    }

    // 5. Otherwise, return the top N overall results as a fallback
    console.log(`[vectorSearch] No results met threshold ${threshold}. Returning top ${limit} results as fallback.`)
    return allResults.slice(0, limit)

  } catch (error) {
    console.error('Error performing vector search:', error)
    throw new Error('Failed to perform vector search')
  }
}

// Enhanced search function specifically for time-based queries
export async function vectorSearchWithTimeframe(
  query: string,
  timeframe: 'last_week' | 'last_month' | 'last_quarter' | 'last_year' | 'all' = 'all',
  sourceTypes?: SourceType[],
  limit: number = 10,
  threshold: number = 0.7
): Promise<EmbeddingResult[]> {
  let dateFilter: DateFilter | undefined

  if (timeframe !== 'all') {
    const now = new Date()
    let fromDate: Date

    switch (timeframe) {
      case 'last_week':
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'last_month':
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'last_quarter':
        fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case 'last_year':
        fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        fromDate = new Date(0) // Beginning of time
    }

    dateFilter = { fromDate }
  }

  return vectorSearch(query, sourceTypes, limit, threshold, dateFilter)
}

export async function batchEmbedContent(
  items: Array<{
    content: string
    sourceId: string
    sourceType: SourceType
    version?: string
  }>,
  onProgress?: (processed: number, total: number) => void
): Promise<void> {
  const total = items.length
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    await embedContent(item.content, item.sourceId, item.sourceType, item.version)
    
    if (onProgress) {
      onProgress(i + 1, total)
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

export async function deleteEmbeddings(sourceId: string, sourceType?: SourceType): Promise<void> {
  try {
    await prisma.embedding.deleteMany({
      where: {
        sourceId,
        ...(sourceType && { sourceType }),
      },
    })
  } catch (error) {
    console.error('Error deleting embeddings:', error)
    throw new Error('Failed to delete embeddings')
  }
}

export async function getEmbeddingStats(): Promise<{
  total: number
  bySourceType: Record<string, number>
}> {
  try {
    const total = await prisma.embedding.count()
    
    const bySourceType = await prisma.embedding.groupBy({
      by: ['sourceType'],
      _count: {
        id: true,
      },
    })

    const sourceTypeStats = bySourceType.reduce((acc: Record<string, number>, item: any) => {
      acc[item.sourceType] = item._count.id
      return acc
    }, {} as Record<string, number>)

    return {
      total,
      bySourceType: sourceTypeStats,
    }
  } catch (error) {
    console.error('Error getting embedding stats:', error)
    throw new Error('Failed to get embedding stats')
  }
} 