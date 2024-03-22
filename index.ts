import * as chalk from "chalk";
import { MsoIssuer, MsoDeviceCodeClientMedata } from "./authentication";
import { custom, Client } from "openid-client";
import { UserNpmConfig, ProjectNpmConfig } from "./npm-config";
import { UserYarnConfig, ProjectYarnConfig } from "./yarn-config";
import { resolve } from "path";
import * as fs from 'fs';
import * as path from 'path';

const AZDEVOPS_RESOURCE_ID = "499b84ac-1321-427f-aa17-267ca6975798";
const AZDEVOPS_AUTH_CLIENT_ID = "f9d5fef7-a410-4582-bb27-68a319b1e5a1";
const AZDEVOPS_AUTH_TENANT_ID = "common";

const CI_DEFAULT_ENV_VARIABLE_NAME = "TF_BUILD";

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
  projectBasePath?: string,
  resourceId = AZDEVOPS_RESOURCE_ID
) {
  if (inCI(ciInfo)) {
    return;
  }
  const resolvedProjectBasePath = projectBasePath ? resolve(projectBasePath) : process.cwd();
  const isProjectUsingYarnv2 = fs.existsSync(path.join(resolvedProjectBasePath, ".yarnrc.yml"));

  const userConfig = !isProjectUsingYarnv2 ? new UserNpmConfig() : new UserYarnConfig();
  const projectConfig = !isProjectUsingYarnv2 ? new ProjectNpmConfig(resolvedProjectBasePath) : new ProjectYarnConfig(resolvedProjectBasePath);

  for (const registry of getRegistries(userConfig, projectConfig)) {
    console.log(chalk.green(`Found registry ${registry}`));

    const issuer = await MsoIssuer.discover(tenantId);
    const client = new issuer.Client(new MsoDeviceCodeClientMedata(clientId));

    // Set timeout to 5s to workaround issue #18
    // https://github.com/gsoft-inc/azure-devops-npm-auth/issues/18
    client[custom.http_options] = function (options) {
      options.timeout = 5000;
      return options;
    }

    let tokenSet;
    const refreshToken = userConfig.getRegistryRefreshToken(registry);
    if (refreshToken) {
      try {
        console.log("Trying to use refresh token...");
        tokenSet = await client.refresh(refreshToken);
      } catch (exception) {
        switch (exception.error) {
          case "invalid_grant":
            console.log(chalk.yellow("Refresh token is invalid or expired."));
            tokenSet = await startDeviceCodeFlow(client, resourceId);
            break;
          case "interaction_required":
            console.log(chalk.yellow("Interaction required."));
            tokenSet = await startDeviceCodeFlow(client, resourceId);
            break;
          default:
            throw exception;
        }
      }
    } else {
      tokenSet = await startDeviceCodeFlow(client, resourceId);
    }

    // Update user npm config with tokens
    userConfig.setRegistryAuthToken(registry, tokenSet.access_token);
    userConfig.setRegistryRefreshToken(registry, tokenSet.refresh_token);

    console.log(
      chalk.green(`Done! You can now install packages from ${registry} \n`)
    );
  }
}

async function startDeviceCodeFlow(client: Client, resourceId: string) {
  console.log(chalk.green("Launching device code authentication..."));

  // Make sure to include 'offline_access' scope to receive refresh token.
  const handle = await client.deviceAuthorization({
    scope: `${resourceId}/.default offline_access`
  });

  console.log(
    `To sign in, use a web browser to open the page ${handle.verification_uri} and enter the code ${handle.user_code} to authenticate.`
  );
  return await handle.poll();
}

function getRegistries(userConfig: UserNpmConfig | UserYarnConfig, projectConfig: ProjectNpmConfig | ProjectYarnConfig) {
  // Registries should be set on project level but fallback to user defined.
  const projectRegistries = projectConfig.getRegistries();
  const userRegistries = userConfig.getRegistries();
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
