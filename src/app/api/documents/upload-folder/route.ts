import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { embedContent } from '@/lib/vector-db'
import path from 'path'

interface FolderUploadResult {
  totalFiles: number
  processedFiles: number
  skippedFiles: number
  errors: string[]
  documents: Array<{
    documentId: string
    title: string
    fileName: string
    sectionsProcessed: number
    embeddingsGenerated: number
  }>
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const category = formData.get('category') as string || 'general'
    const generateEmbeddings = formData.get('generateEmbeddings') === 'true'
    const folderPath = formData.get('folderPath') as string || ''

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    const result: FolderUploadResult = {
      totalFiles: files.length,
      processedFiles: 0,
      skippedFiles: 0,
      errors: [],
      documents: []
    }

    // Filter supported files
    const supportedExtensions = ['.md', '.html', '.htm', '.txt']
    const supportedFiles = files.filter(file => {
      const ext = path.extname(file.name).toLowerCase()
      return supportedExtensions.includes(ext)
    })

    result.skippedFiles = files.length - supportedFiles.length

    // Process each supported file
    for (const file of supportedFiles) {
      try {
        const fileName = file.name
        const fileExtension = path.extname(fileName).toLowerCase()
        
        // Read file content
        const buffer = await file.arrayBuffer()
        const content = new TextDecoder('utf-8').decode(buffer)
        
        if (!content.trim()) {
          result.errors.push(`${fileName}: File is empty`)
          continue
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
              fileName,
              fileSize: buffer.byteLength,
              metadata: JSON.stringify({ category, folderPath }),
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
              fileName,
              fileSize: buffer.byteLength,
              metadata: JSON.stringify({ category, folderPath })
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
            console.error('Error generating embeddings for', fileName, ':', error)
            result.errors.push(`${fileName}: Failed to generate embeddings`)
          }
        }

        result.documents.push({
          documentId,
          title,
          fileName,
          sectionsProcessed: sections.length,
          embeddingsGenerated
        })

        result.processedFiles++

      } catch (error) {
        const errorMessage = `${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        result.errors.push(errorMessage)
        console.error('Error processing file:', errorMessage, error)
      }
    }

    // Calculate total embeddings for frontend display
    const totalEmbeddingsGenerated = result.documents.reduce((sum, doc) => sum + doc.embeddingsGenerated, 0)

    return NextResponse.json({
      success: true,
      ...result,
      documentsCreated: result.processedFiles,
      embeddingsGenerated: totalEmbeddingsGenerated
    })

  } catch (error) {
    console.error('Error in folder upload:', error)
    return NextResponse.json(
      { error: 'Failed to process folder upload' },
      { status: 500 }
    )
  }
}

// Reuse the same processing functions from the single file upload
async function processFileContent(
  content: string,
  fileExtension: string,
  title: string
): Promise<{ processedContent: string; sections: Array<{ title: string; content: string; order: number }> }> {
  let processedContent = content
  const sections: Array<{ title: string; content: string; order: number }> = []

  switch (fileExtension) {
    case '.md':
      const mdSections = extractMarkdownSections(content)
      sections.push(...mdSections)
      processedContent = content
      break

    case '.html':
    case '.htm':
      const htmlSections = extractHtmlSections(content)
      sections.push(...htmlSections)
      processedContent = htmlToText(content)
      break

    case '.txt':
      const txtSections = extractTextSections(content, title)
      sections.push(...txtSections)
      processedContent = content
      break

    default:
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
    const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/)
    
    if (headerMatch) {
      if (currentSection && currentSection.content.length > 0) {
        sections.push({
          title: currentSection.title,
          content: currentSection.content.join('\n').trim(),
          order: order++
        })
      }
      currentSection = { title: headerMatch[2], content: [] }
    } else if (currentSection) {
      currentSection.content.push(line)
    } else if (trimmedLine) {
      currentSection = { title: 'Introduction', content: [line] }
    }
  }

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

  const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i)
  const documentTitle = titleMatch ? titleMatch[1].trim() : 'Document'

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
    sections.push({
      title: documentTitle,
      content: htmlToText(content),
      order: 0
    })
  } else {
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
    
    if (isTextHeader(trimmedLine)) {
      if (currentSection && currentSection.content.length > 0) {
        sections.push({
          title: currentSection.title,
          content: currentSection.content.join('\n').trim(),
          order: order++
        })
      }
      currentSection = { title: trimmedLine, content: [] }
    } else if (currentSection) {
      currentSection.content.push(line)
    } else if (trimmedLine) {
      currentSection = { title: title || 'Content', content: [line] }
    }
  }

  if (currentSection && currentSection.content.length > 0) {
    sections.push({
      title: currentSection.title,
      content: currentSection.content.join('\n').trim(),
      order: order++
    })
  }

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
  if (/^\d+(\.\d+)*\.?\s/.test(line)) return true
  if (line === line.toUpperCase() && /^[A-Z\s\d\-_]+$/.test(line)) return true
  if (line.length < 50 && !line.includes('.') && !line.includes(',')) return true
  return false
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
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