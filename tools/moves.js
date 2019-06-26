const Dex = require('../.sim-dist/dex').Dex;
const Validator = require('../.sim-dist/team-validator').Validator;
Dex.includeModData();

const FORMAT = 'gen7ou' || process.argv[3];

const dex = Dex.forFormat(FORMAT);
const validator = new Validator(FORMAT);

const species = dex.getTemplate(process.argv[2]);
const lset = new Set();
for (const sources of Object.values(species.learnset)) {
	for (const source of sources) {
		lset.add(source.slice(0, 2));
	}
}
console.log(lset.size);
const learnset = Array.from(lset);
for (const [i, comb] of k_combinations(learnset, 4).entries()) {
	console.log(`${i + 1}: ${comb.join(' ')}}`);
}
//const events = new Set(species.eventPokemon ? species.eventPokemon : []);

//let template = species;
//console.log(template.learnset);
//while (template.prevo) {
	//template = dex.getTemplate(template.prevo);
	//console.log(template.learnset);
	//for (const m in template.learnset) {
		//lset.add(m);
	//}
	//if (template.eventPokemon) {
		//for (const e of template.eventPokemon) {
			//events.add(e);
		//}
	//}
//}
//console.log(Array.from(lset));
//console.log(Array.from(events));

//for (const ability of Object.values(species.abilities)) {
	//const base = {
		//level: 100,
		//species: species.name,
		//ability: ability,
		//nature: 'Serious',
		//ivs: {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31},
		//evs: {hp: 85, atk: 85, def: 85, spa: 85, spd: 85, spe: 85},
	//};
	//// TODO
//}


//for (const moves of k_combinations(Array.from(lset), 4)) {
	//console.log(moves);
//}

// A: work with move sources (5D, 3L)
// B: only look at N (=20?) most popular moves from stats instead of all possible!

function k_combinations(set, k) {
  if (k > set.length || k <= 0) return [];
  if (k == set.length) return [set];
  if (k == 1) return set.reduce((acc, cur) => [...acc, [cur]], []);

  const combs = []
  for (let i = 0; i <= set.length - k + 1; i++) {
    const tail_combs = k_combinations(set.slice(i + 1), k - 1);
    for (let j = 0; j < tail_combs.length; j++) {
      combs.push([set[i], ...tail_combs[j]]);
    }
  }

  return combs;
}
