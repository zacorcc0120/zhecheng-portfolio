# Rebuild + restart the production preview + (optionally) run an action set.
# Every change to the shader or the geometry needs this whole cycle, so it is
# worth having in one place instead of retyping it.
#
# NOTE: no non-ASCII literals in this file on purpose. PowerShell 5.1 reads a
# BOM-less .ps1 as ANSI, so any CJK comment -- or the CJK in this project's own
# path -- turns into mojibake, and the failure surfaces as a syntax error or an
# ENOENT on a path that visibly exists. The root is derived, never written out.
param(
  [string]$Actions = "",
  [string]$ShotDir = "",
  [string]$Size = "1440x900",
  [switch]$Reduce
)
$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$held = Get-NetTCPConnection -LocalPort 3100 -State Listen -ErrorAction SilentlyContinue
if ($held) {
  Stop-Process -Id $held.OwningProcess -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 2
}

$build = npm.cmd run build 2>&1
if ($LASTEXITCODE -ne 0) {
  $build | Select-String -Pattern "error|Error|Failed" | Select-Object -First 30
  Write-Output "BUILD FAILED"
  exit 1
}
Write-Output "build ok"

Start-Process cmd.exe -ArgumentList "/c", "cd /d `"$root`" && npx.cmd next start -p 3100 > prod.log 2>&1" -WindowStyle Hidden
Start-Sleep -Seconds 7
$pid3100 = (Get-NetTCPConnection -LocalPort 3100 -State Listen -ErrorAction SilentlyContinue).OwningProcess
if (-not $pid3100) { Write-Output "PREVIEW DID NOT START"; Get-Content prod.log -Tail 20; exit 1 }
Write-Output "prod pid=$pid3100"

if ($Actions) {
  if ($Reduce) { $env:REDUCE = "1" } else { Remove-Item Env:\REDUCE -ErrorAction SilentlyContinue }
  if (-not $ShotDir) { $ShotDir = "shots/iter" }
  node scripts/act.mjs http://127.0.0.1:3100/ $ShotDir $Size --file $Actions
}
