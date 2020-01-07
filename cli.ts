import { run } from "./index";

// Multi-tenant AAD application hosted on private tenant.
// Possible to substitute with your own if needed and specify the tenant id of your organization.
const AZDEVOPS_AUTH_CLIENT_ID = "f9d5fef7-a410-4582-bb27-68a319b1e5a1";

const args = require("minimist")(process.argv.slice(2), {
    alias: {
      cid: "client_id",
      tid: "tenant_id"
    },
     default: {
        client_id: AZDEVOPS_AUTH_CLIENT_ID,
        tenant_id: "common" // multi-tenant application
    }
  });
  
  (async () => await run(args.client_id, args.tenant_id))();