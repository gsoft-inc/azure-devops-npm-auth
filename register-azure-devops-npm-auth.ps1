<#
  .SYNOPSIS
  Register azure-devops-npm-auth tool as an app in Azure AD and grants it admin consent

  .DESCRIPTION
  In practice, in order to use azure-devops-npm-auth tool to authenticate to an Azure artifacts private npm feed
  you likely need admin consent granted to it so that it has the permissions to work on behalf of you the developer.
  For that to happen (in a reliable way), the tool should be registered as an app in your Azure AD tenant that
  is connected to the Azure devops organisation/project that hosts Azure Artifacts. This script does that.

  Specifically the script:
  * creates an Azure AD App registration and associated service principal
  * grants admin consent to the azure-devops-npm-auth tool the following permissions:
    - Microsoft Graph > User.Read
    - Azure Devops > user_impersonation

  Permissions to run this script: Azure AD 'Global administrator' RBAC role
  Tools required to run this script: azure-cli (see https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)

  For more information see https://www.npmjs.com/package/azure-devops-npm-auth

  .EXAMPLE
  ./register-azure-devops-npm-auth.ps1 -Login -InfA Continue

  Description
  -----------
  Trigger an interactive login, printing the INFO level log messages to the console

#>


[CmdletBinding()]
param(
    [switch] $Login
)
begin {
    Set-StrictMode -Version 'Latest'
    $callerEA = $ErrorActionPreference
    $ErrorActionPreference = 'Stop'

    function Invoke-Exe {
        param(
            [Parameter(Mandatory)]
            [ScriptBlock] $ScriptBlock
        )
        Write-Verbose "Executing: $ScriptBlock"
        Invoke-Command $ScriptBlock
        if ($LASTEXITCODE -ne 0) {
            throw "Command failed with exit code $LASTEXITCODE; Cmd: $ScriptBlock"
        }
    }

}
process {
    try {

        if ($Login) {
            Write-Information 'Connecting to Azure AD Account...'
            Invoke-Exe { az login } | Out-Null
        }

        # -------------- Gather information --------------
        $appName = 'azure-devops-npm-auth'

        $tenantId = Invoke-Exe { az account show } | ConvertFrom-Json | Select-Object -ExpandProperty tenantId
        $msGraphAppId = '00000003-0000-0000-c000-000000000000'
        $msUserReadScopeId = 'e1fe6dd8-ba31-4d61-89e7-88639da4683d'

        $azureDevopsAppId = '499b84ac-1321-427f-aa17-267ca6975798'
        $azureDevopsUserImpersonateScopeId = 'ee69721e-6c3a-468f-a9ec-302d16a4c599'


        # -------------- Create AD App registration --------------
        $requiredResourceAccessJson = @(
            # Azure Devops > user_impersonation
            @{
                resourceAppId   =    $azureDevopsAppId
                resourceAccess  =    @(
                    @{
                        id      =   $azureDevopsUserImpersonateScopeId
                        type    =   'Scope'
                    }
                )
            }
            @{
                resourceAppId   =   $msGraphAppId
                resourceAccess  =   @(
                    @{
                        id      =   $msUserReadScopeId
                        type    =   'Scope'
                    }
                )
            }
        ) | ConvertTo-Json -Depth 100 -Compress | ConvertTo-Json
        Write-Information "Create AD App registration '$appName'..."
        $app = Invoke-Exe {
            az ad app create --display-name $appName --native-app --required-resource-accesses $requiredResourceAccessJson --oauth2-allow-implicit-flow $false
        } | ConvertFrom-Json

        Write-Information "Update AD App registration '$appName' to remove unrequired scopes..."
        # disable default scope added by `az ad app create` - need to do this before you can delete a scope
        $app.oauth2Permissions[0].isEnabled = 'false'
        $disabledScopesJson = $app.oauth2Permissions | ConvertTo-Json -Compress -Depth 100 -AsArray | ConvertTo-Json
        Write-Information "  Disable scopes exposed by '$appName'..."
        Invoke-Exe { az ad app update --id $app.appId --set oauth2Permissions=$disabledScopesJson } | Out-Null
        Write-Information "  Delete scopes exposed by '$appName'..."
        Invoke-Exe { az ad app update --id $app.appId --set oauth2Permissions='[]' } | Out-Null


        # -------------- Create Service Principal associated with app registration --------------
        Write-Information "Create Service Principal for App registration '$appName'..."
        $sp = Invoke-Exe {
            az ad sp create --id $app.appId
        } | ConvertFrom-Json


        # -------------- Grant admin consent --------------
        $wait = 20
        Write-Verbose "Waiting for $wait seconds before granting the permissions to new service principal..."
        Start-Sleep -Seconds $wait

        Write-Information "Grant admin consent to API permissions that will be requested by '$appName'..."
        Invoke-Exe {
            az ad app permission admin-consent --id $sp.appId
        } | Out-Null


        Write-Host '******************* Summary: start ******************************'
        Write-Host "App/Client ID: $($app.appId)"
        Write-Host "AD Tenant ID: $tenantId"
        Write-Host ("To authenticate to Azure npm feed: azure-devops-npm-auth --client_id={0} --tenant_id={1}" -f $app.appId, $tenantId) -ForegroundColor Yellow
        Write-Host '******************* Summary: end ********************************'

    }
    catch {
        Write-Error "$_`n$($_.ScriptStackTrace)" -EA $callerEA
    }
}
