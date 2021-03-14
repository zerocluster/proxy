#!/usr/bin/env node

const fs = require( "@softvisio/core/fs" );
const App = require( "../lib" );

var config = fs.config.read( "./.env.local.yaml" );

var app = new App( config );

app.run();
