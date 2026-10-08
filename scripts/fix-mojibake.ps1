$ErrorActionPreference = 'Stop'
$path = 'src\app\globals.css'
$listPath = 'tmp\mojibake-lines.txt'

# Built from code points, never as literals: PowerShell 5.1 reads a .ps1 as ANSI
# unless it has a BOM, so any non-ASCII literal here would itself be mangled.
$emDash = [string][char]0x2014
$mojiPair = ([string][char]0x95B3) + '?'   # how an em dash (E2 80 94) lands in GBK
$replacement = [string][char]0xFFFD

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$gbk = [System.Text.Encoding]::GetEncoding(936)

$targets = @{}
foreach ($n in [System.IO.File]::ReadAllLines($listPath)) {
  if ($n.Trim()) { $targets[[int]$n] = $true }
}

$lines = [System.IO.File]::ReadAllText($path, $utf8NoBom) -split "`r`n", 0, 'SimpleMatch'

$changed = 0
$skipped = 0
foreach ($n in ($targets.Keys | Sort-Object)) {
  $i = $n - 1
  if ($i -lt 0 -or $i -ge $lines.Count) { continue }
  $line = $lines[$i]
  if ($line -notlike ('*' + $mojiPair + '*') -and $line -notmatch '[\u4E00-\u9FFF]') { $skipped++; continue }

  $candidate = $line.Replace($mojiPair, $emDash)
  # Undo the mis-decode. The corruption went through two GBK passes (an earlier
  # script read UTF-8 as GBK and wrote the result back as UTF-8), so one
  # roundtrip lands on mojibake-of-mojibake and the second lands on Chinese.
  # A third pass turns the text into "?" - it is not idempotent.
  for ($p = 0; $p -lt 2; $p++) {
    $candidate = $utf8NoBom.GetString($gbk.GetBytes($candidate))
  }
  if ($candidate.Contains($replacement)) { $skipped++; continue }
  if ($candidate -eq $line) { $skipped++; continue }
  # Recovery is only trustworthy if the result is mostly CJK/ASCII punctuation,
  # i.e. it stopped looking like random rare glyphs.
  $cjk = ([regex]::Matches($candidate, '[\u4E00-\u9FFF]')).Count
  if ($cjk -lt 2) { $skipped++; continue }

  $lines[$i] = $candidate
  $changed++
  Write-Host ("line {0}:" -f $n)
  Write-Host ("  - {0}" -f $line.Trim())
  Write-Host ("  + {0}" -f $candidate.Trim())
}

Write-Host ''
Write-Host ("repaired {0}, skipped {1}" -f $changed, $skipped)

[System.IO.File]::WriteAllText($path, ($lines -join "`r`n"), $utf8NoBom)
Write-Host ("bytes written: {0}" -f (Get-Item $path).Length)


