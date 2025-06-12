-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "UserStory" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "acceptanceCriteria" TEXT,
    "storyPoints" INTEGER,
    "jiraId" TEXT,
    "jiraKey" TEXT,
    "priority" TEXT,
    "status" TEXT,
    "qualityScore" DOUBLE PRECISION,
    "riskLevel" TEXT,
    "component" TEXT,
    "assignee" TEXT,
    "reporter" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Defect" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Defect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "changelog" TEXT,
    "metadata" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentSection" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changeType" TEXT,
    "previousHash" TEXT,

    CONSTRAINT "DocumentSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestCase" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "steps" TEXT NOT NULL,
    "expectedResults" TEXT NOT NULL,
    "sourceStoryId" TEXT,
    "generatedFrom" TEXT,
    "affectedByChanges" BOOLEAN NOT NULL DEFAULT false,
    "priority" TEXT,
    "status" TEXT,
    "lastExecuted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Embedding" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "vector" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Embedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "processedItems" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "metadata" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdBy" TEXT,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefectPattern" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 0,
    "severity" TEXT NOT NULL,
    "component" TEXT,
    "rootCause" TEXT,
    "pattern" TEXT NOT NULL,

    CONSTRAINT "DefectPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityScore" (
    "id" TEXT NOT NULL,
    "userStoryId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "riskFactors" TEXT NOT NULL,
    "suggestions" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QualityScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementAnalysis" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "userStoryId" TEXT NOT NULL,
    "qualityScore" DOUBLE PRECISION NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "strengths" TEXT NOT NULL,
    "improvements" TEXT NOT NULL,
    "riskFactors" TEXT NOT NULL,
    "aiAnalysis" TEXT NOT NULL,
    "analysisVersion" TEXT NOT NULL DEFAULT '1.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequirementAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisBatch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalStories" INTEGER NOT NULL DEFAULT 0,
    "analyzedStories" INTEGER NOT NULL DEFAULT 0,
    "averageScore" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "filters" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdBy" TEXT,

    CONSTRAINT "AnalysisBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefectCluster" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "defectPatternId" TEXT,

    CONSTRAINT "DefectCluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefectClusterDefect" (
    "id" TEXT NOT NULL,
    "defectClusterId" TEXT NOT NULL,
    "defectId" TEXT NOT NULL,

    CONSTRAINT "DefectClusterDefect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeImpact" (
    "id" TEXT NOT NULL,
    "changeId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "affectedType" TEXT NOT NULL,
    "affectedId" TEXT NOT NULL,
    "impactLevel" TEXT NOT NULL,
    "requiresAction" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChangeImpact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "relatedId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JiraProjectConfig" (
    "id" TEXT NOT NULL,
    "projectKey" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "configuration" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JiraProjectConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAuditLog" (
    "id" TEXT NOT NULL,
    "promptType" TEXT NOT NULL,
    "promptName" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "costUSD" DOUBLE PRECISION NOT NULL,
    "costGBP" DOUBLE PRECISION NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "requestData" TEXT,
    "responseData" TEXT,
    "duration" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AISettings" (
    "id" TEXT NOT NULL,
    "inputTokenCostUSD" DOUBLE PRECISION NOT NULL DEFAULT 0.000003,
    "outputTokenCostUSD" DOUBLE PRECISION NOT NULL DEFAULT 0.000015,
    "exchangeRateUSDToGBP" DOUBLE PRECISION NOT NULL DEFAULT 0.74,
    "model" TEXT NOT NULL DEFAULT 'Claude Sonnet 4',
    "trackingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "retentionDays" INTEGER NOT NULL DEFAULT 90,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "AISettings_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "RequirementAnalysis_batchId_idx" ON "RequirementAnalysis"("batchId");

-- CreateIndex
CREATE INDEX "RequirementAnalysis_userStoryId_idx" ON "RequirementAnalysis"("userStoryId");

-- CreateIndex
CREATE INDEX "RequirementAnalysis_qualityScore_idx" ON "RequirementAnalysis"("qualityScore");

-- CreateIndex
CREATE INDEX "RequirementAnalysis_riskLevel_idx" ON "RequirementAnalysis"("riskLevel");

-- CreateIndex
CREATE INDEX "RequirementAnalysis_createdAt_idx" ON "RequirementAnalysis"("createdAt");

-- CreateIndex
CREATE INDEX "AnalysisBatch_status_idx" ON "AnalysisBatch"("status");

-- CreateIndex
CREATE INDEX "AnalysisBatch_startedAt_idx" ON "AnalysisBatch"("startedAt");

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

-- CreateIndex
CREATE INDEX "AIAuditLog_promptType_idx" ON "AIAuditLog"("promptType");

-- CreateIndex
CREATE INDEX "AIAuditLog_userId_idx" ON "AIAuditLog"("userId");

-- CreateIndex
CREATE INDEX "AIAuditLog_createdAt_idx" ON "AIAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AIAuditLog_success_idx" ON "AIAuditLog"("success");

-- CreateIndex
CREATE INDEX "AIAuditLog_model_idx" ON "AIAuditLog"("model");

-- CreateIndex
CREATE INDEX "AISettings_updatedAt_idx" ON "AISettings"("updatedAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentSection" ADD CONSTRAINT "DocumentSection_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_sourceStoryId_fkey" FOREIGN KEY ("sourceStoryId") REFERENCES "UserStory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityScore" ADD CONSTRAINT "QualityScore_userStoryId_fkey" FOREIGN KEY ("userStoryId") REFERENCES "UserStory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementAnalysis" ADD CONSTRAINT "RequirementAnalysis_userStoryId_fkey" FOREIGN KEY ("userStoryId") REFERENCES "UserStory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefectCluster" ADD CONSTRAINT "DefectCluster_defectPatternId_fkey" FOREIGN KEY ("defectPatternId") REFERENCES "DefectPattern"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefectClusterDefect" ADD CONSTRAINT "DefectClusterDefect_defectId_fkey" FOREIGN KEY ("defectId") REFERENCES "Defect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefectClusterDefect" ADD CONSTRAINT "DefectClusterDefect_defectClusterId_fkey" FOREIGN KEY ("defectClusterId") REFERENCES "DefectCluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
