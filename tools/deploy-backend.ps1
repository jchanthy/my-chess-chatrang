# deploy-backend.ps1
# Deploy the Ouk Chatrang backend to Google Cloud Run

$projectName = "ouk-chatrang-backend"
$region = "us-central1"

Write-Host "Checking gcloud authentication..." -ForegroundColor Cyan
$authCheck = gcloud auth list --format="value(account)" 2>$null
if ([string]::IsNullOrEmpty($authCheck)) {
    Write-Error "Not authenticated with gcloud. Please run 'gcloud auth login' and try again."
    exit 1
}

Write-Host "Authenticated as: $authCheck" -ForegroundColor Green

Write-Host "Deploying backend container to Google Cloud Run..." -ForegroundColor Cyan
cd backend

# Deploy using source code upload (GCP builds it using Cloud Build and deploys to Cloud Run)
gcloud run deploy $projectName `
    --source . `
    --region $region `
    --platform managed `
    --allow-unauthenticated `
    --quiet

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deployment successful!" -ForegroundColor Green
} else {
    Write-Error "Deployment failed."
    exit 1
}
