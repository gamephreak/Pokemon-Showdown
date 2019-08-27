type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends (infer I)[]
	? (DeepPartial<I>)[]
	: DeepPartial<T[P]>;
};

// eg. 'gen1.json'
export interface GenerationData {
	[formatid: string]: FormatData;
}

// eg. 'gen7balancedhackmons.json'
export interface FormatData {
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
