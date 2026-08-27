# Create tools directory if it doesn't exist
$ToolsDir = Join-Path (Get-Location) ".tools"
if (-not (Test-Path $ToolsDir)) {
    New-Item -ItemType Directory -Path $ToolsDir | Out-Null
}

# Portable JDK 17
$JdkDir = Join-Path $ToolsDir "jdk"
if (-not (Test-Path $JdkDir)) {
    Write-Host "Fetching portable JDK 17 (Temurin)..."
    $JdkUrl = "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.10%2B7/OpenJDK17U-jdk_x64_windows_hotspot_17.0.10_7.zip"
    $JdkZip = Join-Path $ToolsDir "jdk.zip"
    Invoke-WebRequest -Uri $JdkUrl -OutFile $JdkZip
    
    Write-Host "Extracting JDK..."
    Expand-Archive -Path $JdkZip -DestinationPath $ToolsDir
    
    # Move out of root folder inside zip
    $ExtractedFolder = Get-ChildItem -Path $ToolsDir -Directory | Where-Object { $_.Name -like "jdk-17*" } | Select-Object -First 1
    Move-Item -Path $ExtractedFolder.FullName -Destination $JdkDir
    Remove-Item $JdkZip -Force
    Write-Host "JDK 17 setup complete."
} else {
    Write-Host "JDK 17 already configured."
}

# Portable Maven 3.9.6
$MavenDir = Join-Path $ToolsDir "maven"
if (-not (Test-Path $MavenDir)) {
    Write-Host "Fetching portable Maven 3.9.6..."
    $MvnUrl = "https://archive.apache.org/dist/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.zip"
    $MvnZip = Join-Path $ToolsDir "maven.zip"
    Invoke-WebRequest -Uri $MvnUrl -OutFile $MvnZip
    
    Write-Host "Extracting Maven..."
    Expand-Archive -Path $MvnZip -DestinationPath $ToolsDir
    
    $ExtractedFolder = Get-ChildItem -Path $ToolsDir -Directory | Where-Object { $_.Name -like "apache-maven*" } | Select-Object -First 1
    Move-Item -Path $ExtractedFolder.FullName -Destination $MavenDir
    Remove-Item $MvnZip -Force
    Write-Host "Maven setup complete."
} else {
    Write-Host "Maven already configured."
}

Write-Host "Local environment tools configured successfully."
