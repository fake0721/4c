param(
  [Parameter(Mandatory = $true)]
  [string]$DocxPath,

  [string]$OutputJsonPath,

  [string]$OutputSqlPath,

  [string]$ImportBatch = "",

  [switch]$SummaryOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-NormalizedSegment {
  param(
    [AllowNull()]
    [string]$Value
  )

  $raw = if ([string]::IsNullOrWhiteSpace($Value)) { "" } else { $Value.Trim().ToLowerInvariant() }
  if (-not $raw) { return "" }

  $normalized = [System.Text.RegularExpressions.Regex]::Replace($raw, "[^a-z0-9\u4e00-\u9fa5]+", "_")
  $normalized = [System.Text.RegularExpressions.Regex]::Replace($normalized, "_+", "_").Trim("_")
  if ($normalized.Length -gt 120) { return $normalized.Substring(0, 120) }
  return $normalized
}

function Convert-ToBoolean {
  param(
    [AllowNull()]
    [string]$Value
  )

  $raw = if ([string]::IsNullOrWhiteSpace($Value)) { "" } else { $Value.Trim().ToLowerInvariant() }
  return @("true", "1", "yes", "y", "是") -contains $raw
}

function Get-MappedSourceType {
  param([hashtable]$Entry)

  $text = (@($Entry.title, $Entry.keywords, $Entry.log_excerpt, $Entry.root_cause, $Entry.solution) -join " ").ToLowerInvariant()
  if ($text -match "nginx|apache|http|waf|upstream|webshell|tomcat|iis") { return "nginx" }
  if ($text -match "postgres|postgresql|mysql|oracle|sql|redis|mongodb") { return "postgres" }
  if ($text -match "spring|django|flask|java|node|node\.js|python|application|velocity|template") { return "application" }
  if ($text -match "ssh|sshd|rdp|smb|ftp|windows|linux|system|kernel|powershell|cmd|sudo|cron|service") { return "system" }
  return "custom"
}

function Get-MappedErrorType {
  param([hashtable]$Entry)

  $rawErrorType = [string]($Entry.raw_error_type)
  $rawSubType = [string]($Entry.raw_sub_type)
  $text = (@($Entry.title, $Entry.keywords, $Entry.log_excerpt, $Entry.root_cause, $Entry.solution, $rawErrorType, $rawSubType) -join " ").ToLowerInvariant()

  if ($text -match "timeout|timed out|read timeout|connect timeout|gateway timeout") { return @{ error_type = "timeout"; confidence = "high" } }
  if ($rawErrorType -match "数据库异常|数据库攻击") { return @{ error_type = "database_error"; confidence = "high" } }
  if ($rawErrorType -match "网络异常|网络攻击|侦察探测|信息收集") { return @{ error_type = "network_error"; confidence = "high" } }
  if ($rawErrorType -match "权限提升|凭据访问") { return @{ error_type = "permission_error"; confidence = "high" } }
  if ($rawErrorType -match "系统异常|Windows异常|应用异常|Web服务异常") { return @{ error_type = "service_error"; confidence = "high" } }
  if ($text -match "config|configuration|yaml|json|env|registry|policy|sudoers|组策略") { return @{ error_type = "configuration_error"; confidence = "medium" } }
  if ($text -match "oom|out of memory|disk full|no space left|open files|resource|quota|cpu") { return @{ error_type = "resource_exhaustion"; confidence = "medium" } }
  if ($text -match "permission|forbidden|unauthorized|access denied|password|token|credential|sudo|root|认证|权限|提权|凭据") { return @{ error_type = "permission_error"; confidence = "medium" } }
  if ($text -match "database|sql|mysql|postgres|oracle|injection|注入") { return @{ error_type = "database_error"; confidence = "medium" } }
  if ($text -match "dns|port|icmp|connection|socket|ssh|rdp|ftp|smb|web|http|scan|exploit|payload|网络") { return @{ error_type = "network_error"; confidence = "medium" } }
  if ($text -match "service|daemon|process|backdoor|木马|远控|恶意程序|webshell|crash|segmentation|panic") { return @{ error_type = "service_error"; confidence = "medium" } }
  return @{ error_type = "unknown_error"; confidence = "low" }
}

function Get-ClusterKey {
  param([hashtable]$Entry)

  $segments = @(
    "security_candidate",
    (Get-NormalizedSegment $Entry.title),
    (Get-NormalizedSegment $Entry.raw_error_type),
    (Get-NormalizedSegment $Entry.raw_sub_type)
  ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }

  return ($segments -join "::")
}

function Get-DocxParagraphs {
  param([string]$Path)

  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $zip = [System.IO.Compression.ZipFile]::OpenRead($Path)

  try {
    $entry = $zip.Entries | Where-Object { $_.FullName -eq "word/document.xml" }
    if (-not $entry) { throw "word/document.xml not found." }

    $reader = New-Object System.IO.StreamReader($entry.Open())
    try { [xml]$xml = $reader.ReadToEnd() }
    finally { $reader.Close() }

    $ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
    $ns.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")

    return $xml.SelectNodes("//w:body/w:p", $ns) | ForEach-Object {
      $parts = $_.SelectNodes(".//w:t", $ns) | ForEach-Object { $_.'#text' }
      ($parts -join "").Trim()
    }
  }
  finally { $zip.Dispose() }
}

function Convert-ParsedEntry {
  param(
    [hashtable]$Entry,
    [string]$DocName,
    [string]$BatchName
  )

  if (-not $Entry.ContainsKey("title")) { return $null }

  $raw = @{
    title = [string]($Entry["title"])
    raw_error_type = [string]($Entry["error_type"])
    raw_sub_type = [string]($Entry["sub_type"])
    keywords = [string]($Entry["keywords"])
    log_excerpt = [string]($Entry["log_excerpt"])
    root_cause = [string]($Entry["root_cause"])
    solution = [string]($Entry["solution"])
    raw_severity = [string]($Entry["severity"])
    raw_source_type = [string]($Entry["source_type"])
    verified = Convert-ToBoolean ([string]($Entry["verified"]))
    updated_at = [string]($Entry["updated_at"])
  }

  $mappedError = Get-MappedErrorType $raw
  $mappedSourceType = Get-MappedSourceType $raw

  return [pscustomobject][ordered]@{
    title = $raw.title
    raw_error_type = $raw.raw_error_type
    raw_sub_type = $raw.raw_sub_type
    keywords = $raw.keywords
    log_excerpt = $raw.log_excerpt
    root_cause = $raw.root_cause
    solution = $raw.solution
    raw_severity = $raw.raw_severity
    raw_source_type = $raw.raw_source_type
    verified = $raw.verified
    updated_at = $(if ($raw.updated_at) { $raw.updated_at } else { (Get-Date).ToString("yyyy-MM-dd") })
    mapped_error_type = $mappedError.error_type
    mapped_source_type = $mappedSourceType
    mapping_confidence = $mappedError.confidence
    target_knowledge_layer = "security_candidate"
    promotion_status = "staged"
    promotion_notes = $null
    import_source = $DocName
    import_batch = $BatchName
    cluster_key = Get-ClusterKey $raw
  }
}

function Parse-Entries {
  param(
    [string[]]$Paragraphs,
    [string]$DocName,
    [string]$BatchName
  )

  $entries = New-Object System.Collections.Generic.List[object]
  $current = @{}
  $currentKey = $null

  foreach ($paragraph in $Paragraphs) {
    if ([string]::IsNullOrWhiteSpace($paragraph)) { continue }
    $line = $paragraph.Trim()
    if ($line -eq "---") { continue }
    if ($line -match "^[一二三四五六七八九十]+、") { continue }

    if ($line -match "^([A-Za-z_]+)\s*[:：]\s*(.*)$") {
      $key = $matches[1].Trim().ToLowerInvariant()
      $value = $matches[2].Trim()

      if ($key -eq "title" -and $current.ContainsKey("title")) {
        $converted = Convert-ParsedEntry -Entry $current -DocName $DocName -BatchName $BatchName
        if ($null -ne $converted) { $entries.Add($converted) }
        $current = @{}
      }

      $current[$key] = $value
      $currentKey = $key
      continue
    }

    if ($currentKey) {
      $current[$currentKey] = ("{0} {1}" -f $current[$currentKey], $line).Trim()
    }
  }

  if ($current.ContainsKey("title")) {
    $converted = Convert-ParsedEntry -Entry $current -DocName $DocName -BatchName $BatchName
    if ($null -ne $converted) { $entries.Add($converted) }
  }

  return $entries
}

function Escape-SqlLiteral {
  param([AllowNull()][object]$Value)
  if ($null -eq $Value) { return "null" }
  if ($Value -is [bool]) { return $(if ($Value) { "true" } else { "false" }) }
  return "'" + ([string]$Value).Replace("'", "''") + "'"
}

if (-not (Test-Path -LiteralPath $DocxPath)) { throw "DOCX file not found: $DocxPath" }

$docName = [System.IO.Path]::GetFileName($DocxPath)
$batchName = if ($ImportBatch) { $ImportBatch } else { "security_docx_" + (Get-Date -Format "yyyyMMdd") }
$paragraphs = @(Get-DocxParagraphs -Path $DocxPath)
$entries = @(Parse-Entries -Paragraphs $paragraphs -DocName $docName -BatchName $batchName)

$summary = [ordered]@{
  file = $DocxPath
  total_entries = $entries.Count
  raw_error_types = @($entries | Group-Object raw_error_type | Sort-Object Count -Descending | ForEach-Object { [ordered]@{ name = $_.Name; count = $_.Count } })
  mapped_error_types = @($entries | Group-Object mapped_error_type | Sort-Object Count -Descending | ForEach-Object { [ordered]@{ name = $_.Name; count = $_.Count } })
  mapped_source_types = @($entries | Group-Object mapped_source_type | Sort-Object Count -Descending | ForEach-Object { [ordered]@{ name = $_.Name; count = $_.Count } })
}

if ($OutputJsonPath) {
  $jsonDir = Split-Path -Parent $OutputJsonPath
  if ($jsonDir) { New-Item -ItemType Directory -Force -Path $jsonDir | Out-Null }
  $entries | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $OutputJsonPath -Encoding UTF8
}

if ($OutputSqlPath) {
  $sqlDir = Split-Path -Parent $OutputSqlPath
  if ($sqlDir) { New-Item -ItemType Directory -Force -Path $sqlDir | Out-Null }

  $rows = foreach ($entry in $entries) {
    "(" + (@(
      (Escape-SqlLiteral $entry.title),
      (Escape-SqlLiteral $entry.raw_error_type),
      (Escape-SqlLiteral $entry.raw_sub_type),
      (Escape-SqlLiteral $entry.keywords),
      (Escape-SqlLiteral $entry.log_excerpt),
      (Escape-SqlLiteral $entry.root_cause),
      (Escape-SqlLiteral $entry.solution),
      (Escape-SqlLiteral $entry.raw_severity),
      (Escape-SqlLiteral $entry.raw_source_type),
      (Escape-SqlLiteral $entry.verified),
      (Escape-SqlLiteral $entry.updated_at),
      (Escape-SqlLiteral $entry.mapped_error_type),
      (Escape-SqlLiteral $entry.mapped_source_type),
      (Escape-SqlLiteral $entry.mapping_confidence),
      (Escape-SqlLiteral $entry.target_knowledge_layer),
      (Escape-SqlLiteral $entry.promotion_status),
      (Escape-SqlLiteral $entry.promotion_notes),
      (Escape-SqlLiteral $entry.import_source),
      (Escape-SqlLiteral $entry.import_batch),
      (Escape-SqlLiteral $entry.cluster_key)
    ) -join ", ") + ")"
  }

  $sql = @(
    "insert into public.security_knowledge_candidates (",
    "  title,",
    "  raw_error_type,",
    "  raw_sub_type,",
    "  keywords,",
    "  log_excerpt,",
    "  root_cause,",
    "  solution,",
    "  raw_severity,",
    "  raw_source_type,",
    "  verified,",
    "  updated_at,",
    "  mapped_error_type,",
    "  mapped_source_type,",
    "  mapping_confidence,",
    "  target_knowledge_layer,",
    "  promotion_status,",
    "  promotion_notes,",
    "  import_source,",
    "  import_batch,",
    "  cluster_key",
    ")",
    "values",
    ($rows -join ",`n"),
    "on conflict (cluster_key) do update set",
    "  raw_error_type = excluded.raw_error_type,",
    "  raw_sub_type = excluded.raw_sub_type,",
    "  keywords = excluded.keywords,",
    "  log_excerpt = excluded.log_excerpt,",
    "  root_cause = excluded.root_cause,",
    "  solution = excluded.solution,",
    "  raw_severity = excluded.raw_severity,",
    "  raw_source_type = excluded.raw_source_type,",
    "  verified = excluded.verified,",
    "  updated_at = excluded.updated_at,",
    "  mapped_error_type = excluded.mapped_error_type,",
    "  mapped_source_type = excluded.mapped_source_type,",
    "  mapping_confidence = excluded.mapping_confidence,",
    "  target_knowledge_layer = excluded.target_knowledge_layer,",
    "  promotion_status = excluded.promotion_status,",
    "  promotion_notes = excluded.promotion_notes,",
    "  import_source = excluded.import_source,",
    "  import_batch = excluded.import_batch;"
  ) -join "`n"

  Set-Content -LiteralPath $OutputSqlPath -Value $sql -Encoding UTF8
}

if ($SummaryOnly) {
  $summary | ConvertTo-Json -Depth 5
}
else {
  [ordered]@{ summary = $summary; preview = @($entries | Select-Object -First 5) } | ConvertTo-Json -Depth 6
}
