# Ensure tools are configured
$BaseDir = Get-Location
$ToolsDir = Join-Path $BaseDir ".tools"
$JdkPath = Join-Path $ToolsDir "jdk"
$MavenDir = Join-Path $ToolsDir "maven"

if (-not (Test-Path $JdkPath) -or -not (Test-Path $MavenDir)) {
    Write-Host "Tools not configured. Running setup first..."
    & .\setup_tools.ps1
}

# Set environment variables for compilation
$env:JAVA_HOME = $JdkPath
$env:Path = "$JdkPath\bin;$MavenDir\bin;" + $env:Path
Write-Host "Local environment configured."
Write-Host "JAVA_HOME = $env:JAVA_HOME"

# Frontend Node check
Write-Host "Setting up frontend..."
cd frontend
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing node modules..."
    npm install
}
cd $BaseDir

# Kill any existing processes bound to ports 8080 or 5173
Get-Process | Where-Object { $_.MainWindowTitle -like "*Vite*" -or $_.ProcessName -like "*java*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Start Spring Boot Backend in the background with explicit environment
Write-Host "Starting Spring Boot Backend (API port 8080)..."
$MvnCmd = Join-Path $MavenDir "bin\mvn.cmd"
$BackendScript = "`$env:JAVA_HOME = '$JdkPath'; `$env:Path = '$JdkPath\bin;$MavenDir\bin;' + `$env:Path; Set-Location '$BaseDir\backend'; & '$MvnCmd' compile spring-boot:run -DskipTests"
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $BackendScript -RedirectStandardOutput (Join-Path $BaseDir "backend_out.log") -RedirectStandardError (Join-Path $BaseDir "backend_err.log") -NoNewWindow
Write-Host "Backend API process spawned. Logs: backend_out.log / backend_err.log"

# Wait for backend to be ready on port 8080
Write-Host "Waiting for Backend to initialize on port 8080..."
$attempts = 0
while ($attempts -lt 40) {
    Start-Sleep -Seconds 1
    $conn = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        Write-Host "Backend online and listening on port 8080!"
        break
    }
    $attempts++
}

# Start Vite React Frontend
Write-Host "Starting React Frontend (Vite port 5173)..."
cd frontend
npm run dev
