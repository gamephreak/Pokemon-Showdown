import * as http from 'http';
import * as https from 'https';
import * as util from 'util';

// tslint:disable: no-implicit-dependencies
// @ts-ignore - index.js installs these for us
import JSON5 = require('json5');
import * as smogon from 'smogon';

import * as Streams from '../../lib/streams';
import {Dex} from '../../sim/dex';
import {TeamValidator} from '../../sim/team-validator';
Dex.includeModData();
const toID = Dex.getId;

type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends (infer I)[]
	? (DeepPartial<I>)[]
	: DeepPartial<T[P]>;
};

interface PokemonSets {
	[speciesid: string]: {
		[name: string]: DeepPartial<PokemonSet>;
	};
}

interface Sets {[source: string]: PokemonSets; }

interface Weights  {
	species: {[id: string]: number};
	abilities: {[id: string]: number};
	items: {[id: string]: number};
	moves: {[id: string]: number};
}

interface IncomingMessage extends NodeJS.ReadableStream {
	statusCode: number;
}

// eg. 'gen1.json'
interface GenerationData {
	[formatid: string]: FormatData;
}

// eg. 'gen7balancedhackmons.json'
interface FormatData {
	sets: Sets;
	weights: Weights;
}

type Generation = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const TIERS = new Set([
	'ubers', 'ou', 'uu', 'ru', 'nu', 'pu', 'zu', 'lc', 'cap',
	'doublesou', 'battlespotsingles', 'battlespotdoubles',
	'vgc16', 'vgc17', 'vgc18', 'vgc19ultraseries', 'letsgoou',
	'anythinggoes', 'balancedhackmons', '1v1', 'monotype',
]);
const FORMATS = new Map<ID, Format>();
const VALIDATORS = new Map<ID, TeamValidator>();
for (let gen = 1; gen <= 7; gen++) {
	for (const tier of TIERS) {
		const format = Dex.getFormat(`gen${gen}${tier}`);
		if (format.exists) {
			FORMATS.set(format.id, format);
			VALIDATORS.set(format.id, new TeamValidator(format));
		}
	}
}

export async function importAll() {
	const index = await request(smogon.Statistics.URL);

	const imports = [];
	for (let gen = 1; gen <= 7; gen++) {
		imports.push(importGen(gen as Generation, index));
	}

	return Promise.all(imports);
}

async function importGen(gen: Generation, index: string) {
	const sets: Sets = {};

	const statisticsByFormat = new Map<Format, smogon.UsageStatistics>();
	const setsByFormat: { [formatid: string]: PokemonSets } = {};
	const numByFormat: { [formatid: string]: number } = {};
	// const imports = [];
	// for (const pokemon in SPECIES[gen]) { // TODO
		// imports.push(importSmogonSets(pokemon, gen, setsByFormat, numByFormat));
	// }
	// await Promise.all(imports);
	sets['smogon.com/dex'] = setsByFormat;

	for (const format of FORMATS.values()) {
		const url = getStatisticsURL(index, format);
		try {
			statisticsByFormat.set(format, smogon.Statistics.parse(await fetch(url)));
		} catch (err) {
			error(`${url} = ${err}`);
		}

		if (numByFormat[format.id])  report(format, numByFormat[format.id], 'smogon.com/dex');
	}

	for (const [format, statistics] of statisticsByFormat.entries()) {
		sets['smogon.com/stats'][format.id] = getUsageBasedSets(format, statistics);
	}

	return {sets, weights: getWeightsByFormat(statisticsByFormat)};
}

// Fallback URLs for past formats that are most likely not present in current usage statistics.
const STATISTICS: {[formatid: string]: string} = {
	gen1uu: 'https://www.smogon.com/stats/2017-12/chaos/gen1uu-1500.json',
	gen2uu: 'https://www.smogon.com/stats/2016-08/chaos/gen2uu-1500.json',
	gen2nu: 'https://www.smogon.com/stats/2018-11/chaos/gen2nu-1500.json',
	gen3uu: 'https://www.smogon.com/stats/2016-11/chaos/gen3uu-1500.json',
	gen3nu: 'https://www.smogon.com/stats/2016-09/chaos/gen3nu-1500.json',
	gen4nu: 'https://www.smogon.com/stats/2016-10/chaos/gen4nu-1500.json',
	gen3ubers: 'https://www.smogon.com/stats/2018-09/chaos/gen3ubers-1500.json',
	gen4ubers: 'https://www.smogon.com/stats/2019-03/chaos/gen4ubers-1500.json',
	gen4uu: 'https://www.smogon.com/stats/2019-04/chaos/gen4uu-1500.json',
	gen4lc: 'https://www.smogon.com/stats/2018-02/chaos/gen4lc-1500.json',
	gen4doublesou: 'https://www.smogon.com/stats/2018-01/chaos/gen4doublesou-1500.json',
	gen4anythinggoes: 'https://www.smogon.com/stats/2017-04/chaos/gen4anythinggoes-1500.json',
	gen5ubers: 'https://www.smogon.com/stats/2018-11/chaos/gen5ubers-1500.json',
	gen5uu: 'https://www.smogon.com/stats/2019-04/chaos/gen5uu-1500.json',
	gen5ru: 'https://www.smogon.com/stats/2018-01/chaos/gen5ru-1500.json',
	gen5nu: 'https://www.smogon.com/stats/2017-11/chaos/gen5nu-1500.json',
	gen5lc: 'https://www.smogon.com/stats/2018-05/chaos/gen5lc-1500.json',
	gen5doublesou: 'https://www.smogon.com/stats/2018-12/chaos/gen5doublesou-1500.json',
	gen51v1: 'https://www.smogon.com/stats/2019-06/chaos/gen51v1-1500.json',
	gen5monotype: 'https://www.smogon.com/stats/2018-10/chaos/gen5monotype-1500.json',
	gen6ubers: 'https://www.smogon.com/stats/2018-12/chaos/gen6ubers-1500.json',
	gen6uu: 'https://www.smogon.com/stats/2019-06/chaos/gen6uu-1500.json',
	gen6ru: 'https://www.smogon.com/stats/2018-01/chaos/gen6ru-1500.json',
	gen6nu: 'https://www.smogon.com/stats/2018-06/chaos/gen6nu-1500.json',
	gen6pu: 'https://www.smogon.com/stats/2017-11/chaos/gen6pu-1500.json',
	gen6lc: 'https://www.smogon.com/stats/2017-11/chaos/gen6lc-1500.json',
	gen6cap: 'https://www.smogon.com/stats/2018-01/chaos/gen6cap-1500.json',
	gen6doublesou: 'https://www.smogon.com/stats/2017-12/chaos/gen6doublesou-1500.json',
	gen6battlespotsingles: 'https://www.smogon.com/stats/2018-03/chaos/gen6battlespotsingles-1500.json',
	gen6battlespotdoubles: 'https://www.smogon.com/stats/2018-01/chaos/gen6battlespotdoubles-1500.json',
	gen6anythinggoes: 'https://www.smogon.com/stats/2018-03/chaos/gen6anythinggoes-1500.json',
	gen61v1: 'https://www.smogon.com/stats/2018-10/chaos/gen61v1-1500.json',
	gen6monotype: 'https://www.smogon.com/stats/2018-01/chaos/gen6monotype-1500.json',
};

export function getStatisticsURL(index: string, format: Format) {
	if (STATISTICS[format.id] && !index.includes(format.id)) return STATISTICS[format.id];
	return smogon.Statistics.url(smogon.Statistics.latest(index), format.id);
}

async function importSmogonSets(
	pokemon: string,
	gen: Generation,
	setsByFormat: { [format: string]: PokemonSets },
	numByFormat: { [format: string]: number }
) {
	const analysesByFormat = await getAnalysesByFormat(pokemon, gen);
	if (!analysesByFormat) return;

	for (const [format, analyses] of analysesByFormat.entries()) {
		let setsForPokemon = setsByFormat[format.id];
		if (!setsForPokemon) {
			setsForPokemon = {};
			setsByFormat[format.id] = setsForPokemon;
		}
		let sets = setsForPokemon[pokemon];
		if (!sets) {
			sets = {};
			setsForPokemon[pokemon] = sets;
		}

		for (const analysis of analyses) {
			for (const moveset of analysis.movesets) {
				const set = toPokemonSet(format, pokemon, moveset);
				const name = moveset.name.replace(/"/g, `'`);
				if (validSet(format, pokemon, name, set) && !skip(format, pokemon, set)) {
					sets[name] = set;
					numByFormat[format.id] = (numByFormat[format.id] || 0) + 1;
				}
			}
		}
	}
}

function toPokemonSet(format: Format, pokemon: string, set: smogon.Moveset) {
	const level = getLevel(format, set.level);
	return {
		level: level === 100 ? undefined : level,
		moves: set.moveslots.map(ms => ms[0]),
		ability: fixedAbility(format, pokemon) || set.abilities[0],
		item: set.items[0] === 'No Item' ? undefined : set.items[0],
		nature: set.natures[0],
		ivs: toStatsTable(set.ivconfigs[0], 31),
		evs: toStatsTable(set.evconfigs[0]),
	};

}
function toStatsTable(stats?: StatsTable, elide = 0) {
	if (!stats) return undefined;

	const s: Partial<StatsTable> = {};
	let stat: keyof StatsTable;
	for (stat in stats) {
		const val = stats[stat];
		if (val !== elide) s[stat] = val;
	}
	return s;
}

const SMOGON = {
	uber: 'ubers',
	doubles: 'doublesou',
	lgpeou: 'letsgoou',
	ag: 'anythinggoes',
	bh: 'balancedhackmons',
	vgc16: 'vgc2016',
	vgc17: 'vgc2017',
	vgc18: 'vgc2018',
	vgc19: 'vgc2019ultraseries',
} as unknown as {[id: string]: ID};

// 3 retries after ~(40, 200, 1000)ms
const getAnalysis = retrying(async (url: string) => {
	try {
		return await smogon.Analyses.process(await request(url));
	} catch (err) {
		throw new RetryableError(err.message);
	}
}, 3, 40);

async function getAnalysesByFormat(pokemon: string, gen: Generation) {
	const id = toID(pokemon);
	if (id.endsWith('totem')) return undefined;
	const url = smogon.Analyses.url(pokemon, gen);
	const analysesByTier = await getAnalysis(url);
	if (!analysesByTier) {
		error(`Unable to process analysis: ${url}`);
		return undefined;
	}

	const analysesByFormat = new Map<Format, smogon.Analysis[]>();
	for (const [tier, analyses] of analysesByTier.entries()) {
		const format = FORMATS.get(`gen${gen}${SMOGON[tier] || tier}` as ID);
		if (format) analysesByFormat.set(format, analyses);
	}
	return analysesByFormat;
}

function getLevel(format: Format, level = 0) {
	if (format.forcedLevel) return format.forcedLevel;
	const maxLevel = format.maxLevel || 100;
	const maxForcedLevel = format.maxForcedLevel || maxLevel;
	if (!level) level = format.defaultLevel || maxLevel;
	return level > maxForcedLevel ? maxForcedLevel : level;
}

function getUsageBasedSets(
	format: Format,
	statistics: smogon.UsageStatistics
) {
	const sets: PokemonSets = {};
	const dex = Dex.forFormat(format);
	const threshold = getUsageThreshold(format);
	let num = 0;
	for (const pokemon in statistics.data) {
		const stats = statistics.data[pokemon];
		if (stats.usage >= threshold) {
			const set: DeepPartial<PokemonSet> = {
				moves: (top(stats.Moves, 4) as string[]).map(m => dex.getMove(m).name),
			};
			if (format.gen >= 2 && format.id !== 'gen7letsgoou') {
				const id = top(stats.Items) as string;
				set.item = dex.getItem(id).name;
			}
			if (format.gen >= 3) {
				const id = top(stats.Abilities) as string;
				set.ability = fixedAbility(format, pokemon) || dex.getAbility(id).name;
				const { nature, evs } = fromSpread(top(stats.Spreads) as string);
				set.nature = nature;
				if (format.id !== 'gen7letsgoou') set.evs = evs;
			}
			const name = 'Showdown Usage';
			if (validSet(format, pokemon, name, set) && !skip(format, pokemon, set)) {
				sets[pokemon] = {};
				sets[pokemon][name] = set;
				num++;
			}
		}
	}
	report(format, num, 'smogon.com/stats');
	return sets;
}

function getUsageThreshold(format: Format) {
	return format.id.match(/uber|anythinggoes|doublesou/) ? 0.03 : 0.01;
}

function skip(format: Format, pokemon: string, set: DeepPartial<PokemonSet>) {
	return false; // TODO
}

function fixedAbility(format: Format, pokemon: string) {
	return undefined; // TODO
}

function validSet(format: Format, pokemon: string, name: string, set: DeepPartial<PokemonSet>) {
	const invalid = VALIDATORS.get(format.id)!.validateSet(set as PokemonSet, {});
	if (!invalid) return true;
	const title = color(`${format.name}: ${pokemon} (${name})'`, 91);
	const details = `${JSON.stringify(set)} = ${invalid.join(', ')}`;
	console.error(`Invalid set ${title}: ${color(details, 90)}`);
	return false;
}

const STATS: StatName[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];

function fromSpread(spread: string) {
	const [nature, revs] = spread.split(':');
	const evs: Partial<StatsTable> = {};
	for (const [i, rev] of revs.split('/').entries()) {
		const ev = Number(rev);
		if (ev) evs[STATS[i]] = ev;
	}
	return { nature, evs };
}

function top(weighted: { [key: string]: number }, n = 1): string | string[] | undefined {
	if (n === 0) return undefined;
	// Optimize the common case with an linear algorithm instead of log-linear
	if (n === 1) {
		let max;
		for (const key in weighted) {
			if (!max || weighted[max] < weighted[key]) max = key;
		}
		return max;
	}
	return Object.entries(weighted)
		.sort((a, b) => b[1] - a[1])
		.slice(0, n)
		.map(x => x[0]);
}

function getWeightsByFormat(statisticsByFormat: Map<Format, smogon.UsageStatistics>) {
	const weightsByFormat: { [format: string]: Weights } = {};
	for (const [format, statistics] of statisticsByFormat.entries()) {
		const species: { [id: string]: number } = {};
		const abilities: { [id: string]: number } = {};
		const items: { [id: string]: number } = {};
		const moves: { [id: string]: number } = {};

		for (const name in statistics.data) {
			const stats = statistics.data[name];
			species[name] = stats.usage;
			updateWeights(abilities, stats.Abilities, stats.usage);
			updateWeights(items, stats.Items, stats.usage);
			updateWeights(moves, stats.Moves, stats.usage, 4);
		}

		const transform = (obj: { [name: string]: number }) => {
			const sorted = Object.entries(obj).sort(([, a], [, b]) => b - a);
			const o: { [id: string]: number } = {};
			for (const [i, [k, v]] of sorted.entries()) {
				o[toID(k)] = i + 1;
			}
			return o;
		};

		weightsByFormat[format.id] = {
			species: transform(species),
			abilities: transform(abilities),
			items: transform(items),
			moves: transform(moves),
		};
	}
	return weightsByFormat;
}

function updateWeights(
	existing: { [name: string]: number },
	weights: { [name: string]: number },
	usage: number,
	factor = 1
) {
	const totalWeight = Object.values(weights).reduce((acc, v) => acc + v);
	for (const name in weights) {
		const weight = (weights[name] / totalWeight) * factor * usage;
		existing[name] = (existing[name] || 0) + weight;
	}
}

// 20 QPS, 3 retries after ~(40, 200, 1000)ms
const request = retrying(throttling(fetch, 20, 100), 3, 40);

export function fetch(url: string) {
	const client = url.startsWith('http:') ? http : https;
	return new Promise<string>((resolve, reject) => {
		// @ts-ignore ???
		const req = client.get(url, (res: IncomingMessage) => {
			if (res.statusCode !== 200) {
				if (res.statusCode >= 500 && res.statusCode < 600) {
					return reject(new RetryableError(`HTTP ${res.statusCode}`));
				} else {
					return reject(new Error(`HTTP ${res.statusCode}`));
				}
			}
			Streams.readAll(res).then(resolve, reject);
		});
		req.on('error', reject);
		req.end();
	});
}

class RetryableError extends Error {
	constructor(message?: string) {
		super(message);
		// restore prototype chain
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

function retrying<I, O>(fn: (args: I) => Promise<O>, retries: number, wait: number): (args: I) => Promise<O> {
	const retry = async (args: I, attempt = 0): Promise<O> => {
		try {
			return fn(args);
		} catch (err) {
			if (err instanceof RetryableError) {
				attempt++;
				if (attempt > retries) throw err;
				const timeout = Math.round(attempt * wait * (1 + Math.random() / 2));
				warn(`Retrying ${args} in ${timeout}ms (${attempt}):`, err);
				return new Promise(resolve => {
					setTimeout(async () => {
						resolve(await retry(args, attempt++));
					}, timeout);
				});
			} else {
				throw err;
			}
		}
	};
	return retry;
}

function throttling<I, O>(fn: (args: I) => Promise<O>, limit: number, interval: number): (args: I) => Promise<O> {
	const queue = new Map();
	let currentTick = 0;
	let activeCount = 0;

	const throttled = (args: I) => {
		let timeout: NodeJS.Timeout;
		return new Promise<O>((resolve, reject) => {
			const execute = async () => {
				resolve(await fn(args));
				queue.delete(timeout);
			};

			const now = Date.now();

			if (now - currentTick > interval) {
				activeCount = 1;
				currentTick = now;
			} else if (activeCount < limit) {
				activeCount++;
			} else {
				currentTick += interval;
				activeCount = 1;
			}

			timeout = setTimeout(execute, currentTick - now);
			queue.set(timeout, reject);
		});
	};

	return throttled;
}

function color(s: any, code: number) {
	return util.format(`\x1b[${code}m%s\x1b[0m`, s);
}

function report(format: Format, num: number, source: string) {
	console.info(`${format.name}: ${color(num, 33)} ${color(`(${source})`, 90)}`);
}

function warn(s: string, err: Error) {
	console.warn(`${color(s, 33)} ${color(err.message, 90)}`);
}

function error(s: string) {
	console.error(color(s, 91));
}
