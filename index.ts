import * as chalk from "chalk";
import { MsoIssuer, MsoDeviceCodeClientMedata } from "./authentication";
import { Client } from "openid-client";
import { UserNpmConfig, ProjectNpmConfig } from "./npm-config";

const AZDEVOPS_RESOURCE_ID = "499b84ac-1321-427f-aa17-267ca6975798";

const userNpmConfig = new UserNpmConfig();
const projectNpmConfig = new ProjectNpmConfig();

async function run(clientId: string, tenantId: string) {
  const registry = getRegistry();
  console.log(chalk.green(`found registry ${registry}.`));

  const issuer = await MsoIssuer.discover(tenantId);
  const client = new issuer.Client(new MsoDeviceCodeClientMedata(clientId));

  let tokenSet;
  const refreshToken = userNpmConfig.getRegistryRefreshToken(registry);
  if (refreshToken) {
    try {
      console.log("Trying to use refresh token...");
      tokenSet = await client.refresh(refreshToken);
    } catch (exception) {
      switch (exception.error) {
        case "invalid_grant":
          console.log(chalk.yellow("Refresh token is invalid or expired."));
          tokenSet = await startDeviceCodeFlow(client);
          break;
        case "interaction_required":
          console.log(chalk.yellow("Interaction required."));
          tokenSet = await startDeviceCodeFlow(client);
          break;
        default:
          throw exception;
      }
    }
  } else {
    tokenSet = await startDeviceCodeFlow(client);
  }

  // Update user npm config with tokens
  userNpmConfig.setRegistryAuthToken(registry, tokenSet.access_token);
  userNpmConfig.setRegistryRefreshToken(registry, tokenSet.refresh_token);

  console.log(
    chalk.green(`Done! You can now install packages from ${registry}.`)
  );
}

async function startDeviceCodeFlow(client: Client) {
  console.log(chalk.green("launching device code authentication..."));

  // Make sure to include 'offline_access' scope to receive refresh token.
  const handle = await client.deviceAuthorization({
    scope: `${AZDEVOPS_RESOURCE_ID}/.default offline_access`
  });

  console.log(
    `To sign in, use a web browser to open the page ${handle.verification_uri} and enter the code ${handle.user_code} to authenticate.`
  );
  return await handle.poll();
}

function getRegistry() {
  // Registry should be set on project level but fallback to user defined.`
  const registry =
    projectNpmConfig.getRegistry() || userNpmConfig.getRegistry();
  if (!registry) {
    throw new Error(
      "No private registry defined in project .npmrc or user defined .npmrc."
    );
  }

  return registry;
};

export { run }
