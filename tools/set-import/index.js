#!/usr/bin/env node

const child_process = require('child_process');
const path = require('path');
const shell = cmd => child_process.execSync(cmd, {stdio: 'inherit', cwd: path.resolve(__dirname, '../..')});
shell('node build');

function missing(dep) {
	try {
		require.resolve(dep);
		return false;
	} catch (err) {
		if (err.code !== 'MODULE_NOT_FOUND') throw err;
		return true;
	}
}

const deps = [];
if (missing('smogon')) deps.push('smogon');
if (missing('json5')) deps.push('json5');
if (deps.length) shell(`npm install ${deps}`);

if (!missing('source-map-support')) require('source-map-support').install();

const importer = require('./importer.js');

const dir = path.resolve(__dirname, process.argv[2] || 'sets');
(async () => { await importer.importAll(dir); })().catch(err => console.error(err));
