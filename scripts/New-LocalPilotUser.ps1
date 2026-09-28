param(
 [Parameter(Mandatory=$true)][string]$Email,
 [Parameter(Mandatory=$true)][ValidateSet('COORDINATOR','BIENNIAL_DIRECTOR','HIP','TECHNICAL')][string]$Role
)
$ErrorActionPreference = 'Stop'
$pilotStatus = npx supabase status -o json 2>$null | ConvertFrom-Json
if ($pilotStatus.API_URL -ne 'http://127.0.0.1:55321') { throw 'This helper only provisions the local SADUMAHA stack.' }
$securePassword = Read-Host 'Password for this local pilot account' -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
 $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
 $payload = @{ email=$Email; password=$plainPassword; email_confirm=$true } | ConvertTo-Json
 $headers = @{ apikey=$pilotStatus.SERVICE_ROLE_KEY; Authorization="Bearer $($pilotStatus.SERVICE_ROLE_KEY)" }
 try { $account = Invoke-RestMethod -Uri "$($pilotStatus.API_URL)/auth/v1/admin/users" -Method Post -Headers $headers -ContentType 'application/json' -Body $payload } catch { throw 'Local account creation failed. Check whether that email already exists in Studio.' }
 $userId = ([guid]$account.id).ToString()
 "insert into public.sadu_pilot_members(user_id,role) values ('$userId','$Role');" | docker exec -i supabase_db_SADUMAHA-main psql -U postgres -d postgres -v ON_ERROR_STOP=1 | Out-Null
 if ($LASTEXITCODE -ne 0) { throw 'Account exists, but role assignment failed. Review local Studio.' }
 Write-Output "Created local pilot account for $Email with role $Role."
} finally {
 [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
 $plainPassword=$null; $payload=$null; $headers=$null
}
