import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userStory = await prisma.userStory.findUnique({
      where: { id: params.id },
      include: {
        qualityScores: {
          orderBy: { generatedAt: 'desc' },
          take: 1
        },
        testCases: true,
        requirementAnalyses: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!userStory) {
      return NextResponse.json({ error: 'User story not found' }, { status: 404 })
    }

    return NextResponse.json(userStory)
  } catch (error) {
    console.error('Error fetching user story:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user story' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, acceptanceCriteria, priority, status, component, assignee, reporter } = body

    // Validate that at least one field is provided for update
    if (!title && !description && !acceptanceCriteria && !priority && !status && !component && !assignee && !reporter) {
      return NextResponse.json(
        { error: 'At least one field must be provided for update' },
        { status: 400 }
      )
    }

    // Check if user story exists
    const existingStory = await prisma.userStory.findUnique({
      where: { id: params.id }
    })

    if (!existingStory) {
      return NextResponse.json({ error: 'User story not found' }, { status: 404 })
    }

    // Prepare update data - only include fields that are provided
    const updateData: any = {
      updatedAt: new Date()
    }

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (acceptanceCriteria !== undefined) updateData.acceptanceCriteria = acceptanceCriteria
    if (priority !== undefined) updateData.priority = priority
    if (status !== undefined) updateData.status = status
    if (component !== undefined) updateData.component = component
    if (assignee !== undefined) updateData.assignee = assignee
    if (reporter !== undefined) updateData.reporter = reporter

    // Update the user story
    const updatedStory = await prisma.userStory.update({
      where: { id: params.id },
      data: updateData,
      include: {
        qualityScores: {
          orderBy: { generatedAt: 'desc' },
          take: 1
        },
        testCases: true,
        requirementAnalyses: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    return NextResponse.json({
      message: 'User story updated successfully',
      userStory: updatedStory
    })
  } catch (error) {
    console.error('Error updating user story:', error)
    return NextResponse.json(
      { error: 'Failed to update user story' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user story exists
    const existingStory = await prisma.userStory.findUnique({
      where: { id: params.id }
    })

    if (!existingStory) {
      return NextResponse.json({ error: 'User story not found' }, { status: 404 })
    }

    // Delete related records first (due to foreign key constraints)
    await prisma.$transaction(async (tx) => {
      // Delete quality scores
      await tx.qualityScore.deleteMany({
        where: { userStoryId: params.id }
      })

      // Delete requirement analyses
      await tx.requirementAnalysis.deleteMany({
        where: { userStoryId: params.id }
      })

      // Delete test cases
      await tx.testCase.deleteMany({
        where: { sourceStoryId: params.id }
      })

      // Delete embeddings
      await tx.embedding.deleteMany({
        where: { 
          sourceId: params.id,
          sourceType: 'user_story'
        }
      })

      // Finally delete the user story
      await tx.userStory.delete({
        where: { id: params.id }
      })
    })

    return NextResponse.json({
      message: 'User story deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting user story:', error)
    return NextResponse.json(
      { error: 'Failed to delete user story' },
      { status: 500 }
    )
  }
} 