#!/usr/bin/env node

import { run } from "./index";

const args = require("minimist")(process.argv.slice(2), {
  alias: {
    cid: "client_id",
    tid: "tenant_id",
    ci: "continuous_integration_variable"
  }
});

(async () => await run(args.client_id, args.tenant_id, args.ci))();
