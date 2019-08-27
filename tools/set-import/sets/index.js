"use strict";
function forGen(gen: Generation) {
	return import(`gen${gen}.json`);
}
exports.forGen = forGen;
function forFormat(format: string) {
	return import(`${format.json`);
}
exports.forFormat = forFormat;
