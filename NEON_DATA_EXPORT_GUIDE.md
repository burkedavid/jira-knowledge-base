# Neon Database Export Guide

Your Neon database has exceeded the data transfer quota. Here are several approaches to export your data:

## Problem
- **Error**: "Your project has exceeded the data transfer quota"
- **Database**: `jira-knowledge-base-dev` on Neon
- **Data**: ~4,368 total items (782 user stories + 2,953 defects + 633 documents)

## Solution Options

### Option 1: Wait for Quota Reset (Easiest)
- Neon quotas typically reset monthly
- Check your Neon dashboard for quota reset date
- Run the dump script again after reset

### Option 2: Upgrade Neon Plan (Recommended)
- Go to [Neon Console](https://console.neon.tech/)
- Upgrade to Pro plan for higher data transfer limits
- Run the dump script immediately

### Option 3: Use Neon CLI (If Available)
```bash
# Install Neon CLI
npm install -g @neondatabase/cli

# Login to Neon
neonctl auth

# Create a branch and dump
neonctl branches create --name export-branch
neonctl connection-string --database-name jira-knowledge-base-dev --branch export-branch
```

### Option 4: Export via Application API (Alternative)
Since your application is running, you can export data through your own APIs:

```bash
# Export User Stories
curl "http://localhost:3001/api/user-stories" > user-stories.json

# Export Defects  
curl "http://localhost:3001/api/defects" > defects.json

# Export Documents
curl "http://localhost:3001/api/documents" > documents.json
```

### Option 5: Manual Schema + Selective Data Export
Create the schema manually and export only essential data:

1. **Create Local Database**:
```bash
createdb knowledge_base_local
```

2. **Apply Prisma Schema**:
```bash
# Update your .env to point to local database
DATABASE_URL="postgresql://username:password@localhost:5432/knowledge_base_local"

# Push schema
npx prisma db push
```

3. **Export Small Batches**: Use the batch script with very small batch sizes (10-20 records)

## Database Schema
Based on your Prisma schema, you need these tables:
- UserStory
- Defect  
- Document
- User
- TestCase (if exists)

## Local PostgreSQL Setup
1. **Install PostgreSQL** (if not installed)
2. **Create Database**:
```bash
createdb knowledge_base_local
```

3. **Update Environment**:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/knowledge_base_local"
```

4. **Initialize Schema**:
```bash
npx prisma db push
```

## Data Counts (for verification)
- User Stories: 782
- Defects: 2,953  
- Documents: 633
- Total: 4,368 items

## Next Steps
1. Choose one of the options above
2. If using local PostgreSQL, update your `.env` file
3. Run `npm run dev` to test with local database
4. Generate embeddings for local data: `http://localhost:3001/api/embeddings/generate`

## Scripts Available
- `scripts/dump-neon-batch.js` - Batched export (may still hit quota)
- `scripts/dump-neon-prisma.js` - Full export (will hit quota)
- `scripts/dump-neon-database.js` - Node.js with pg library
- `scripts/dump-neon-database.ps1` - PowerShell version

## Recommended Approach
1. **Immediate**: Use Option 4 (API export) to get JSON data
2. **Long-term**: Upgrade Neon plan or wait for quota reset
3. **Local Development**: Set up local PostgreSQL and migrate gradually 