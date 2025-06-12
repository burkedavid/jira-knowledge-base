-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserStory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "acceptanceCriteria" TEXT,
    "storyPoints" INTEGER,
    "jiraId" TEXT,
    "jiraKey" TEXT,
    "priority" TEXT,
    "status" TEXT,
    "qualityScore" REAL,
    "riskLevel" TEXT,
    "component" TEXT,
    "assignee" TEXT,
    "reporter" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Defect" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "stepsToReproduce" TEXT,
    "rootCause" TEXT,
    "resolution" TEXT,
    "severity" TEXT,
    "priority" TEXT,
    "component" TEXT,
    "status" TEXT,
    "jiraId" TEXT,
    "jiraKey" TEXT,
    "assignee" TEXT,
    "reporter" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "resolvedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "changelog" TEXT,
    "metadata" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DocumentSection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changeType" TEXT,
    "previousHash" TEXT,
    CONSTRAINT "DocumentSection_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TestCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "steps" TEXT NOT NULL,
    "expectedResults" TEXT NOT NULL,
    "sourceStoryId" TEXT,
    "generatedFrom" TEXT,
    "affectedByChanges" BOOLEAN NOT NULL DEFAULT false,
    "priority" TEXT,
    "status" TEXT,
    "lastExecuted" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TestCase_sourceStoryId_fkey" FOREIGN KEY ("sourceStoryId") REFERENCES "UserStory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Embedding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "vector" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "processedItems" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "metadata" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "createdBy" TEXT
);

-- CreateTable
CREATE TABLE "DefectPattern" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 0,
    "severity" TEXT NOT NULL,
    "component" TEXT,
    "rootCause" TEXT,
    "pattern" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "QualityScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userStoryId" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "riskFactors" TEXT NOT NULL,
    "suggestions" TEXT NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QualityScore_userStoryId_fkey" FOREIGN KEY ("userStoryId") REFERENCES "UserStory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DefectCluster" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "defectPatternId" TEXT,
    CONSTRAINT "DefectCluster_defectPatternId_fkey" FOREIGN KEY ("defectPatternId") REFERENCES "DefectPattern" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DefectClusterDefect" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "defectClusterId" TEXT NOT NULL,
    "defectId" TEXT NOT NULL,
    CONSTRAINT "DefectClusterDefect_defectClusterId_fkey" FOREIGN KEY ("defectClusterId") REFERENCES "DefectCluster" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DefectClusterDefect_defectId_fkey" FOREIGN KEY ("defectId") REFERENCES "Defect" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChangeImpact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "changeId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "affectedType" TEXT NOT NULL,
    "affectedId" TEXT NOT NULL,
    "impactLevel" TEXT NOT NULL,
    "requiresAction" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChangeImpact_affectedId_fkey" FOREIGN KEY ("affectedId") REFERENCES "UserStory" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChangeImpact_affectedId_fkey" FOREIGN KEY ("affectedId") REFERENCES "Defect" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChangeImpact_affectedId_fkey" FOREIGN KEY ("affectedId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChangeImpact_affectedId_fkey" FOREIGN KEY ("affectedId") REFERENCES "TestCase" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "relatedId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JiraProjectConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectKey" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "configuration" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "UserStory_jiraId_key" ON "UserStory"("jiraId");

-- CreateIndex
CREATE INDEX "UserStory_jiraId_idx" ON "UserStory"("jiraId");

-- CreateIndex
CREATE INDEX "UserStory_status_idx" ON "UserStory"("status");

-- CreateIndex
CREATE INDEX "UserStory_priority_idx" ON "UserStory"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "Defect_jiraId_key" ON "Defect"("jiraId");

-- CreateIndex
CREATE INDEX "Defect_jiraId_idx" ON "Defect"("jiraId");

-- CreateIndex
CREATE INDEX "Defect_severity_idx" ON "Defect"("severity");

-- CreateIndex
CREATE INDEX "Defect_component_idx" ON "Defect"("component");

-- CreateIndex
CREATE INDEX "Defect_status_idx" ON "Defect"("status");

-- CreateIndex
CREATE INDEX "Document_type_idx" ON "Document"("type");

-- CreateIndex
CREATE INDEX "Document_version_idx" ON "Document"("version");

-- CreateIndex
CREATE INDEX "DocumentSection_documentId_idx" ON "DocumentSection"("documentId");

-- CreateIndex
CREATE INDEX "DocumentSection_order_idx" ON "DocumentSection"("order");

-- CreateIndex
CREATE INDEX "TestCase_sourceStoryId_idx" ON "TestCase"("sourceStoryId");

-- CreateIndex
CREATE INDEX "TestCase_generatedFrom_idx" ON "TestCase"("generatedFrom");

-- CreateIndex
CREATE INDEX "Embedding_sourceType_sourceId_idx" ON "Embedding"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "Embedding_sourceType_idx" ON "Embedding"("sourceType");

-- CreateIndex
CREATE INDEX "ImportJob_type_idx" ON "ImportJob"("type");

-- CreateIndex
CREATE INDEX "ImportJob_status_idx" ON "ImportJob"("status");

-- CreateIndex
CREATE INDEX "DefectPattern_component_idx" ON "DefectPattern"("component");

-- CreateIndex
CREATE INDEX "DefectPattern_severity_idx" ON "DefectPattern"("severity");

-- CreateIndex
CREATE INDEX "QualityScore_userStoryId_idx" ON "QualityScore"("userStoryId");

-- CreateIndex
CREATE INDEX "QualityScore_score_idx" ON "QualityScore"("score");

-- CreateIndex
CREATE INDEX "DefectCluster_riskLevel_idx" ON "DefectCluster"("riskLevel");

-- CreateIndex
CREATE UNIQUE INDEX "DefectClusterDefect_defectClusterId_defectId_key" ON "DefectClusterDefect"("defectClusterId", "defectId");

-- CreateIndex
CREATE INDEX "ChangeImpact_changeType_changeId_idx" ON "ChangeImpact"("changeType", "changeId");

-- CreateIndex
CREATE INDEX "ChangeImpact_affectedType_affectedId_idx" ON "ChangeImpact"("affectedType", "affectedId");

-- CreateIndex
CREATE INDEX "ChangeImpact_impactLevel_idx" ON "ChangeImpact"("impactLevel");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE UNIQUE INDEX "JiraProjectConfig_projectKey_key" ON "JiraProjectConfig"("projectKey");

-- CreateIndex
CREATE INDEX "JiraProjectConfig_projectKey_idx" ON "JiraProjectConfig"("projectKey");
