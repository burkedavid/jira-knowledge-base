# 🧠 RAG-Powered Testing & Requirements Intelligence Platform

A comprehensive AI-powered platform that revolutionizes software testing and requirements analysis by combining **Retrieval-Augmented Generation (RAG)**, **Claude 4 Sonnet**, and **semantic search** to provide intelligent insights from your Jira data, documentation, and historical patterns.

## 🌟 Key Highlights

- **🤖 Claude 4 Sonnet Integration**: Latest AI model via AWS Bedrock for superior analysis
- **🔍 True RAG Implementation**: Vector embeddings + semantic search + AI analysis
- **📊 Intelligent Analytics**: AI-powered defect pattern analysis with actionable insights
- **🎯 Smart Test Generation**: Context-aware test cases using historical defect patterns
- **📈 Predictive Quality**: Risk assessment and quality scoring for user stories
- **🔄 Seamless Jira Integration**: Automated import with real-time progress tracking
- **📚 Document Intelligence**: Upload and analyze documents with automatic embedding generation
- **🔍 Advanced Search**: Persistent search history with localStorage integration

## 🚀 Core Features

### 🔐 **Authentication & Security System**
- **NextAuth Integration**: Secure authentication with JWT tokens and session management
- **Credentials Provider**: Email/password authentication with bcrypt password hashing
- **Route Protection**: Middleware-based protection for all application routes
- **User Management**: Built-in user account creation and management system
- **Session Provider**: React context for authentication state management
- **User Menu**: Dropdown interface with user info, settings access, and logout
- **Demo Accounts**: Pre-configured demo accounts for testing and demonstrations
- **Password Security**: Secure password hashing with bcrypt and salt rounds
- **JWT Tokens**: Secure token-based authentication with configurable secrets
- **Protected Routes**: Automatic redirection to login for unauthenticated users

### 🧪 **AI-Powered Test Case Generation**
- **RAG-Enhanced**: Uses semantic search to find relevant historical defects and test cases
- **Context-Aware**: Analyzes similar user stories and their test patterns
- **Industry Best Practices**: Incorporates testing methodologies and edge case patterns
- **Quality Threshold Protection**: Configurable quality score threshold (default: 7/10) prevents test generation for low-quality requirements with warning dialog
- **Structured Output**: Organized by test types (Positive, Negative, Edge Cases, Security)
- **Enhanced UI**: Beautiful display with color-coded test categories, priority indicators, and expandable sections
- **Export Options**: Copy all tests or download as formatted files
- **Dual Views**: Structured view with parsed test cases and raw AI output view

### 📋 **Requirements Quality Analysis**
- **RAG-Powered Assessment**: Semantic analysis of requirements quality using historical data
- **Quality Scoring**: AI-generated scores with detailed improvement recommendations
- **Pattern Recognition**: Identifies common quality issues from past user stories
- **Actionable Insights**: Specific suggestions for improving acceptance criteria and clarity
- **Enhanced Search**: Filter and search user stories with real-time dropdown
- **Structured Results**: Organized display of strengths, improvements, and risk factors  

### 📊 **Advanced Defect Pattern Analysis**
- **AI-Powered Pattern Recognition**: Claude 4 analyzes defects to identify complex patterns
- **RAG-Enhanced Context**: Uses semantic search to find related defects, user stories, and documents
- **Comprehensive Insights**: Business impact analysis, prevention strategies, and testing recommendations
- **Interactive UI**: Expandable pattern cards with detailed information
- **Confidence Scoring**: AI confidence levels for each identified pattern
- **Severity Filtering**: Filter patterns by Critical, High, Medium, Low severity
- **Actionable Recommendations**: Immediate, short-term, and long-term action plans
- **Component Analysis**: Identify affected components and root causes
- **Export Capabilities**: Download detailed pattern analysis reports

### 🔍 **Enhanced Knowledge Search**
- **Semantic Search**: Vector embeddings with AWS Titan Text Embeddings V2
- **RAG Integration**: Comprehensive context-aware search results
- **Search History**: Persistent search history with localStorage
- **Dual Search Modes**: Simple semantic search and advanced RAG analysis
- **Result Management**: Copy, download, and replay previous searches
- **Cross-Entity Search**: Find related user stories, defects, test cases, and documents
- **Confidence Scoring**: Similarity percentages and AI confidence levels
- **Export Functions**: Download search results and analysis

### 📚 **Document Intelligence System**
- **Multi-Format Support**: Upload PDF, DOCX, TXT, and Markdown files
- **Automatic Processing**: Extract text content and generate embeddings
- **Batch Upload**: Process multiple files simultaneously
- **Folder Upload**: Upload entire directories with nested structure
- **Section Extraction**: Intelligent document section parsing
- **Embedding Generation**: Automatic vector embedding creation for semantic search
- **Progress Tracking**: Real-time upload and processing status
- **Storage Management**: File size tracking and metadata storage

### 📈 **Dynamic Dashboard System**
- **Real-Time Metrics**: Live statistics from your imported data
- **RAG System Health**: Vector embeddings status and search capabilities
- **Component Risk Analysis**: Identify high-risk areas based on defect patterns
- **Recent Activity**: Import jobs with detailed status indicators
- **Interactive Elements**: Refresh buttons and last updated timestamps
- **Error Handling**: Graceful error display with retry options

### 🔍 **Intelligent Defect Analytics**
- **Natural Language Queries**: Ask questions like "What's the worst functionality for defects?"
- **RAG-Powered Analysis**: Semantic understanding with comprehensive context
- **Pattern Recognition**: Identifies root causes, component risks, and trending issues
- **Predictive Insights**: AI-powered recommendations for preventing future defects
- **Visual Dashboards**: Real-time metrics with component risk assessment
- **Query Interface**: Interactive query system with example prompts
- **Historical Analysis**: Trend analysis with visual charts and insights

## 🛠 Technology Stack

### **Frontend**
- **Next.js 14**: React framework with App Router
- **TypeScript**: Full type safety across the application
- **Tailwind CSS**: Utility-first styling with dark mode support
- **shadcn/ui**: Beautiful, accessible component library
- **Lucide Icons**: Consistent iconography
- **localStorage Integration**: Persistent user preferences and search history

### **Backend & AI**
- **AWS Bedrock**: Claude 4 Sonnet integration with regional model support
- **Vector Database**: Custom implementation with cosine similarity search
- **tRPC**: End-to-end type-safe APIs
- **Prisma ORM**: Type-safe database operations with SQLite
- **NextAuth**: Authentication system with JWT tokens and session management
- **bcrypt**: Secure password hashing with salt rounds
- **File Processing**: Multi-format document parsing and text extraction

### **RAG Infrastructure**
- **Embeddings**: AWS Titan Text Embeddings V2 (1024-dimensional vectors)
- **Semantic Search**: Cosine similarity with configurable thresholds
- **Context Enrichment**: Multi-entity relationship mapping
- **AI Analysis**: Claude 4 with comprehensive context injection
- **Document Processing**: Automatic embedding generation for uploaded files

### **Data Processing**
- **Jira Integration**: REST API with intelligent rate limiting
- **Document Processing**: PDF, DOCX, TXT, MD parsing with section extraction
- **Batch Processing**: Resumable imports with progress tracking
- **Real-time Updates**: Server-Sent Events for live progress
- **File Upload**: Multi-file and folder upload with progress tracking

## 📋 Prerequisites

- **Node.js 18+** with npm/yarn
- **AWS Account** with Bedrock access (Claude 4 Sonnet enabled)
- **Jira Instance** (optional, for data import)

## 🚀 Quick Start

### 1. **Installation**

```bash
git clone <repository-url>
cd knowledge-base-v2
npm install
```

### 2. **Environment Configuration**

Create `.env` file with your configuration:

```env
# Database
DATABASE_URL="file:./dev.db"

# AWS Bedrock (Required for AI features)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1

# Jira Integration (Optional)
JIRA_BASE_URL=https://your-company.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-jira-api-token
JIRA_PROJECT_KEY=PROJ

# NextAuth (Required for authentication)
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

### 3. **Database Setup**

```bash
# Initialize database
npm run db:generate
npm run db:push

# Seed with sample data
npm run db:seed

# Setup authentication users (demo accounts)
npm run auth:setup
```

### 4. **Launch Application**

```bash
npm run dev
```

Visit **http://localhost:3000** to start using the platform.

### 5. **Authentication Setup**

The platform includes secure authentication with demo accounts:

**Demo Accounts:**
- **Admin**: `demo.admin@ragplatform.ai` / `DemoRAG2025!`
- **User**: `demo.user@ragplatform.ai` / `DemoRAG2025!`

**User Management Commands:**
```bash
# Create/reset demo accounts
npm run auth:setup

# Reset all authentication users
npm run auth:reset
```

## 🔧 AWS Bedrock Setup

### **Model Access Requirements**
1. **AWS Account** with Bedrock service access
2. **Model Access**: Request access to Claude 4 Sonnet in AWS Console
3. **Regional Model ID**: Uses `us.anthropic.claude-sonnet-4-20250514-v1:0`
4. **IAM Permissions**: Bedrock InvokeModel permissions

### **Supported Models**
- **Primary**: Claude 4 Sonnet (latest, most capable)
- **Fallback**: Claude 3.5 Sonnet (if Claude 4 unavailable)
- **Embeddings**: AWS Titan Text Embeddings V2

### **Cost Optimization**
- **Embeddings**: ~$0.0001 per 1K tokens (very affordable)
- **Claude 4**: Pay-per-use, optimized prompts for efficiency
- **Caching**: Vector embeddings cached in database

## 📊 Complete Import Workflow

### **What Happens During Jira Import**

#### **Phase 1: Data Extraction**
```
🔄 Connecting to Jira API
📥 Fetching user stories, defects, epics
📊 Processing custom fields and relationships
✅ Storing raw data in database
```

#### **Phase 2: Content Processing**
```
📝 Extracting text content for embeddings
🔍 Combining title + description + acceptance criteria
🏷️ Normalizing components, priorities, statuses
📈 Calculating initial quality metrics
```

#### **Phase 3: Vector Embedding Generation**
```
🧠 Generating embeddings via AWS Titan
📐 Creating 1024-dimensional vectors
💾 Storing embeddings in vector database
🔗 Linking embeddings to source entities
```

#### **Phase 4: Pattern Analysis**
```
🔍 Analyzing defect patterns and clustering
📊 Identifying component risk factors
🎯 Calculating quality scores for user stories
📈 Building predictive models
```

#### **Phase 5: RAG System Activation**
```
✅ Semantic search capabilities enabled
🤖 AI analysis with full context available
📊 Dashboard metrics populated
🔍 Cross-entity relationships established
```

### **Document Upload Workflow**

#### **Phase 1: File Processing**
```
📁 Multi-file and folder upload support
📄 Format detection (PDF, DOCX, TXT, MD)
🔍 Text extraction and content parsing
📊 Section identification and structuring
```

#### **Phase 2: Content Analysis**
```
📝 Content preprocessing and cleaning
🏷️ Metadata extraction (title, size, type)
📈 Quality assessment and validation
🔗 Relationship identification with existing data
```

#### **Phase 3: Embedding Generation**
```
🧠 Automatic embedding generation
📐 Vector creation for semantic search
💾 Database storage with indexing
✅ RAG system integration
```

### **Import Progress Tracking**

The platform provides real-time progress tracking:

- **Live Progress Bars**: Visual progress for each import phase
- **Detailed Logging**: Step-by-step status updates
- **Error Handling**: Continues processing with error reporting
- **Statistics**: Items processed, success rates, timing
- **Resumable**: Failed imports can be retried
- **Embedding Counts**: Real-time embedding generation tracking

### **Post-Import Capabilities**

Once import completes, you can:

1. **🔍 Ask Natural Questions**: "What are the worst components for defects?"
2. **🧪 Generate Smart Tests**: Context-aware test cases with historical patterns
3. **📋 Analyze Requirements**: AI-powered quality assessment
4. **📊 Explore Dashboards**: Real-time metrics and insights
5. **🔍 Semantic Search**: Find related content across all data
6. **📚 Search Documents**: Find relevant documentation and guides
7. **📈 Pattern Analysis**: AI-powered defect pattern recognition

## 🎯 Usage Guide

### **1. Authentication & Access**
- **Secure Login**: Email/password authentication with modern UI
- **Session Management**: Persistent login sessions with JWT tokens
- **User Menu**: Access user info, settings, and logout from any page
- **Route Protection**: All application routes protected by authentication
- **Demo Accounts**: Pre-configured accounts for testing and demonstrations

### **2. Dashboard Overview**
- **System Health**: RAG capabilities and data status
- **Key Metrics**: User stories, defects, test cases, embeddings
- **Recent Activity**: Import jobs and system updates
- **Quick Actions**: Access to main features
- **Real-time Updates**: Live data refresh with timestamps

### **3. Settings Configuration**
```
1. Navigate to "Settings" from the main menu
2. Configure "Product Context" for industry-specific AI analysis
3. Set "Quality Threshold" for test case generation (1-10 scale)
4. Configure user types, key features, and security standards
5. Save settings to apply across the platform
```

**Quality Threshold Settings**:
- **Default Value**: 7/10 (recommended for most teams)
- **Range**: 1-10 (1 = allow all, 10 = perfect requirements only)
- **Behavior**: Shows warning dialog when generating tests for low-quality user stories
- **Override**: Users can choose to "Generate Anyway" after seeing the warning

### **4. Document Upload & Management**
```
1. Navigate to "Import Data"
2. Choose "Upload Documents" tab
3. Select files or drag & drop
4. Enable "Generate Embeddings" for RAG
5. Monitor upload progress
6. View processing statistics
7. Access documents via semantic search
```

**Features**:
- **Multi-format Support**: PDF, DOCX, TXT, Markdown
- **Batch Processing**: Multiple files simultaneously
- **Automatic Embeddings**: RAG-ready vector generation
- **Progress Tracking**: Real-time upload and processing status

### **5. Enhanced Test Case Generation**
```
1. Navigate to "Generate Test Cases"
2. Select a user story from the dropdown
3. Review story details, quality score, and context
4. Click "Generate Test Cases"
5. Handle quality threshold warnings if score is below configured threshold
6. View structured, color-coded results
7. Switch between Formatted and Raw views
8. Copy all tests or download as file
```

**Enhanced Features**:
- **Quality Protection**: Configurable quality threshold (default: 7/10) with warning dialog for low-quality requirements
- **Quality Score Display**: Shows existing quality scores in story selection and preview
- **Structured Display**: Organized by test type with color coding
- **Priority Indicators**: Visual priority badges (High, Medium, Low)
- **Expandable Sections**: Click to expand test details
- **Export Options**: Copy to clipboard or download as text file

### **6. Advanced Requirements Analysis**
```
1. Go to "Analyze Requirements"
2. Search and filter user stories
3. Select story from enhanced dropdown
4. Review current quality metrics
5. Click "Analyze Requirements"
6. Get structured quality assessment
7. View strengths, improvements, and risk factors
```

**Enhanced Features**:
- **Smart Search**: Real-time filtering of user stories
- **Story Preview**: Detailed story information before analysis
- **Structured Results**: Organized display of analysis results
- **RAG Context**: Historical quality insights from similar stories

### **7. AI-Powered Defect Pattern Analysis**
```
1. Visit "Analytics" → "Defects"
2. View AI-Powered Defect Pattern Analysis section
3. Filter by severity (Critical, High, Medium, Low)
4. Click on patterns to expand details
5. Review business impact and prevention strategies
6. Download comprehensive analysis reports
7. Implement recommended actions
```

**Advanced Features**:
- **Pattern Recognition**: AI identifies complex defect patterns
- **Business Impact**: Clear impact assessment for each pattern
- **Prevention Strategies**: Specific recommendations to prevent issues
- **Testing Recommendations**: Targeted testing approaches
- **Confidence Scoring**: AI confidence levels for each pattern
- **Action Plans**: Immediate, short-term, and long-term recommendations

### **8. Enhanced Knowledge Search**
```
1. Use the search functionality
2. Enter natural language queries
3. Choose between Semantic and RAG modes
4. View ranked results with similarity scores
5. Access search history panel
6. Replay previous searches
7. Download search results and analysis
```

**Advanced Features**:
- **Search History**: Persistent history with localStorage
- **Dual Modes**: Simple semantic search and comprehensive RAG analysis
- **Result Management**: Copy, download, and replay searches
- **Confidence Scoring**: AI confidence and similarity percentages

### **9. Interactive Defect Analytics**
```
1. Visit "Analytics" → "Defects"
2. Use the "Ask About Defect Patterns" interface
3. Enter natural language questions or use examples
4. Get AI-powered insights with data
5. Explore component risk analysis
6. Review actionable recommendations
```

**Query Examples**:
- "What's the worst functionality this year for defects?"
- "Which components have the most critical defects?"
- "What are the most common root causes?"
- "Show me authentication-related issues"

## 🔍 RAG Implementation Details

### **Vector Embeddings**
- **Model**: AWS Titan Text Embeddings V2
- **Dimensions**: 1024 (optimal balance of performance/accuracy)
- **Content**: Title + Description + Acceptance Criteria + Document Content
- **Storage**: JSON arrays in SQLite with efficient indexing
- **Generation**: Automatic for all uploaded documents and imported data

### **Semantic Search**
- **Algorithm**: Cosine similarity with configurable thresholds
- **Performance**: Sub-second search across thousands of items
- **Ranking**: Similarity scores from 0-100%
- **Filtering**: By content type, date ranges, components
- **History**: Persistent search history with replay functionality

### **AI Context Injection**
- **Comprehensive Context**: Database statistics + semantic results + entity details
- **Smart Prompting**: Role-based prompts for different analysis types
- **Fallback Logic**: Rule-based analysis if AI fails
- **Response Parsing**: Structured markdown and JSON output
- **Pattern Analysis**: Advanced defect pattern recognition with business impact

### **Cross-Entity Relationships**
- **User Stories** ↔ **Test Cases**: Generated and related tests
- **Defects** ↔ **Components**: Risk analysis and patterns
- **Documents** ↔ **Requirements**: Documentation coverage and search
- **Embeddings** ↔ **All Entities**: Semantic relationships across all content
- **Patterns** ↔ **Defects**: AI-identified patterns with confidence scoring

## 📊 Database Schema

### **Core Entities**
```sql
User          -- Authentication users with secure password hashing
UserStory     -- Jira user stories with quality scores
Defect        -- Bug reports with pattern analysis  
TestCase      -- Generated and manual test cases
Document      -- User guides and documentation with sections
Embedding     -- Vector embeddings for semantic search
```

### **Analytics & Intelligence**
```sql
QualityScore     -- AI-generated quality assessments
DefectPattern    -- AI-identified patterns with business impact
DefectCluster    -- Grouped defects by similarity
ChangeImpact     -- Documentation change tracking
ImportJob        -- Batch processing job tracking
DocumentSection  -- Document sections for granular search
```

### **Enhanced Relationships**
- **Polymorphic Embeddings**: One embedding model for all content types
- **Quality Scoring**: Linked to user stories with historical tracking
- **Pattern Analysis**: AI-powered defect patterns with confidence scoring
- **Test Generation**: Test cases linked to source user stories with RAG context
- **Document Sections**: Granular document processing for better search

## 🛠 Development Tools

### **Database Management**
```bash
# Prisma Studio (Visual database editor)
npx prisma studio --port 5555

# Database migrations
npm run db:migrate

# Reset database
npm run db:reset
```

### **Testing & Debugging**
```bash
# Test embeddings functionality
curl http://localhost:3000/api/embeddings/generate

# Test Claude 4 integration
curl http://localhost:3000/api/test/claude-simple

# Check system health
curl http://localhost:3000/api/health

# Test authentication endpoints
curl -X POST http://localhost:3000/api/auth/signin

# Test defect pattern analysis
curl -X POST http://localhost:3000/api/analyze/defect-patterns-ai

# Get quality threshold setting
curl http://localhost:3000/api/settings/quality-threshold

# Get product context settings
curl http://localhost:3000/api/settings/product-context
```

### **Monitoring**
- **Embedding Statistics**: `/api/embeddings/stats`
- **Import Job Status**: Real-time progress tracking
- **Error Logging**: Comprehensive error reporting
- **Performance Metrics**: Response times and success rates
- **Document Processing**: Upload and embedding generation tracking

## 🔧 Configuration Options

### **RAG Settings**
- **Similarity Threshold**: 0.6-0.8 (configurable per search)
- **Result Limits**: 5-20 items (performance vs. context balance)
- **Content Types**: Filter by user_story, defect, test_case, document
- **Context Window**: Optimized for Claude 4's context limits
- **Search History**: Configurable history size (default: 20 searches)

### **AI Parameters**
- **Temperature**: 0.2 (pattern analysis) to 1.0 (creative generation)
- **Max Tokens**: 2000-4000 (based on analysis complexity)
- **Model Selection**: Automatic fallback from Claude 4 to 3.5
- **Prompt Engineering**: Role-based, context-aware prompts
- **Confidence Scoring**: AI confidence levels for pattern recognition
- **Quality Threshold**: 1-10 scale for test case generation protection (default: 7)

### **Import Settings**
- **Batch Size**: 10-50 items (Jira API rate limiting)
- **Retry Logic**: 3 attempts with exponential backoff
- **Date Filtering**: Configurable time ranges
- **Field Mapping**: Custom Jira field configurations
- **Document Processing**: Automatic embedding generation toggle
- **File Size Limits**: Configurable upload limits

### **UI Enhancements**
- **Dark Mode**: Full dark mode support across all components
- **Responsive Design**: Mobile-friendly layouts
- **Progress Tracking**: Real-time progress bars and status updates
- **Error Handling**: Graceful error display with retry options
- **Export Functions**: Download capabilities for all analysis results

## 🚀 Advanced Features

### **Predictive Analytics**
- **Component Risk Scoring**: Based on historical defect patterns
- **Quality Trend Analysis**: Track improvement over time
- **Defect Prediction**: Assess risk for new user stories
- **Pattern Recognition**: AI-powered clustering of similar issues
- **Business Impact Assessment**: Clear impact analysis for each pattern

### **Enhanced Search Capabilities**
- **Multi-Modal Search**: Semantic search across all content types
- **Search History**: Persistent search history with replay
- **Context-Aware Results**: RAG-enhanced search with comprehensive context
- **Export Functions**: Download search results and analysis
- **Cross-Entity Discovery**: Find relationships between different content types

### **Document Intelligence**
- **Multi-Format Processing**: PDF, DOCX, TXT, Markdown support
- **Section Extraction**: Intelligent document parsing
- **Automatic Embeddings**: RAG-ready vector generation
- **Batch Processing**: Handle multiple files efficiently
- **Content Analysis**: Quality assessment and relationship identification

### **Integration Capabilities**
- **Jira Webhooks**: Real-time updates (future enhancement)
- **API Endpoints**: RESTful APIs for external integrations
- **Export Functions**: CSV, JSON, TXT data export
- **Reporting**: Automated quality reports with AI insights

### **Scalability**
- **Vector Database**: Efficient similarity search at scale
- **Caching**: Embedding and analysis result caching
- **Batch Processing**: Handle large datasets efficiently
- **Performance Optimization**: Indexed searches and query optimization
- **Storage Management**: Efficient file and embedding storage

## 📈 Success Metrics

### **Quality Improvements**
- **Test Coverage**: Increased test case generation efficiency
- **Defect Reduction**: Proactive identification of risk areas
- **Requirements Quality**: Improved user story clarity and completeness
- **Time Savings**: Automated analysis and generation tasks
- **Pattern Recognition**: AI-identified defect patterns with prevention strategies

### **Platform Adoption**
- **User Engagement**: Dashboard usage and feature adoption
- **Data Growth**: Imported content and generated insights
- **Search Usage**: Semantic search query patterns and history
- **AI Utilization**: Claude 4 analysis request volumes
- **Document Processing**: Upload and embedding generation metrics

### **Enhanced Analytics**
- **Search History**: Track user search patterns and preferences
- **Pattern Analysis**: Monitor AI-identified defect patterns over time
- **Document Intelligence**: Measure document processing and search effectiveness
- **Export Usage**: Track report downloads and data export patterns

## 🤝 Contributing

### **Development Setup**
1. Fork the repository
2. Create feature branch
3. Follow TypeScript and ESLint standards
4. Add tests for new functionality
5. Submit pull request with detailed description

### **Code Standards**
- **TypeScript**: Strict type checking enabled
- **ESLint**: Airbnb configuration with custom rules
- **Prettier**: Consistent code formatting
- **Prisma**: Type-safe database operations
- **Component Architecture**: Reusable, accessible components

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### **Common Issues**
- **AWS Bedrock Access**: Ensure Claude 4 model access is enabled
- **Jira Connection**: Verify API token and permissions
- **Embedding Generation**: Check AWS credentials and region
- **Performance**: Monitor batch sizes and rate limiting
- **Document Upload**: Verify file formats and size limits
- **Search Issues**: Check embedding generation and vector database

### **Getting Help**
- **Documentation**: Comprehensive guides in `/docs`
- **API Reference**: OpenAPI specs available
- **Community**: GitHub Discussions for questions
- **Issues**: Bug reports and feature requests

---

**🎯 Ready to revolutionize your testing and requirements process with AI-powered insights!** 

**New in this version:**
- 🔐 **Complete Authentication System** with NextAuth, JWT tokens, and secure user management
- 🧠 **AI-Powered Defect Pattern Analysis** with business impact assessment
- 📚 **Document Intelligence System** with multi-format support
- 🔍 **Enhanced Search** with persistent history and RAG integration
- 🎨 **Improved UI/UX** with structured displays and export capabilities
- 📊 **Advanced Analytics** with confidence scoring and actionable recommendations
- 👤 **User Menu Integration** with settings access and session management
- 🛡️ **Route Protection** with middleware-based authentication
- 🔑 **Demo Accounts** for testing and demonstration purposes 