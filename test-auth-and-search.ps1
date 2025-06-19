# Reusable Authentication and Search Test Script
# Usage: powershell -ExecutionPolicy Bypass -File test-auth-and-search.ps1
Write-Host "RAG Knowledge Base - Authentication and Search Test" -ForegroundColor Cyan

# Configuration
$baseUrl = "http://localhost:3000"
$credentials = @{
    email = "demo.admin@ragplatform.ai"
    password = "DemoRAG2025!"
}

# Step 1: Get CSRF token and authenticate
Write-Host "`nStep 1: Authenticating..." -ForegroundColor Yellow

try {
    # Get CSRF token
    Write-Host "Getting CSRF token..." -ForegroundColor Gray
    $csrfResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/csrf" -SessionVariable webSession
    $csrfData = $csrfResponse.Content | ConvertFrom-Json
    $csrfToken = $csrfData.csrfToken
    
    Write-Host "CSRF Token: $($csrfToken.Substring(0, 20))..." -ForegroundColor Green
    
    # Sign in with credentials
    Write-Host "Signing in with credentials..." -ForegroundColor Gray
    $signInData = @{
        email = $credentials.email
        password = $credentials.password
        csrfToken = $csrfToken
        callbackUrl = $baseUrl
        redirect = "false"
    }
    
    $formBody = ""
    foreach ($key in $signInData.Keys) {
        $formBody += "$key=$([System.Web.HttpUtility]::UrlEncode($signInData[$key]))&"
    }
    $formBody = $formBody.TrimEnd('&')
    
    $signInResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/callback/credentials" -Method Post -ContentType "application/x-www-form-urlencoded" -Body $formBody -WebSession $webSession -MaximumRedirection 0 -ErrorAction SilentlyContinue
    
    if ($signInResponse.StatusCode -eq 302 -or $signInResponse.StatusCode -eq 200) {
        Write-Host "✅ Authentication successful!" -ForegroundColor Green
        
        # Show session cookies
        $sessionCookies = $webSession.Cookies.GetCookies($baseUrl)
        Write-Host "Session cookies: $($sessionCookies.Count)" -ForegroundColor Magenta
        
        foreach ($cookie in $sessionCookies) {
            if ($cookie.Name -eq "next-auth.session-token") {
                Write-Host "  ✅ Session token: $($cookie.Value.Substring(0, 30))..." -ForegroundColor Green
            } else {
                Write-Host "  $($cookie.Name): $($cookie.Value.Substring(0, 30))..." -ForegroundColor Gray
            }
        }
        
    } else {
        Write-Host "❌ Authentication failed with status: $($signInResponse.StatusCode)" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "❌ Authentication error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Test search functionality
Write-Host "`nStep 2: Testing search functionality..." -ForegroundColor Yellow

# Function to test a search query
function Test-SearchQuery {
    param(
        [string]$Query,
        [string]$Description,
        [array]$ExpectedTerms = @(),
        [double]$Threshold = 0.05
    )
    
    Write-Host "`n🔍 $Description" -ForegroundColor Cyan
    Write-Host "Query: '$Query'" -ForegroundColor White
    
    try {
        $searchBody = @{
            query = $Query
            threshold = $Threshold
        } | ConvertTo-Json
        
        $searchResponse = Invoke-WebRequest -Uri "$baseUrl/api/search/rag" -Method Post -ContentType "application/json" -Body $searchBody -WebSession $webSession
        
        if ($searchResponse.Headers['Content-Type'] -like "*json*") {
            $jsonResponse = $searchResponse.Content | ConvertFrom-Json
            
            # Parse the answer if it's nested JSON
            $answer = $jsonResponse.answer
            $followUpQuestions = @()
            
            try {
                $parsed = $jsonResponse.answer | ConvertFrom-Json -ErrorAction SilentlyContinue
                if ($parsed.answer -and $parsed.followUpQuestions) {
                    $answer = $parsed.answer
                    $followUpQuestions = $parsed.followUpQuestions
                }
            } catch {
                # If not nested JSON, use as-is
            }
            
            Write-Host "✅ SUCCESS!" -ForegroundColor Green
            Write-Host "Answer: $($answer.Substring(0, [Math]::Min(250, $answer.Length)))..." -ForegroundColor Green
            Write-Host "Sources found: $($jsonResponse.sources.Count)" -ForegroundColor Magenta
            
            if ($jsonResponse.sources.Count -gt 0) {
                Write-Host "Top sources:" -ForegroundColor Yellow
                for ($i = 0; $i -lt [Math]::Min(3, $jsonResponse.sources.Count); $i++) {
                    $source = $jsonResponse.sources[$i]
                    $similarity = if ($source.similarity) { $source.similarity.ToString('F3') } else { "N/A" }
                    Write-Host "  $($i+1). $($source.title) (Type: $($source.type), Similarity: $similarity)" -ForegroundColor Gray
                }
            }
            
            # Check for expected terms if provided
            if ($ExpectedTerms.Count -gt 0) {
                $answerLower = $answer.ToLower()
                $foundTerms = $ExpectedTerms | Where-Object { $answerLower.Contains($_.ToLower()) }
                Write-Host "Expected terms found: $($foundTerms.Count)/$($ExpectedTerms.Count)" -ForegroundColor Blue
                if ($foundTerms.Count -gt 0) {
                    Write-Host "  Found: $($foundTerms -join ', ')" -ForegroundColor Green
                }
            }
            
            if ($followUpQuestions.Count -gt 0) {
                Write-Host "Follow-up questions:" -ForegroundColor Yellow
                for ($i = 0; $i -lt [Math]::Min(3, $followUpQuestions.Count); $i++) {
                    Write-Host "  $($i+1). $($followUpQuestions[$i])" -ForegroundColor Gray
                }
            }
            
            return $true
            
        } else {
            Write-Host "❌ Non-JSON response received" -ForegroundColor Red
            return $false
        }
        
    } catch {
        Write-Host "❌ Search error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Predefined test queries
$testQueries = @(
    @{
        query = "What are Activities and what business functions do they enable?"
        description = "Testing document search - Activities overview"
        expectedTerms = @("Activities", "business functions", "processes")
    },
    @{
        query = "What issue happens when users change language to German or Polish in the archiver?"
        description = "Testing defect search - Language preference issue (FL-18504)"
        expectedTerms = @("language", "German", "Polish", "archiver", "workspaces")
    },
    @{
        query = "What needs to be done to prevent performance issues in the Document Search API?"
        description = "Testing user story search - API performance (FL-18475)"
        expectedTerms = @("paging", "Document Search", "API", "performance")
    }
)

# Run predefined tests
Write-Host "Running predefined test queries..." -ForegroundColor Yellow
$passedTests = 0

foreach ($test in $testQueries) {
    $success = Test-SearchQuery -Query $test.query -Description $test.description -ExpectedTerms $test.expectedTerms
    if ($success) { $passedTests++ }
    Write-Host ("-" * 80) -ForegroundColor Gray
}

Write-Host "`n📊 Test Results: $passedTests/$($testQueries.Count) passed" -ForegroundColor Cyan

# Interactive mode option
Write-Host "`nWould you like to test custom queries? (Y/N)" -ForegroundColor Yellow
$response = Read-Host

if ($response -eq "Y" -or $response -eq "y") {
    Write-Host "`nEntering interactive mode. Type 'exit' to quit." -ForegroundColor Cyan
    
    do {
        Write-Host "`nEnter your search query:" -ForegroundColor Yellow
        $customQuery = Read-Host
        
        if ($customQuery -ne "exit" -and $customQuery.Trim() -ne "") {
            Test-SearchQuery -Query $customQuery -Description "Custom query test"
            Write-Host ("-" * 60) -ForegroundColor Gray
        }
        
    } while ($customQuery -ne "exit")
}

Write-Host "`n🎉 Testing completed!" -ForegroundColor Green
Write-Host "You can run this script again anytime to test the search functionality." -ForegroundColor Cyan 