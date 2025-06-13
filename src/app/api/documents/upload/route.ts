import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { embedContent } from '@/lib/vector-db'
import crypto from 'crypto'
import path from 'path'

interface DocumentUploadResult {
  documentId: string
  title: string
  sectionsProcessed: number
  embeddingsGenerated: number
  errors: string[]
}

// Add timeout wrapper for long-running operations
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    )
  ])
}

export async function POST(request: NextRequest) {
  try {
    // Add timeout for the entire request processing
    return await withTimeout(processUploadRequest(request), 55000) // 55 seconds, leaving 5s buffer
  } catch (error) {
    console.error('Error in document upload:', error)
    
    // Ensure we always return JSON, even for unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        totalProcessed: 0,
        documentsCreated: 0,
        embeddingsGenerated: 0,
        errors: [errorMessage]
      },
      { status: 500 }
    )
  }
}

async function processUploadRequest(request: NextRequest) {
  const formData = await request.formData()
  const files = formData.getAll('files') as File[]
  const category = formData.get('category') as string || 'general'
  const generateEmbeddings = formData.get('generateEmbeddings') === 'true'

  if (!files || files.length === 0) {
    return NextResponse.json(
      { 
        success: false,
        error: 'No files provided',
        totalProcessed: 0,
        documentsCreated: 0,
        embeddingsGenerated: 0,
        errors: ['No files provided']
      },
      { status: 400 }
    )
  }

  // Limit the number of files per request to prevent timeouts
  if (files.length > 25) {
    return NextResponse.json(
      { 
        success: false,
        error: `Too many files in single request. Maximum 25 files allowed, received ${files.length}. Please use chunked upload for large batches.`,
        totalProcessed: 0,
        documentsCreated: 0,
        embeddingsGenerated: 0,
        errors: [`Too many files: ${files.length} > 25`]
      },
      { status: 400 }
    )
  }

  const results: DocumentUploadResult[] = []
  const errors: string[] = []

  for (const file of files) {
    try {
      const result = await processDocumentFile(file, category, generateEmbeddings)
      results.push(result)
    } catch (error) {
      const errorMessage = `Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
      errors.push(errorMessage)
      console.error(errorMessage, error)
    }
  }

  // Calculate totals for frontend display
  const totalEmbeddingsGenerated = results.reduce((sum, result) => sum + result.embeddingsGenerated, 0)
  const totalSectionsProcessed = results.reduce((sum, result) => sum + result.sectionsProcessed, 0)

  return NextResponse.json({
    success: true,
    results,
    totalProcessed: results.length,
    documentsCreated: results.length,
    embeddingsGenerated: totalEmbeddingsGenerated,
    sectionsProcessed: totalSectionsProcessed,
    totalErrors: errors.length,
    errors
  })
}

async function processDocumentFile(
  file: File,
  category: string,
  generateEmbeddings: boolean
): Promise<DocumentUploadResult> {
  const fileName = file.name
  const fileExtension = path.extname(fileName).toLowerCase()
  
  // Check if file type is supported
  if (!['.md', '.html', '.htm', '.txt'].includes(fileExtension)) {
    throw new Error(`Unsupported file type: ${fileExtension}. Supported types: .md, .html, .htm, .txt`)
  }

  // Read file content
  const buffer = await file.arrayBuffer()
  const content = new TextDecoder('utf-8').decode(buffer)
  
  if (!content.trim()) {
    throw new Error('File is empty or could not be read')
  }

  // Extract title from filename (remove extension)
  const title = path.basename(fileName, fileExtension)
  
  // Process content based on file type
  const { processedContent, sections } = await processFileContent(content, fileExtension, title)
  
  // Check if document already exists
  const existingDoc = await prisma.document.findFirst({
    where: { 
      OR: [
        { title },
        { fileName }
      ]
    }
  })

  let documentId: string

  if (existingDoc) {
    // Update existing document
    await prisma.document.update({
      where: { id: existingDoc.id },
      data: {
        content: processedContent,
        type: getDocumentType(fileExtension),
        metadata: JSON.stringify({ category }),
        fileName,
        fileSize: buffer.byteLength,
        updatedAt: new Date()
      }
    })
    documentId = existingDoc.id
  } else {
    // Create new document
    const document = await prisma.document.create({
      data: {
        title,
        content: processedContent,
        type: getDocumentType(fileExtension),
        metadata: JSON.stringify({ category }),
        fileName,
        fileSize: buffer.byteLength
      }
    })
    documentId = document.id
  }

  let embeddingsGenerated = 0

  // Generate embeddings if requested
  if (generateEmbeddings) {
    try {
      // Generate embedding for the full document
      await embedContent(processedContent, documentId, 'document')
      embeddingsGenerated++

      // Generate embeddings for each section if we have them
      for (const section of sections) {
        if (section.content.trim().length > 50) { // Only embed substantial sections
          await embedContent(
            `${section.title}\n\n${section.content}`,
            `${documentId}_section_${section.order}`,
            'document_section'
          )
          embeddingsGenerated++
        }
      }
    } catch (error) {
      console.error('Error generating embeddings:', error)
      // Don't fail the whole process if embeddings fail
    }
  }

  return {
    documentId,
    title,
    sectionsProcessed: sections.length,
    embeddingsGenerated,
    errors: []
  }
}

async function processFileContent(
  content: string,
  fileExtension: string,
  title: string
): Promise<{ processedContent: string; sections: Array<{ title: string; content: string; order: number }> }> {
  let processedContent = content
  const sections: Array<{ title: string; content: string; order: number }> = []

  switch (fileExtension) {
    case '.md':
      // Process Markdown
      const mdSections = extractMarkdownSections(content)
      sections.push(...mdSections)
      // Keep original markdown content
      processedContent = content
      break

    case '.html':
    case '.htm':
      // Process HTML
      const htmlSections = extractHtmlSections(content)
      sections.push(...htmlSections)
      // Convert HTML to plain text for storage
      processedContent = htmlToText(content)
      break

    case '.txt':
      // Process plain text
      const txtSections = extractTextSections(content, title)
      sections.push(...txtSections)
      processedContent = content
      break

    default:
      // Fallback - treat as plain text
      sections.push({ title: 'Content', content: content.trim(), order: 0 })
      processedContent = content
  }

  return { processedContent, sections }
}

function extractMarkdownSections(content: string): Array<{ title: string; content: string; order: number }> {
  const sections: Array<{ title: string; content: string; order: number }> = []
  const lines = content.split('\n')
  let currentSection: { title: string; content: string[] } | null = null
  let order = 0

  for (const line of lines) {
    const trimmedLine = line.trim()
    
    // Check for markdown headers (# ## ### etc.)
    const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/)
    if (headerMatch) {
      // Save previous section
      if (currentSection && currentSection.content.length > 0) {
        sections.push({
          title: currentSection.title,
          content: currentSection.content.join('\n').trim(),
          order: order++
        })
      }
      
      // Start new section
      currentSection = {
        title: headerMatch[2],
        content: []
      }
    } else if (currentSection) {
      currentSection.content.push(line)
    } else if (trimmedLine) {
      // Content before first header
      currentSection = {
        title: 'Introduction',
        content: [line]
      }
    }
  }

  // Add last section
  if (currentSection && currentSection.content.length > 0) {
    sections.push({
      title: currentSection.title,
      content: currentSection.content.join('\n').trim(),
      order: order++
    })
  }

  return sections
}

function extractHtmlSections(content: string): Array<{ title: string; content: string; order: number }> {
  const sections: Array<{ title: string; content: string; order: number }> = []
  let order = 0

  // Extract title from HTML
  const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i)
  const documentTitle = titleMatch ? titleMatch[1].trim() : 'Document'

  // Extract sections based on heading tags (h1, h2, h3, etc.)
  const headingRegex = /<(h[1-6])[^>]*>([^<]+)<\/h[1-6]>/gi
  const headings: Array<{ level: number; title: string; position: number }> = []
  
  let match
  while ((match = headingRegex.exec(content)) !== null) {
    const level = parseInt(match[1].charAt(1))
    const title = match[2].trim()
    const position = match.index
    headings.push({ level, title, position })
  }

  if (headings.length === 0) {
    // No headings found, treat entire content as one section
    sections.push({
      title: documentTitle,
      content: htmlToText(content),
      order: 0
    })
  } else {
    // Extract content between headings
    for (let i = 0; i < headings.length; i++) {
      const currentHeading = headings[i]
      const nextHeading = headings[i + 1]
      
      const startPos = currentHeading.position
      const endPos = nextHeading ? nextHeading.position : content.length
      
      const sectionHtml = content.substring(startPos, endPos)
      const sectionText = htmlToText(sectionHtml)
      
      if (sectionText.trim()) {
        sections.push({
          title: currentHeading.title,
          content: sectionText.trim(),
          order: order++
        })
      }
    }
  }

  return sections
}

function extractTextSections(content: string, title: string): Array<{ title: string; content: string; order: number }> {
  const sections: Array<{ title: string; content: string; order: number }> = []
  const lines = content.split('\n')
  let currentSection: { title: string; content: string[] } | null = null
  let order = 0

  for (const line of lines) {
    const trimmedLine = line.trim()
    
    // Check if line looks like a header (all caps, numbered, etc.)
    if (isTextHeader(trimmedLine)) {
      // Save previous section
      if (currentSection && currentSection.content.length > 0) {
        sections.push({
          title: currentSection.title,
          content: currentSection.content.join('\n').trim(),
          order: order++
        })
      }
      
      // Start new section
      currentSection = {
        title: trimmedLine,
        content: []
      }
    } else if (currentSection) {
      currentSection.content.push(line)
    } else if (trimmedLine) {
      // Content before first header
      currentSection = {
        title: title || 'Content',
        content: [line]
      }
    }
  }

  // Add last section
  if (currentSection && currentSection.content.length > 0) {
    sections.push({
      title: currentSection.title,
      content: currentSection.content.join('\n').trim(),
      order: order++
    })
  }

  // If no sections found, create one section with all content
  if (sections.length === 0) {
    sections.push({
      title: title || 'Content',
      content: content.trim(),
      order: 0
    })
  }

  return sections
}

function isTextHeader(line: string): boolean {
  if (!line || line.length < 3) return false
  
  // Check for numbered headers (1., 1.1, etc.)
  if (/^\d+(\.\d+)*\.?\s/.test(line)) return true
  
  // Check for ALL CAPS headers
  if (line === line.toUpperCase() && /^[A-Z\s\d\-_]+$/.test(line)) return true
  
  // Check for lines that are significantly shorter than average (likely headers)
  if (line.length < 50 && !line.includes('.') && !line.includes(',')) return true
  
  return false
}

function htmlToText(html: string): string {
  // Simple HTML to text conversion
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
    .replace(/<[^>]+>/g, ' ') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp;
    .replace(/&amp;/g, '&') // Replace &amp;
    .replace(/&lt;/g, '<') // Replace &lt;
    .replace(/&gt;/g, '>') // Replace &gt;
    .replace(/&quot;/g, '"') // Replace &quot;
    .replace(/&#39;/g, "'") // Replace &#39;
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

function getDocumentType(fileExtension: string): string {
  switch (fileExtension) {
    case '.md':
      return 'markdown'
    case '.html':
    case '.htm':
      return 'html'
    case '.txt':
      return 'text'
    default:
      return 'text'
  }
} 