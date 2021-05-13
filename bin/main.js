#!/usr/bin/env node

import env from "#core/env";
import App from "#index";

var config = env.readConfig();

const app = new App( config.config );

app.run();
