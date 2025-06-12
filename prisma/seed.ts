import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create sample user stories
  const userStory1 = await prisma.userStory.create({
    data: {
      title: 'User Login Functionality',
      description: 'As a user, I want to be able to log into the system using my email and password so that I can access my account.',
      acceptanceCriteria: `
        - User can enter email and password
        - System validates credentials
        - User is redirected to dashboard on success
        - Error message shown for invalid credentials
        - Password field is masked
      `,
      priority: 'High',
      status: 'In Progress',
      component: 'Authentication',
      assignee: 'John Doe',
      reporter: 'Jane Smith',
    },
  })

  const userStory2 = await prisma.userStory.create({
    data: {
      title: 'Password Reset Feature',
      description: 'As a user, I want to reset my password when I forget it so that I can regain access to my account.',
      acceptanceCriteria: `
        - User can click "Forgot Password" link
        - System sends reset email to registered email
        - User can click link in email to reset password
        - New password must meet security requirements
        - User is notified of successful password change
      `,
      priority: 'Medium',
      status: 'To Do',
      component: 'Authentication',
      assignee: 'Bob Wilson',
      reporter: 'Jane Smith',
    },
  })

  // Create sample defects
  const defect1 = await prisma.defect.create({
    data: {
      title: 'Login button not responsive on mobile',
      description: 'The login button does not respond to touch events on mobile devices, preventing users from logging in.',
      stepsToReproduce: `
        1. Open the application on a mobile device
        2. Navigate to the login page
        3. Enter valid credentials
        4. Tap the login button
        5. Observe that nothing happens
      `,
      severity: 'High',
      priority: 'High',
      status: 'Open',
      component: 'Authentication',
      assignee: 'John Doe',
      reporter: 'QA Team',
      rootCause: 'CSS touch-action property not set correctly',
    },
  })

  const defect2 = await prisma.defect.create({
    data: {
      title: 'Password validation error message unclear',
      description: 'When users enter an invalid password format, the error message is not specific enough to help them understand the requirements.',
      stepsToReproduce: `
        1. Go to password reset page
        2. Enter a password that doesn't meet requirements (e.g., "123")
        3. Submit the form
        4. Observe the generic error message
      `,
      severity: 'Low',
      priority: 'Medium',
      status: 'In Progress',
      component: 'Authentication',
      assignee: 'Alice Johnson',
      reporter: 'UX Team',
      rootCause: 'Validation messages not user-friendly',
    },
  })

  // Create sample test cases
  const testCase1 = await prisma.testCase.create({
    data: {
      title: 'Verify successful login with valid credentials',
      steps: `
        1. Navigate to the login page
        2. Enter a valid email address
        3. Enter the correct password
        4. Click the login button
      `,
      expectedResults: 'User should be successfully logged in and redirected to the dashboard',
      sourceStoryId: userStory1.id,
      generatedFrom: 'manual',
      priority: 'High',
      status: 'Active',
    },
  })

  const testCase2 = await prisma.testCase.create({
    data: {
      title: 'Verify error handling for invalid credentials',
      steps: `
        1. Navigate to the login page
        2. Enter an invalid email address
        3. Enter any password
        4. Click the login button
      `,
      expectedResults: 'System should display an error message indicating invalid credentials',
      sourceStoryId: userStory1.id,
      generatedFrom: 'ai_generated',
      priority: 'High',
      status: 'Active',
    },
  })

  // Create sample document
  const document1 = await prisma.document.create({
    data: {
      title: 'Authentication System Requirements',
      content: `
# Authentication System Requirements

## Overview
This document outlines the requirements for the authentication system.

## Functional Requirements

### Login Process
- Users must be able to log in using email and password
- System must validate credentials against the database
- Failed login attempts must be logged for security

### Password Requirements
- Minimum 8 characters
- Must contain at least one uppercase letter
- Must contain at least one number
- Must contain at least one special character

### Security Features
- Account lockout after 5 failed attempts
- Password reset functionality via email
- Session timeout after 30 minutes of inactivity
      `,
      type: 'TXT',
      version: '1.0',
      fileName: 'auth-requirements.txt',
      fileSize: 1024,
    },
  })

  // Create document sections
  await prisma.documentSection.create({
    data: {
      documentId: document1.id,
      title: 'Overview',
      content: 'This document outlines the requirements for the authentication system.',
      order: 1,
      previousHash: 'hash1',
    },
  })

  await prisma.documentSection.create({
    data: {
      documentId: document1.id,
      title: 'Login Process',
      content: `
        - Users must be able to log in using email and password
        - System must validate credentials against the database
        - Failed login attempts must be logged for security
      `,
      order: 2,
      previousHash: 'hash2',
    },
  })

  // Create sample import job
  await prisma.importJob.create({
    data: {
      type: 'jira',
      status: 'completed',
      totalItems: 25,
      processedItems: 25,
      metadata: JSON.stringify({ projectKey: 'DEMO', includeUserStories: true, includeDefects: true }),
      completedAt: new Date(),
    },
  })

  // Create sample quality scores
  await prisma.qualityScore.create({
    data: {
      userStoryId: userStory1.id,
      score: 85.5,
      riskFactors: JSON.stringify(['Missing edge case scenarios', 'Acceptance criteria could be more specific']),
      suggestions: JSON.stringify(['Add negative test scenarios', 'Define specific error messages']),
    },
  })

  await prisma.qualityScore.create({
    data: {
      userStoryId: userStory2.id,
      score: 92.0,
      riskFactors: JSON.stringify(['Security considerations not fully detailed']),
      suggestions: JSON.stringify(['Add password complexity requirements', 'Define session timeout behavior']),
    },
  })

  // Create sample defect pattern
  const defectPattern1 = await prisma.defectPattern.create({
    data: {
      name: 'Mobile UI Responsiveness Issues',
      description: 'Pattern of defects related to UI elements not working properly on mobile devices',
      frequency: 3,
      severity: 'High',
      component: 'UI',
      rootCause: 'Insufficient mobile testing and CSS issues',
      pattern: JSON.stringify({
        commonKeywords: ['mobile', 'touch', 'responsive', 'button'],
        affectedComponents: ['Authentication', 'Navigation', 'Forms'],
        timePattern: 'Increasing trend in last 3 months'
      }),
    },
  })

  // Create defect cluster
  const defectCluster1 = await prisma.defectCluster.create({
    data: {
      name: 'Authentication Component Issues',
      pattern: JSON.stringify({
        description: 'Cluster of defects affecting the authentication system',
        severity: 'High',
        frequency: 5
      }),
      riskLevel: 'High',
      defectPatternId: defectPattern1.id,
    },
  })

  // Link defects to cluster
  await prisma.defectClusterDefect.create({
    data: {
      defectClusterId: defectCluster1.id,
      defectId: defect1.id,
    },
  })

  await prisma.defectClusterDefect.create({
    data: {
      defectClusterId: defectCluster1.id,
      defectId: defect2.id,
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log(`Created:
    - 2 User Stories
    - 2 Defects  
    - 2 Test Cases
    - 1 Document with 2 sections
    - 1 Import Job
    - 2 Quality Scores
    - 1 Defect Pattern
    - 1 Defect Cluster
  `)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 