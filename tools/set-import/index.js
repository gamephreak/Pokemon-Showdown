#!/usr/bin/env node

const child_process = require('child_process');
const path = require('path');
const fs = require('fs');
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
if (deps.length) shell(`npm install --no-save ${deps}`);

if (!missing('source-map-support')) require('source-map-support').install();

const importer = require('./importer.js');

const SETS = path.resolve(__dirname, 'sets');
(async () => {

	const imports = [];
	for (let [i, generationData] of (await importer.importAll()).entries()) {
		fs.writeFileSync(path.resolve(SETS, `gen${i + 1}.json`), JSON.stringify(generationData));
		imports.push(`gen${i + 1}`);
		for (let format in generationData) {
			fs.writeFileSync(path.resolve(SETS, `${format}.json`), JSON.stringify(generationData[format]));
			imports.push(format);
		}
	}

	let version = process.argv[2];
	if (!version) {
		try {
			const current = require('./sets/package.json').version;
			const [major, minor, patch] = current.split('.');
			version = `${major}.${minor}.${Number(patch) + 1}`;
		} catch (err) {
			console.error("Version required to create '@pokemon-showdown/sets' package");
			process.exit(1);
		}
	}

	const packagejson = {
		"name": "@pokemon-showdown/sets",
		"version": version,
		"description": "Sets and weight data imported from Smogon and third-party sources and used on Pokémon Showdown",
		"main": "build/index.js",
		"types": "build/index.d.ts",
		"repository": {
			"type": "git",
			"url": "https://github.com/Zarel/Pokemon-Showdown.git"
		},
		"author": "Kirk Scheibelhut",
		"license": "MIT"
	};
	fs.writeFileSync(path.resolve(SETS, 'package.json'), JSON.stringify(packagejson, null, 2));

	const indexjs = [
		'"use strict";',
		'const JSON = {',
		imports.map(n => `	"${n}": import("${n}.json"),`).join('\n'),
		'}',
		'function forGen(gen: Generation) {',
		'	return JSON[`gen${gen}`];',
		'}',
		'exports.forGen = forGen;',
		'function forFormat(format: string) {',
		'	return JSON[format];',
		'}',
		'exports.forFormat = forFormat;',
	].join('\n');
	fs.writeFileSync(path.resolve(SETS, 'index.js'), indexjs);

})().catch(err => console.error(err));


