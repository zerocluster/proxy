#!/usr/bin/env node

import env from "@softvisio/core/utils/env";
import App from "#index";

var config = env.read( "production" );

const app = new App( config.config );

app.run();
