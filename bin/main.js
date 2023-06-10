#!/usr/bin/env node

import App from "#lib/app";

const app = new App();

await app.cli();

const res = await app.run();

if ( !res.ok ) process.exit( 1 );
