# 🧠 RAG-Powered Testing & Requirements Intelligence Platform

A comprehensive AI-powered platform that revolutionizes software testing and requirements analysis by combining **Retrieval-Augmented Generation (RAG)**, **Claude 4 Sonnet**, and **semantic search** to provide intelligent insights from your Jira data, documentation, and historical patterns.

## 🌟 Key Features

- **🤖 Claude 4 Sonnet Integration**: Latest AI model via AWS Bedrock for superior analysis
- **🔍 True RAG Implementation**: Vector embeddings + semantic search + AI analysis
- **📊 Progressive Streaming Analytics**: Real-time AI analysis with multi-phase streaming responses
- **🎯 Smart Test Generation**: Context-aware test cases using historical defect patterns
- **📈 Predictive Quality**: Risk assessment and quality scoring for user stories
- **🔄 Seamless Jira Integration**: Automated import with real-time progress tracking
- **📚 Document Intelligence**: Multi-format upload with automatic embedding generation
- **🔐 Enterprise Security**: NextAuth with JWT tokens and route protection

## 🚀 Progressive Streaming System

### **Multi-Phase AI Analysis**
The platform uses a sophisticated streaming approach to handle large datasets efficiently:

**Phase 1: Database Analysis (5s)**
- Statistics collection and baseline metrics
- Real-time defect counts and severity distribution
- Component risk assessment

**Phase 2: Semantic Search (15s)** 
- Vector search across knowledge base
- Contextual relationship mapping
- Historical pattern identification

**Phase 3: Context Enrichment (30s)**
- Detailed entity data retrieval
- Cross-reference analysis
- Quality metric calculation

**Phase 4: AI Intelligence Generation (60s)**
- **4A: Executive Overview** - Business impact summary
- **4B: Pattern Analysis** - Detailed defect patterns with real frequencies
- **4C: Action Planning** - Immediate, short-term, and long-term recommendations

### **Real-Time User Experience**
- **Live Progress Bars**: Visual feedback for each phase
- **Incremental Results**: Data appears as it's processed
- **No Timeout Issues**: Compatible with Vercel's serverless limits
- **Error Recovery**: Graceful handling of phase failures

## 🛠 Technology Stack

### **Frontend**
- **Next.js 14**: React framework with App Router
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first styling with dark mode
- **shadcn/ui**: Accessible component library

### **Backend & AI**
- **AWS Bedrock**: Claude 4 Sonnet integration
- **Prisma ORM**: Type-safe PostgreSQL operations
- **NextAuth**: JWT-based authentication
- **Vector Database**: Custom cosine similarity search

### **RAG Infrastructure**
- **Embeddings**: AWS Titan Text Embeddings V2 (1024-dimensional)
- **Semantic Search**: Configurable similarity thresholds
- **Context Injection**: Multi-entity relationship mapping
- **Progressive Loading**: Streaming AI responses

## 📋 Prerequisites

- **Node.js 18+** with npm/yarn
- **PostgreSQL Database** (Neon, Supabase, or self-hosted)
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

Create `.env` file:

```env
# Database (Required)
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# AWS Bedrock (Required for AI features)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1

# Authentication (Required)
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Jira Integration (Optional)
JIRA_BASE_URL=https://your-company.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-jira-api-token
JIRA_PROJECT_KEY=PROJ
```

### 3. **Database Setup**

```bash
# Generate Prisma client and deploy schema
npm run db:generate
npm run db:migrate

# Setup demo accounts
npm run auth:setup
```

### 4. **Launch Application**

```bash
npm run dev
```

Visit **http://localhost:3000** and login with demo accounts:
- **Admin**: `demo.admin@ragplatform.ai` / `DemoRAG2025!`
- **User**: `demo.user@ragplatform.ai` / `DemoRAG2025!`

## 🔧 Core Capabilities

### **1. AI-Powered Defect Pattern Analysis**
- **Progressive Analysis**: Multi-phase streaming for large datasets
- **Pattern Recognition**: AI identifies complex defect patterns with real frequencies
- **Business Impact**: Clear cost analysis and prevention strategies
- **Interactive UI**: Expandable pattern cards with detailed information
- **Export Capabilities**: Download comprehensive analysis reports

### **2. AI Defect Root Cause Analysis**
- **RAG-Enhanced Analysis**: Uses semantic search across user stories, documentation, and similar defects
- **Claude 4 Integration**: Advanced AI analysis with comprehensive context
- **Server-Side Search**: Real-time filtering across title, description, components, and root causes
- **Analysis History**: Persistent storage of up to 50 analyses with replay functionality
- **Interactive UI**: Modern card-based layout with enhanced filtering and statistics

### **3. RAG-Enhanced Test Case Generation**
- **Context-Aware**: Uses semantic search to find relevant historical patterns
- **Quality Protection**: Configurable threshold (default: 7/10) prevents generation for low-quality requirements
- **Configurable Counts**: 1-10 test cases per type (positive, negative, edge)
- **Structured Output**: Organized by test types with color coding and priority indicators
- **Export Options**: Copy all tests or download as formatted files

### **4. Requirements Quality Analysis**
- **Individual Analysis**: INVEST framework-based scoring with detailed recommendations
- **Batch Analysis**: Process multiple user stories simultaneously with progress tracking
- **RAG-Powered Assessment**: Semantic analysis using historical data and documentation
- **Quality Scoring**: AI-generated scores with improvement recommendations
- **Job Management**: Create, monitor, and manage batch analysis jobs

### **5. AI Audit & Cost Tracking**
- **Usage Monitoring**: Track all AI requests with token counts and costs (USD/GBP)
- **Performance Analytics**: Success rates, duration tracking, and error monitoring
- **User Analytics**: Per-user usage tracking and filtering
- **Cost Management**: Real-time cost tracking with detailed breakdowns by prompt type
- **Data Export**: Clear audit logs and statistics for compliance

### **6. AI Prompts Library**
- **Comprehensive Collection**: All AI prompts used across the platform
- **Interactive Testing**: Test prompts directly with real-time responses
- **Documentation**: Detailed descriptions, parameters, and usage examples
- **Model Information**: Claude 4 Sonnet integration details and token limits
- **Copy Functionality**: Easy copying of prompts for external use

### **7. Document Intelligence System**
- **Multi-Format Support**: PDF, DOCX, TXT, Markdown
- **Automatic Processing**: Text extraction and embedding generation
- **Batch Upload**: Process multiple files simultaneously
- **Section Extraction**: Intelligent document parsing

### **8. Enhanced Knowledge Search**
- **Semantic Search**: Vector embeddings with AWS Titan
- **Search History**: Persistent history with localStorage
- **Dual Modes**: Simple semantic and advanced RAG analysis
- **Cross-Entity Discovery**: Find relationships across all content types

### **9. Comprehensive API Documentation**
- **Interactive Documentation**: Complete API reference with examples
- **Real-Time Testing**: Test endpoints directly from the documentation
- **Authentication Examples**: JWT token usage and session management
- **Response Schemas**: Detailed request/response formats for all endpoints
- **Code Examples**: Ready-to-use code snippets for integration

### **10. Comprehensive RAG Configuration**
- **Search Type Control**: Enable/disable defects, user stories, test cases, documents
- **Performance Optimization**: Configurable result limits and timeouts
- **Quality Thresholds**: Per-content-type similarity thresholds (0.0-1.0)
- **Real-time Updates**: Configuration changes apply immediately

## 🚀 Production Deployment

### **Vercel + PostgreSQL Setup**

1. **Database**: Create PostgreSQL instance (Neon, Supabase, etc.)
2. **Vercel**: Import repository and configure environment variables
3. **Migration**: Run `npx prisma migrate deploy` and `npm run auth:setup`

### **Environment Variables**
| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `AWS_ACCESS_KEY_ID` | AWS access key for Bedrock | ✅ |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for Bedrock | ✅ |
| `AWS_REGION` | AWS region (us-east-1) | ✅ |
| `NEXTAUTH_SECRET` | NextAuth secret key | ✅ |
| `NEXTAUTH_URL` | Your production URL | ✅ |
| `JIRA_*` | Jira integration settings | ❌ |

## 📊 Import & Processing Workflow

### **Jira Data Import**
1. **Data Extraction**: Fetch user stories, defects, epics from Jira API
2. **Content Processing**: Extract text and normalize fields
3. **Embedding Generation**: Create 1024-dimensional vectors via AWS Titan
4. **Pattern Analysis**: Identify defect patterns and component risks
5. **RAG Activation**: Enable semantic search and AI analysis

### **Document Upload**
1. **File Processing**: Support for PDF, DOCX, TXT, Markdown
2. **Content Analysis**: Text extraction and metadata processing
3. **Embedding Generation**: Automatic vector creation for search
4. **Integration**: RAG system ready for cross-document search

### **Progress Tracking**
- **Live Progress Bars**: Visual feedback for each phase
- **Detailed Logging**: Step-by-step status updates
- **Error Handling**: Graceful error reporting and recovery
- **Statistics**: Real-time processing metrics

## 🎯 Usage Examples

### **Defect Pattern Analysis**
```
1. Visit "Analytics" → "Defects"
2. Select timeframe (30d, 90d, 1y, all)
3. Watch progressive analysis unfold in real-time
4. Review 10 critical patterns with business impact
5. Download comprehensive reports
```

### **AI Defect Root Cause Analysis**
```
1. Visit "Analytics" → "Defects" → "Search"
2. Use server-side filtering (severity, component, date range)
3. Select a defect from the enhanced list view
4. Click "Analyze Root Cause with AI"
5. Review RAG-enhanced analysis with prevention recommendations
6. Access analysis history and replay previous analyses
```

### **Test Case Generation**
```
1. Navigate to "Generate Test Cases"
2. Select user story and configure test counts (1-10 per type)
3. Review quality score and RAG context
4. Generate structured, color-coded test cases
5. Export as text file or copy to clipboard
```

### **Batch Requirements Analysis**
```
1. Visit "Analyze Requirements" → "Batch"
2. Configure filters (priority, status, component, date range)
3. Set batch name and start analysis
4. Monitor real-time progress with live updates
5. Review individual results with INVEST scoring
6. Export batch results and analysis reports
```

### **AI Audit & Cost Tracking**
```
1. Visit "AI Audit" page
2. View real-time cost tracking (USD/GBP)
3. Filter by user, prompt type, success status
4. Monitor token usage and performance metrics
5. Export audit logs for compliance
```

### **Document Search**
```
1. Upload documents via "Import Data"
2. Use semantic search across all content
3. View similarity scores and confidence levels
4. Access search history and replay queries
```

## 🔍 Technical Implementation

### **Vector Embeddings**
- **Model**: AWS Titan Text Embeddings V2
- **Dimensions**: 1024 (optimal performance/accuracy balance)
- **Storage**: JSON arrays in PostgreSQL with indexing
- **Content**: Title + Description + Acceptance Criteria

### **AI Context Injection**
- **Comprehensive Context**: Database stats + semantic results + entity details
- **Smart Prompting**: Role-based prompts for different analysis types
- **Response Parsing**: Structured markdown and JSON output
- **Streaming**: Progressive multi-phase response generation

### **Database Schema**
```sql
User          -- Authentication with secure password hashing
UserStory     -- Jira stories with quality scores
Defect        -- Bug reports with pattern analysis
TestCase      -- Generated and manual test cases
Document      -- Documentation with section parsing
Embedding     -- Vector embeddings for semantic search
```

## 🛠 Development Tools

### **Database Management**
```bash
# Visual database editor
npx prisma studio --port 5555

# Database operations
npx prisma migrate deploy
npx prisma generate
npm run auth:setup
```

### **API Testing**
```bash
# Test AI integration
curl http://localhost:3000/api/test/claude-simple

# Test embeddings
curl http://localhost:3000/api/embeddings/generate

# Test progressive analysis
curl -X POST http://localhost:3000/api/analytics/defects/query \
  -H "Content-Type: application/json" \
  -d '{"query":"analyze patterns","timeframe":"1y","phase":"init"}'

# Test defect root cause analysis
curl -X POST http://localhost:3000/api/analyze/defect-root-cause \
  -H "Content-Type: application/json" \
  -d '{"defect":{"id":"defect-123","title":"Login fails","component":"Authentication"}}'

# Test batch requirements analysis
curl -X POST http://localhost:3000/api/analyze/requirements-batch \
  -H "Content-Type: application/json" \
  -d '{"name":"Quality Check","filters":{"priority":["High"]}}'

# Test AI audit logs
curl http://localhost:3000/api/ai-audit/logs?page=1&limit=20

# Test RAG configuration
curl http://localhost:3000/api/settings/rag-config
```

## ⚙️ Configuration Options

### **RAG Settings API**
```bash
# Get configuration
GET /api/settings/rag-config

# Update settings
PUT /api/settings/rag-config
```

### **Key Configuration Options**
- **Search Types**: Enable/disable content types (defects, stories, tests, docs)
- **Result Limits**: 0-10 items per type (default: 2 each)
- **Similarity Thresholds**: 0.0-1.0 quality control (default: 0.8 for defects)
- **Performance**: Timeouts (15-60s), parallel search, caching

### **Quality Thresholds**
- **Test Generation**: 1-10 scale (default: 7) with warning dialogs
- **Search Quality**: Per-content-type similarity thresholds
- **AI Confidence**: Pattern recognition confidence scoring

## 📈 Advanced Features

### **Predictive Analytics**
- **Component Risk Scoring**: Historical defect pattern analysis
- **Quality Trend Analysis**: Track improvements over time
- **Defect Prediction**: Risk assessment for new user stories

### **Integration Capabilities**
- **RESTful APIs**: External system integration
- **Export Functions**: CSV, JSON, TXT data export
- **Webhook Support**: Real-time updates (future enhancement)

### **Scalability**
- **Vector Database**: Efficient similarity search at scale
- **Caching**: Embedding and analysis result caching
- **Batch Processing**: Handle large datasets efficiently
- **Performance Optimization**: Indexed searches and query optimization

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Follow TypeScript and ESLint standards
4. Add tests for new functionality
5. Submit pull request with detailed description

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

### **Common Issues**
- **AWS Bedrock**: Ensure Claude 4 model access is enabled
- **Database**: Verify PostgreSQL connection and migrations
- **Authentication**: Check NEXTAUTH_SECRET and URL configuration
- **Performance**: Monitor batch sizes and API rate limiting

### **Getting Help**
- **Documentation**: Comprehensive guides in `/docs`
- **API Reference**: OpenAPI specifications available
- **Community**: GitHub Discussions for questions
- **Issues**: Bug reports and feature requests

---

**🎯 Ready to revolutionize your testing and requirements process with AI-powered insights and progressive streaming analytics!**
