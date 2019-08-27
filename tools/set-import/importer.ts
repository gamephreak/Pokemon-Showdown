import * as util from 'util';

import {Dex} from '../../sim/dex';
Dex.includeModData();

import * as smogon from 'smogon';
const JSON5 = require('json5');

type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends (infer I)[]
	? (DeepPartial<I>)[]
	: DeepPartial<T[P]>;
};

// eg. 'gen1.json'
interface GenerationData {
	[formatid: string]: FormatData;
}

// eg. 'gen7balancedhackmons.json'
interface FormatData {
	sets: {
		[source: string]: {
			[speciesid: string]: {
				[name: string]: DeepPartial<PokemonSet>;
			};
		};
	};
	weights: {
		species: {[id: string]: number};
		abilities: {[id: string]: number};
		items: {[id: string]: number};
		moves: {[id: string]: number};
	};
}

export function importAll(dir: string) {
	return [{}] as GenerationData[];
}
