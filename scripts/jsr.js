const path = require('path');
const fs = require('fs');

const packageJsonSource = path.resolve(__dirname, '../package.json');
const jsrJsonSource = path.resolve(__dirname, '../jsr.json');

const packageJson = JSON.parse(fs.readFileSync(packageJsonSource, { encoding: 'utf-8' }));
const jsrJson = JSON.parse(fs.readFileSync(jsrJsonSource, { encoding: 'utf-8' }));

jsrJson.version = packageJson.version

fs.writeFileSync(jsrJsonSource, JSON.stringify(jsrJson, undefined, 2));
