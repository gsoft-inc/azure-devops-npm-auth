import { run } from "./index";

const args = require("minimist")(process.argv.slice(2), {
    alias: {
      cid: "client_id",
      tid: "tenant_id"
    }
  });
  
(async () => await run(args.client_id, args.tenant_id))();
