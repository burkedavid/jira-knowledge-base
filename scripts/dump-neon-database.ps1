# PowerShell script to dump Neon PostgreSQL database
$DATABASE_URL = "postgresql://jira-knowledge-base-dev_owner:npg_Okd5mxq2oarw@ep-yellow-silence-ab6lez0s-pooler.eu-west-2.aws.neon.tech/jira-knowledge-base-dev?sslmode=require"
$OUTPUT_FILE = Join-Path $PSScriptRoot ".." "database-dump.sql"

Write-Host "🚀 Starting database dump from Neon..." -ForegroundColor Green
Write-Host "📁 Output file: $OUTPUT_FILE" -ForegroundColor Cyan

# Check if pg_dump is available
try {
    $pgDumpVersion = pg_dump --version
    Write-Host "✅ Found pg_dump: $pgDumpVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ pg_dump not found. Please install PostgreSQL client tools." -ForegroundColor Red
    Write-Host "Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

Write-Host "⏳ Running pg_dump command..." -ForegroundColor Yellow

# Run pg_dump
$dumpCommand = "pg_dump `"$DATABASE_URL`" --verbose --clean --no-acl --no-owner --format=plain --file=`"$OUTPUT_FILE`""

try {
    Invoke-Expression $dumpCommand
    
    if (Test-Path $OUTPUT_FILE) {
        $fileSize = (Get-Item $OUTPUT_FILE).Length / 1MB
        Write-Host "✅ Database dump completed successfully!" -ForegroundColor Green
        Write-Host "📊 File size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan
        Write-Host "📁 Location: $OUTPUT_FILE" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "🔧 To restore to local PostgreSQL:" -ForegroundColor Yellow
        Write-Host "1. Create a local database: createdb knowledge_base_local" -ForegroundColor White
        Write-Host "2. Import the dump: psql -d knowledge_base_local -f `"$OUTPUT_FILE`"" -ForegroundColor White
    } else {
        Write-Host "❌ Dump file was not created" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error during dump: $_" -ForegroundColor Red
} 