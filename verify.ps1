$BaseDir = Get-Location
$ToolsDir = Join-Path $BaseDir ".tools"
$JdkPath = Join-Path $ToolsDir "jdk"
$MvnPath = Join-Path $ToolsDir "maven"

$env:JAVA_HOME = $JdkPath
$env:Path = "$JdkPath\bin;$MvnPath\bin;" + $env:Path

Write-Host "Compiling RaceSync Backend..."
cd backend
mvn clean compile
