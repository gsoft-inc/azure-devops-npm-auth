const chalk = require('chalk');
const { Issuer } = require("openid-client");
const { UserNpmConfig, ProjectNpmConfig } = require("./npm-config");

const AZDEVOPS_RESOURCE_ID = "499b84ac-1321-427f-aa17-267ca6975798";
const AZDEVOPS_AUTH_CLIENT_ID = "f9d5fef7-a410-4582-bb27-68a319b1e5a1";

const home = require("os").homedir();
const args = require("minimist")(process.argv.slice(2), {
  alias: {
    cid: "client_id",
    tid: "tenant_id"
  }
});

// Default values
const tenantId = args.tenant_id || "common";
const clientId = args.client_id || AZDEVOPS_AUTH_CLIENT_ID;

const userNpmConfig = new UserNpmConfig();
const projectNpmConfig = new ProjectNpmConfig();

async function start() {

    const registry = getRegistry();
    console.log(chalk.green(`found registry ${registry}.`));
  
    const issuer = new Issuer({
      token_endpoint: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      device_authorization_endpoint: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/devicecode`
    });
  
    const client = new issuer.Client({
      client_id: clientId,
      response_types: ["code"],
      token_endpoint_auth_method: "none"
    });
  
    let tokenSet;
    const refreshToken = userNpmConfig.getRegistryRefreshToken(registry);
    if (refreshToken) {
      try {
        console.log("Trying to use refresh token...");
        tokenSet = await client.refresh(refreshToken);
      } catch (exception) {
        switch (exception.error) {
          case 'invalid_grant':
            console.log(chalk.yellow('Refresh token is invalid or expired.'));
            tokenSet = await startDeviceCodeAuthentication(client);
            break;
          case 'interaction_required':
            console.log(chalk.yellow('Interaction required.'));
            tokenSet = await startDeviceCodeAuthentication(client);
            break;
          default:
            throw exception;
        }
      }
  
    } else {
      tokenSet = await startDeviceCodeAuthentication(client);
    }
  
    updateNpmConfig(registry, tokenSet);
  
    console.log(chalk.green(`Done! You can now install packages from ${registry}.`));
}

async function startDeviceCodeAuthentication(client) {
  console.log(chalk.green('launching device code authentication...'));
  const handle = await client.deviceAuthorization({
    scope: `${AZDEVOPS_RESOURCE_ID}/.default offline_access`
  });
  
  console.log(`To sign in, use a web browser to open the page ${handle.verification_uri} and enter the code ${handle.user_code} to authenticate.`)
  return await handle.poll();
}

function updateNpmConfig(registry, tokenSet) {
  userNpmConfig.setRegistryAuthToken(registry, tokenSet.access_token);
  userNpmConfig.setRegistryRefreshToken(registry, tokenSet.refresh_token);
}

function getRegistry() {
      // Registry should be set on project level but fallback to user defined.`
      const registry = projectNpmConfig.getRegistry() || userNpmConfig.getRegistry();
      if (!registry) {
        throw new Error(
          "No private registry defined in project .npmrc or user defined .npmrc."
        );
      }

      return registry;
}

module.exports = start