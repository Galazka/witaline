param([string]$Ak, [string]$Tunnel, [string]$Aid)

$body = @{
  conversation_config = @{
    webhook_overrides = @{
      client_data_url = "$Tunnel/api/elevenlabs/client-data"
      call_completed_url = "$Tunnel/api/elevenlabs/call-completed"
    }
  }
} | ConvertTo-Json -Depth 10 -Compress

try {
  $r = Invoke-RestMethod -Uri "https://api.elevenlabs.io/v1/convai/agents/$Aid" -Method Patch -Headers @{"xi-api-key"=$Ak;"Content-Type"="application/json"} -Body $body -ErrorAction Stop
  Write-Host "PATCH OK"
} catch {
  Write-Host "PATCH failed: $($_.Exception.Message)"
  exit 1
}

# Verify
try {
  $v = Invoke-RestMethod -Uri "https://api.elevenlabs.io/v1/convai/agents/$Aid" -Method Get -Headers @{"xi-api-key"=$Ak} -ErrorAction Stop
  $wo = $v.conversation_config.webhook_overrides
  Write-Host "Verified: $($wo | ConvertTo-Json -Compress)"
  if ($wo.client_data_url -eq "$Tunnel/api/elevenlabs/client-data") {
    Write-Host "SUKCES - webhooki zapisane!"
  } else {
    Write-Host "NIE UDAŁO SIĘ - webhooki nie zostały zapisane mimo PATCH 200"
  }
} catch {
  Write-Host "Verify failed: $($_.Exception.Message)"
}