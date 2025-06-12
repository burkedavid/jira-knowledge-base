import { prisma } from './prisma'
import { embedContent, deleteEmbeddings } from './vector-db'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import crypto from 'crypto'

export interface DocumentProcessingResult {
  documentId: string
  sectionsProcessed: number
  errors: string[]
  changesSummary?: DocumentChangesSummary
}

export interface DocumentChangesSummary {
  sectionsAdded: number
  sectionsModified: number
  sectionsDeleted: number
  impactedItems: string[]
}

export interface DocumentSection {
  title: string
  content: string
  order: number
  hash: string
}

export class DocumentProcessor {
  async processDocument(
    file: Buffer,
    fileName: string,
    title: string,
    version?: string
  ): Promise<DocumentProcessingResult> {
    try {
      const fileType = this.getFileType(fileName)
      const content = await this.extractContent(file, fileType)
      const sections = this.extractSections(content)

      // Check if document already exists
      const existingDoc = await prisma.document.findFirst({
        where: { title },
        include: { sections: true },
      })

      let documentId: string
      let changesSummary: DocumentChangesSummary | undefined

      if (existingDoc) {
        // Update existing document
        const result = await this.updateDocument(existingDoc, content, sections, version)
        documentId = result.documentId
        changesSummary = result.changesSummary
      } else {
        // Create new document
        documentId = await this.createDocument(title, content, fileName, file.length, sections, version)
      }

      return {
        documentId,
        sectionsProcessed: sections.length,
        errors: [],
        changesSummary,
      }
    } catch (error) {
      console.error('Error processing document:', error)
      throw new Error(`Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private getFileType(fileName: string): 'pdf' | 'docx' | 'txt' {
    const extension = fileName.toLowerCase().split('.').pop()
    switch (extension) {
      case 'pdf':
        return 'pdf'
      case 'docx':
        return 'docx'
      case 'txt':
        return 'txt'
      default:
        throw new Error(`Unsupported file type: ${extension}`)
    }
  }

  private async extractContent(file: Buffer, fileType: string): Promise<string> {
    switch (fileType) {
      case 'pdf':
        const pdfData = await pdfParse(file)
        return pdfData.text
      case 'docx':
        const docxData = await mammoth.extractRawText({ buffer: file })
        return docxData.value
      case 'txt':
        return file.toString('utf-8')
      default:
        throw new Error(`Unsupported file type: ${fileType}`)
    }
  }

  private extractSections(content: string): DocumentSection[] {
    const sections: DocumentSection[] = []
    
    // Split content by headers (lines that start with #, numbers, or are in ALL CAPS)
    const lines = content.split('\n')
    let currentSection: { title: string; content: string[] } | null = null
    let order = 0

    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // Check if this line is a header
      if (this.isHeader(trimmedLine)) {
        // Save previous section if exists
        if (currentSection) {
          const sectionContent = currentSection.content.join('\n').trim()
          if (sectionContent) {
            sections.push({
              title: currentSection.title,
              content: sectionContent,
              order: order++,
              hash: this.generateContentHash(sectionContent),
            })
          }
        }
        
        // Start new section
        currentSection = {
          title: trimmedLine,
          content: [],
        }
      } else if (currentSection) {
        // Add line to current section
        currentSection.content.push(line)
      } else if (trimmedLine) {
        // Content before first header - create a default section
        currentSection = {
          title: 'Introduction',
          content: [line],
        }
      }
    }

    // Don't forget the last section
    if (currentSection) {
      const sectionContent = currentSection.content.join('\n').trim()
      if (sectionContent) {
        sections.push({
          title: currentSection.title,
          content: sectionContent,
          order: order++,
          hash: this.generateContentHash(sectionContent),
        })
      }
    }

    return sections
  }

  private isHeader(line: string): boolean {
    if (!line) return false
    
    // Check for markdown headers
    if (line.startsWith('#')) return true
    
    // Check for numbered headers (1., 1.1, etc.)
    if (/^\d+(\.\d+)*\.?\s/.test(line)) return true
    
    // Check for ALL CAPS headers (at least 3 characters, mostly uppercase)
    if (line.length >= 3 && line === line.toUpperCase() && /^[A-Z\s\d\-_]+$/.test(line)) return true
    
    // Check for underlined headers (next line is all dashes or equals)
    // This would require looking ahead, so we'll skip for now
    
    return false
  }

  private generateContentHash(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex')
  }

  private async createDocument(
    title: string,
    content: string,
    fileName: string,
    fileSize: number,
    sections: DocumentSection[],
    version?: string
  ): Promise<string> {
    const document = await prisma.document.create({
      data: {
        title,
        content,
        type: this.getFileType(fileName),
        version: version || '1.0',
        fileName,
        fileSize,
      },
    })

    // Create sections
    for (const section of sections) {
      const dbSection = await prisma.documentSection.create({
        data: {
          documentId: document.id,
          title: section.title,
          content: section.content,
          order: section.order,
          previousHash: section.hash,
        },
      })

      // Generate embeddings for each section
      await embedContent(section.content, dbSection.id, 'document_section')
    }

    // Generate embeddings for the full document
    await embedContent(content, document.id, 'document')

    return document.id
  }

  private async updateDocument(
    existingDoc: any,
    newContent: string,
    newSections: DocumentSection[],
    version?: string
  ): Promise<{ documentId: string; changesSummary: DocumentChangesSummary }> {
    const changesSummary: DocumentChangesSummary = {
      sectionsAdded: 0,
      sectionsModified: 0,
      sectionsDeleted: 0,
      impactedItems: [],
    }

    // Update document metadata
    await prisma.document.update({
      where: { id: existingDoc.id },
      data: {
        content: newContent,
        version: version || this.incrementVersion(existingDoc.version),
        updatedAt: new Date(),
      },
    })

    // Create a map of existing sections by title for comparison
    const existingSectionsMap = new Map(
      existingDoc.sections.map((section: any) => [section.title, section])
    )

    // Track which existing sections we've processed
    const processedSectionIds = new Set<string>()

    // Process new sections
    for (const newSection of newSections) {
      const existingSection = existingSectionsMap.get(newSection.title)

      if (existingSection) {
        // Section exists - check if content changed
        if ((existingSection as any).previousHash !== newSection.hash) {
          // Content changed - update section
          await prisma.documentSection.update({
            where: { id: (existingSection as any).id },
            data: {
              content: newSection.content,
              order: newSection.order,
              previousHash: newSection.hash,
              changeType: 'modified',
              lastUpdated: new Date(),
            },
          })

          // Re-generate embeddings
          await deleteEmbeddings((existingSection as any).id, 'document_section')
          await embedContent(newSection.content, (existingSection as any).id, 'document_section')

          changesSummary.sectionsModified++
          changesSummary.impactedItems.push(`Section: ${newSection.title}`)
        } else {
          // Content unchanged - just update order if needed
          if ((existingSection as any).order !== newSection.order) {
            await prisma.documentSection.update({
              where: { id: (existingSection as any).id },
              data: { order: newSection.order },
            })
          }
        }

        processedSectionIds.add((existingSection as any).id)
      } else {
        // New section - create it
        const dbSection = await prisma.documentSection.create({
          data: {
            documentId: existingDoc.id,
            title: newSection.title,
            content: newSection.content,
            order: newSection.order,
            previousHash: newSection.hash,
            changeType: 'added',
          },
        })

        // Generate embeddings
        await embedContent(newSection.content, dbSection.id, 'document_section')

        changesSummary.sectionsAdded++
        changesSummary.impactedItems.push(`New Section: ${newSection.title}`)
      }
    }

    // Mark deleted sections
    for (const existingSection of existingDoc.sections) {
      if (!processedSectionIds.has(existingSection.id)) {
                  await prisma.documentSection.update({
            where: { id: (existingSection as any).id },
          data: {
            changeType: 'deleted',
            lastUpdated: new Date(),
          },
        })

        // Remove embeddings
        await deleteEmbeddings(existingSection.id, 'document_section')

        changesSummary.sectionsDeleted++
        changesSummary.impactedItems.push(`Deleted Section: ${existingSection.title}`)
      }
    }

    // Re-generate embeddings for the full document
    await deleteEmbeddings(existingDoc.id, 'document')
    await embedContent(newContent, existingDoc.id, 'document')

    return {
      documentId: existingDoc.id,
      changesSummary,
    }
  }

  private incrementVersion(currentVersion: string): string {
    const parts = currentVersion.split('.')
    const major = parseInt(parts[0] || '1')
    const minor = parseInt(parts[1] || '0')
    
    return `${major}.${minor + 1}`
  }

  async analyzeDocumentChanges(documentId: string): Promise<{
    recentChanges: any[]
    impactAnalysis: any[]
  }> {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        sections: {
          where: {
            changeType: {
              in: ['added', 'modified', 'deleted'],
            },
          },
          orderBy: { lastUpdated: 'desc' },
        },
      },
    })

    if (!document) {
      throw new Error('Document not found')
    }

    const recentChanges = document.sections.map(section => ({
      id: section.id,
      title: section.title,
      changeType: section.changeType,
      lastUpdated: section.lastUpdated,
    }))

    // Analyze impact on related test cases and user stories
    const impactAnalysis = await this.analyzeChangeImpact(documentId, recentChanges)

    return {
      recentChanges,
      impactAnalysis,
    }
  }

  private async analyzeChangeImpact(documentId: string, changes: any[]): Promise<any[]> {
    const impacts = []

    for (const change of changes) {
      // Find related test cases and user stories through embeddings
      const relatedItems = await prisma.embedding.findMany({
        where: {
          sourceType: {
            in: ['test_case', 'user_story'],
          },
        },
        take: 100, // Limit for performance
      })

      // This is a simplified impact analysis
      // In a real implementation, you'd use vector similarity to find truly related items
      const potentialImpacts = relatedItems.filter(item => {
        // Simple keyword matching for demonstration
        const keywords = change.title.toLowerCase().split(' ')
        return keywords.some((keyword: string) => 
          keyword.length > 3 && item.content.toLowerCase().includes(keyword)
        )
      })

      if (potentialImpacts.length > 0) {
        impacts.push({
          changeId: change.id,
          changeTitle: change.title,
          changeType: change.changeType,
          affectedItems: potentialImpacts.map(item => ({
            id: item.sourceId,
            type: item.sourceType,
            content: item.content.substring(0, 100) + '...',
          })),
        })
      }
    }

    return impacts
  }
} 