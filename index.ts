import * as chalk from "chalk";
import { MsoIssuer, MsoDeviceCodeClientMedata } from "./authentication";
import { Client } from "openid-client";
import { UserNpmConfig, ProjectNpmConfig } from "./npm-config";
import { resolve } from "path";

const AZDEVOPS_RESOURCE_ID = "499b84ac-1321-427f-aa17-267ca6975798";
const AZDEVOPS_AUTH_CLIENT_ID = "f9d5fef7-a410-4582-bb27-68a319b1e5a1";
const AZDEVOPS_AUTH_TENANT_ID = "common";

const CI_DEFAULT_ENV_VARIABLE_NAME = "TF_BUILD";

const userNpmConfig = new UserNpmConfig();

export function inCI(ciInfo: boolean | string) {
  if (!ciInfo) {
    return false;
  }

  const variableName =
    typeof ciInfo === "string" ? ciInfo : CI_DEFAULT_ENV_VARIABLE_NAME;

  if (!process.env[variableName]) {
    return false;
  }

  console.log("Skipped auth due to running in CI environment");
  return true;
}

async function run(
  clientId = AZDEVOPS_AUTH_CLIENT_ID,
  tenantId = AZDEVOPS_AUTH_TENANT_ID,
  ciInfo: boolean | string,
  projectBasePath?: string
) {
  if (inCI(ciInfo)) {
    return;
  }
  const resolvedProjectBasePath = projectBasePath ? resolve(projectBasePath) : process.cwd();

  for (const registry of getRegistries(resolvedProjectBasePath)) {
    console.log(chalk.green(`found registry ${registry}`));

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
      chalk.green(`Done! You can now install packages from ${registry} \n`)
    );
  }
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

function getRegistries(projectBasePath: string) {
  // Registries should be set on project level but fallback to user defined.
  const projectRegistries = new ProjectNpmConfig(projectBasePath).getRegistries();
  const userRegistries = userNpmConfig.getRegistries();
  const registries = (projectRegistries.length !== 0
    ? projectRegistries
    : userRegistries
  )
    // return unique list of registries
    .filter((key, index, keys) => index === keys.indexOf(key));

  if (registries.length === 0) {
    throw new Error(
      "No private registry defined in project .npmrc or user defined .npmrc."
    );
  }

  return registries;
}

export { run };
