# Local PostgreSQL Setup Guide

This guide will help you set up a local PostgreSQL database using the dump file from your Neon database.

## Prerequisites

- PostgreSQL installed locally
- The `database-dump.sql` file (246 MB) in your project root
- Access to PostgreSQL command line tools (`createdb`, `psql`)

## 📋 Next Steps to Use Locally

### 1. **Set up Local PostgreSQL Database**

Create a new local database and import the dump:

```bash
# Create a new local database
createdb knowledge_base_local

# Import the dump (this may take a few minutes due to the 246 MB size)
psql -d knowledge_base_local -f database-dump.sql
```

**Alternative using PostgreSQL tools with full path:**
```bash
# If createdb/psql are not in your PATH, use full paths:
"C:\Program Files\PostgreSQL\16\bin\createdb.exe" knowledge_base_local
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -d knowledge_base_local -f database-dump.sql
```

### 2. **Update Your Environment**

Update your `.env` file to point to the local database:

```env
# Replace your current DATABASE_URL with:
DATABASE_URL="postgresql://username:password@localhost:5432/knowledge_base_local"

# Example with default PostgreSQL user:
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/knowledge_base_local"
```

**Note:** Replace `username` and `password` with your local PostgreSQL credentials.

### 3. **Test the Local Setup**

Start your application to verify everything works:

```bash
# Start the development server
npm run dev

# Your app should now run on http://localhost:3001 using local PostgreSQL
```

## 📊 What's Included in the Dump

Your local database now contains:
- ✅ **782 User Stories** (from 2020-01-07 to 2025-05-30)
- ✅ **2,953 Defects** (from 2020-01-02 to 2025-06-17)
- ✅ **633 Documents** (from 2025-06-19)
- ✅ **All embeddings** for semantic search
- ✅ **Complete schema** with indexes, constraints, and foreign keys
- ✅ **All other tables** (users, sessions, analysis data, etc.)

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Test PostgreSQL connection
psql -d knowledge_base_local -c "SELECT COUNT(*) FROM \"UserStory\";"
# Should return: 782

psql -d knowledge_base_local -c "SELECT COUNT(*) FROM \"Defect\";"
# Should return: 2953

psql -d knowledge_base_local -c "SELECT COUNT(*) FROM \"Document\";"
# Should return: 633
```

### Permission Issues
```bash
# Grant permissions to your user
psql -d knowledge_base_local -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_username;"
psql -d knowledge_base_local -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_username;"
```

### Prisma Issues
```bash
# If you need to regenerate Prisma client
npx prisma generate

# Push schema to ensure sync (optional)
npx prisma db push
```

## 🎯 Benefits of Local Setup

- ✅ **No quota limits** - unlimited database operations
- ✅ **Faster development** - no network latency
- ✅ **Offline development** - works without internet
- ✅ **Safe testing** - experiment without affecting production
- ✅ **Full control** - backup, restore, modify as needed

## 📁 File Information

- **Dump file**: `database-dump.sql` (246 MB)
- **Created**: June 19, 2025
- **Source**: Neon PostgreSQL (jira-knowledge-base-dev)
- **Git status**: File is in `.gitignore` (won't be committed)

## 🔄 Updating Your Local Database

To refresh your local database with new data from Neon (when quota resets):

```bash
# Re-run the pg_dump command
& "C:\Users\david.burke\OneDrive - Idox Software Ltd\Desktop\postgresql-17.5-1-windows-x64-binaries\pgsql\bin\pg_dump.exe" "postgresql://jira-knowledge-base-dev_owner:npg_Okd5mxq2oarw@ep-yellow-silence-ab6lez0s-pooler.eu-west-2.aws.neon.tech/jira-knowledge-base-dev?sslmode=require" --verbose --clean --no-acl --no-owner --format=plain --file="database-dump.sql"

# Drop and recreate local database
dropdb knowledge_base_local
createdb knowledge_base_local
psql -d knowledge_base_local -f database-dump.sql
```

---

🚀 **You're all set!** Your local PostgreSQL database is now ready for development without any quota restrictions. 