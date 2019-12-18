const NpmConfig = require("./npm-config");
const jwtDecode = require("jwt-decode");
const { Issuer, TokenSet } = require("openid-client");

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

(async () => {
  const prjNpmConfig = new NpmConfig("./.npmrc");
  const userNpmConfig = new NpmConfig(`${home}/.npmrc`);

  // Registry should be set on project level but fallback to user defined.
  const registry = prjNpmConfig.getRegistry() || userNpmConfig.getRegistry();
  if (!registry) {
    throw new Error(
      "No private registry defined in project .npmrc or user defined .npmrc"
    );
  }

  console.log(`found registry ${registry}.`);

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
    console.log("Trying to refresh token...");
    tokenSet = await client.refresh(refreshToken);
  } else {
    const handle = await client.deviceAuthorization({
      scope: `${AZDEVOPS_RESOURCE_ID}/.default offline_access`
    });
    console.log("User Code: ", handle.user_code);
    console.log("Verification URI: ", handle.verification_uri);
    tokenSet = await handle.poll();
  }

  userNpmConfig.setRegistryAuthToken(registry, tokenSet.access_token);
  userNpmConfig.setRegistryRefreshToken(registry, tokenSet.refresh_token);

  console.log(`we good till ${new Date(tokenSet.expires_at * 1000)}`);
})();
