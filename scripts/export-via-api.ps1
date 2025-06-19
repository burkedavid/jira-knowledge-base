# PowerShell script to export data via application APIs
$BASE_URL = "http://localhost:3001"
$OUTPUT_DIR = Join-Path $PSScriptRoot ".." "api-exports"

Write-Host "🚀 Exporting data via application APIs..." -ForegroundColor Green
Write-Host "📁 Output directory: $OUTPUT_DIR" -ForegroundColor Cyan

# Create output directory
if (-not (Test-Path $OUTPUT_DIR)) {
    New-Item -ItemType Directory -Path $OUTPUT_DIR | Out-Null
    Write-Host "📂 Created output directory" -ForegroundColor Green
}

try {
    # Export User Stories
    Write-Host "📦 Exporting User Stories..." -ForegroundColor Yellow
    $userStoriesUrl = "$BASE_URL/api/user-stories"
    $userStoriesFile = Join-Path $OUTPUT_DIR "user-stories.json"
    
    $userStoriesResponse = Invoke-RestMethod -Uri $userStoriesUrl -Method Get -ContentType "application/json"
    $userStoriesResponse | ConvertTo-Json -Depth 10 | Out-File -FilePath $userStoriesFile -Encoding UTF8
    Write-Host "   ✅ User Stories exported: $userStoriesFile" -ForegroundColor Green
    
    # Export Defects
    Write-Host "📦 Exporting Defects..." -ForegroundColor Yellow
    $defectsUrl = "$BASE_URL/api/defects"
    $defectsFile = Join-Path $OUTPUT_DIR "defects.json"
    
    $defectsResponse = Invoke-RestMethod -Uri $defectsUrl -Method Get -ContentType "application/json"
    $defectsResponse | ConvertTo-Json -Depth 10 | Out-File -FilePath $defectsFile -Encoding UTF8
    Write-Host "   ✅ Defects exported: $defectsFile" -ForegroundColor Green
    
    # Export Documents
    Write-Host "📦 Exporting Documents..." -ForegroundColor Yellow
    $documentsUrl = "$BASE_URL/api/documents"
    $documentsFile = Join-Path $OUTPUT_DIR "documents.json"
    
    $documentsResponse = Invoke-RestMethod -Uri $documentsUrl -Method Get -ContentType "application/json"
    $documentsResponse | ConvertTo-Json -Depth 10 | Out-File -FilePath $documentsFile -Encoding UTF8
    Write-Host "   ✅ Documents exported: $documentsFile" -ForegroundColor Green
    
    # Try to export Test Cases (if endpoint exists)
    Write-Host "📦 Attempting to export Test Cases..." -ForegroundColor Yellow
    try {
        $testCasesUrl = "$BASE_URL/api/test-cases"
        $testCasesFile = Join-Path $OUTPUT_DIR "test-cases.json"
        
        $testCasesResponse = Invoke-RestMethod -Uri $testCasesUrl -Method Get -ContentType "application/json"
        $testCasesResponse | ConvertTo-Json -Depth 10 | Out-File -FilePath $testCasesFile -Encoding UTF8
        Write-Host "   ✅ Test Cases exported: $testCasesFile" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Test Cases endpoint not available, skipping..." -ForegroundColor Yellow
    }
    
    # Try to export Users (if endpoint exists)
    Write-Host "📦 Attempting to export Users..." -ForegroundColor Yellow
    try {
        $usersUrl = "$BASE_URL/api/users"
        $usersFile = Join-Path $OUTPUT_DIR "users.json"
        
        $usersResponse = Invoke-RestMethod -Uri $usersUrl -Method Get -ContentType "application/json"
        $usersResponse | ConvertTo-Json -Depth 10 | Out-File -FilePath $usersFile -Encoding UTF8
        Write-Host "   ✅ Users exported: $usersFile" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Users endpoint not available, skipping..." -ForegroundColor Yellow
    }
    
    # Get file sizes and summary
    Write-Host ""
    Write-Host "📊 Export Summary:" -ForegroundColor Cyan
    Get-ChildItem $OUTPUT_DIR -Filter "*.json" | ForEach-Object {
        $sizeKB = [math]::Round($_.Length / 1KB, 2)
        Write-Host "   $($_.Name): $sizeKB KB" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "✅ Export completed successfully!" -ForegroundColor Green
    Write-Host "📁 All files saved to: $OUTPUT_DIR" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🔧 Next steps:" -ForegroundColor Yellow
    Write-Host "1. Set up local PostgreSQL database" -ForegroundColor White
    Write-Host "2. Update .env file with local DATABASE_URL" -ForegroundColor White
    Write-Host "3. Run: npx prisma db push" -ForegroundColor White
    Write-Host "4. Import JSON data using a custom script" -ForegroundColor White
    
} catch {
    Write-Host "❌ Error during export: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure your application is running on localhost:3001" -ForegroundColor White
    Write-Host "2. Check if the API endpoints exist and are accessible" -ForegroundColor White
    Write-Host "3. Verify you're authenticated (if required)" -ForegroundColor White
} 