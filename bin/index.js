#!/usr/bin/env node

const Main = require('../lib/Main');
const pkg = require('../package');

const main = new Main(pkg.version, process.argv);
