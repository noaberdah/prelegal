$ErrorActionPreference = "Stop"

$ImageName = "prelegal:latest"
$ContainerName = "prelegal-app"
$Port = if ($env:PORT) { $env:PORT } else { "8000" }

$RootDir = Split-Path -Parent $PSScriptRoot
Set-Location $RootDir

Write-Host "Building Docker image ($ImageName)..."
docker build -t $ImageName .
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Removing any existing container..."
$existing = docker ps -a --filter "name=^$ContainerName$" --format "{{.ID}}"
if ($existing) { docker rm -f $ContainerName | Out-Null }

Write-Host "Starting container..."
docker run -d --name $ContainerName -p "${Port}:8000" $ImageName | Out-Null
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Prelegal is running at http://localhost:$Port"
