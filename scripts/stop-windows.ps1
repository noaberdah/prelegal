$ErrorActionPreference = "Continue"

$ContainerName = "prelegal-app"

Write-Host "Stopping $ContainerName..."
docker rm -f $ContainerName 2>$null | Out-Null
Write-Host "Stopped."
