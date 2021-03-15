#!/usr/bin/env node

const env = require( "@softvisio/core/utils/env" );
const App = require( "../lib" );

var config = env.read( "production" );

var app = new App( config.config );

app.run();
