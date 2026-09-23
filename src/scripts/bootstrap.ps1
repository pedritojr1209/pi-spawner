<#
.SYNOPSIS
Bootstrap script for external CLIs (kilo, agy, opencode).
Reads input.json, executes the CLI, and writes result.json atomically via tmp rename.
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$TaskId,

    [Parameter(Mandatory = $true)]
    [string]$TaskDir,

    [Parameter(Mandatory = $true)]
    [string]$Command
)

$ErrorActionPreference = 'Stop'
$inputPath = Join-Path $TaskDir 'input.json'
$tmpResultPath = Join-Path $TaskDir 'result.json.tmp'
$finalResultPath = Join-Path $TaskDir 'result.json'

if (-not (Test-Path $inputPath)) {
    $result = @{
        taskId    = $TaskId
        exitCode  = 1
        summary   = "Bootstrap failed: input.json not found at $inputPath"
        modifiedFiles = @()
        completedAt = (Get-Date -Format "o")
        error     = "Input file missing"
    }
    $result | ConvertTo-Json -Depth 5 | Out-File -FilePath $tmpResultPath -Encoding utf8NoBOM
    Move-Item -Path $tmpResultPath -Destination $finalResultPath -Force
    exit 1
}

$inputContent = Get-Content $inputPath -Raw | ConvertFrom-Json
$prompt = $inputContent.task

$startTime = Get-Date
$process = Start-Process -FilePath $Command -ArgumentList $prompt -NoNewWindow -Wait -PassThru -RedirectStandardOutput "$TaskDir\stdout.log" -RedirectStandardError "$TaskDir\stderr.log"
$exitCode = $process.ExitCode
$completedAt = Get-Date -Format "o"

$gitStatus = git -C $TaskDir status --porcelain 2>$null
$modifiedFiles = @()
if ($LASTEXITCODE -eq 0 -and $gitStatus) {
    $modifiedFiles = $gitStatus -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
}

$summary = "CLI exited with code $exitCode"
if ($exitCode -eq 0) {
    $summary = "Task completed successfully"
}

$result = @{
    taskId       = $TaskId
    exitCode     = $exitCode
    summary      = $summary
    modifiedFiles = $modifiedFiles
    completedAt  = $completedAt
}

if ($exitCode -ne 0) {
    $errorContent = Get-Content "$TaskDir\stderr.log" -Raw -ErrorAction SilentlyContinue
    $result.error = if ($errorContent) { $errorContent.Trim() } else { "Process exited with code $exitCode" }
}

$result | ConvertTo-Json -Depth 5 | Out-File -FilePath $tmpResultPath -Encoding utf8NoBOM
Move-Item -Path $tmpResultPath -Destination $finalResultPath -Force

exit $exitCode
