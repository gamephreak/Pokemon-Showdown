/**
 * Imports and generates the '@pokemon-showdown/sets' package.
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * Run with `node tools/set-import [version]`. If version is not specified,
 * the 'patch' version of the existing package will be bumped. If version is
 * 'minor' or 'monthly', the minor version will be bumped. In general, every
 * month after usage stats are processed this script should be run to update
 * the sets package and bump the minor version. If this script is run in
 * between usage stats updates, the patch version should be bumped. If a
 * breaking change occurs to the output format, the major version must be
 * bumped (with 'major' or 'breaking' as the version argument). The exact
 * version string (eg. '1.2.3') can also be provided. After creating the set
 * import, provided there are no serious errors, the package can be released
 * by running `npm publish` in the `sets/` directory.
 *
 * @license MIT
 */

'use strict';

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

global.Chat = {};
Chat.plural = function (num, plural = 's', singular = '') {
	if (num && typeof num.length === 'number') {
		num = num.length;
	} else if (num && typeof num.size === 'number') {
		num = num.size;
	} else {
		num = Number(num);
	}
	return (num !== 1 ? plural : singular);
};

const importer = require('./importer.js');

const SETS = path.resolve(__dirname, 'sets');
(async () => {
	const imports = [];
	for (let [i, generationData] of (await importer.importAll()).entries()) {
		fs.writeFileSync(path.resolve(SETS, `gen${i + 1}.json`), JSON.stringify(generationData, null, 2)); // FIXME
		imports.push(`gen${i + 1}`);
		for (let format in generationData) {
			fs.writeFileSync(path.resolve(SETS, `${format}.json`), JSON.stringify(generationData[format], null, 2)); // FIXME
			imports.push(format);
		}
	}

	let version = process.argv[2];
	if (!version || version.match(/^[^\d]/)) {
		try {
			const current = require('./sets/package.json').version;
			const [major, minor, patch] = current.split('.');
			if (version === 'major' || version === 'breaking') {
				version = `${Number(major) + 1}.${minor}.${patch}`;
			} else if (version === 'minor' || version === 'monthly') {
				version = `${major}.${Number(minor) + 1}.${patch}`;
			} else {
				version = `${major}.${minor}.${Number(patch) + 1}`;
			}
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
			"url": "https://github.com/Zarel/Pokemon-Showdown.git",
		},
		"author": "Kirk Scheibelhut",
		"license": "MIT",
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

