#!/usr/bin/env node

import App from "#lib/app";

await App.Cli.parse( App );

const app = new App();

app.run();
