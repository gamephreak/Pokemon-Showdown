type ID = '' | string & {__isID: true};

type GenderName = 'M' | 'F' | 'N';

type Generation = 1 | 2 | 3 | 4 | 5 | 6 | 7;

type StatName = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';
type StatsTable<T = number> = {[stat in StatName]: T};
type BoostName = Exclude<StatName, 'hp'> | 'accuracy' | 'evasion';
type BoostsTable<T = number> = {[boost in BoostName]: T};

type NatureName = 'Adamant' | 'Bashful' | 'Bold' | 'Brave' | 'Calm' | 'Careful' | 'Docile' | 'Gentle' |
	'Hardy' | 'Hasty' | 'Impish' | 'Jolly' | 'Lax' | 'Lonely' | 'Mild' | 'Modest' | 'Naive' | 'Naughty' |
	'Quiet' | 'Quirky' | 'Rash' | 'Relaxed' | 'Sassy' | 'Serious' | 'Timid';
type TypeName = 'Normal' | 'Fighting' | 'Flying' | 'Poison' | 'Ground' | 'Rock' | 'Bug' | 'Ghost' | 'Steel' |
	'Fire' | 'Water' | 'Grass' | 'Electric' | 'Psychic' | 'Ice' | 'Dragon' | 'Dark' | 'Fairy' | '???';
type StatusName = 'par' | 'psn' | 'frz' | 'slp' | 'brn' | 'tox';

type MoveCategory: 'Physical' | 'Special' | 'Status';
type GameType = 'singles' | 'doubles' | 'triples' | 'rotation' | 'multi' | 'free-for-all'


// TODO: other than species/moves the rest can be optional?
interface PokemonSet<T extends string = string> {
	name: string;
	species: T;
	item: T;
	ability: T;
	moves: T[];
	nature: T;
	gender: GenderName;
	evs: StatsTable;
	ivs: StatsTable;
	level: number;
	shiny?: boolean;
	happiness?: number;
	hpType?: string;
	pokeball?: T;
}

type MoveFlag = 1 | 0;
interface MoveFlags {
	authentic?: MoveFlag; // Ignores a target's substitute.
	bite?: MoveFlag; // Power is multiplied by 1.5 when used by a Pokemon with the Ability Strong Jaw.
	bullet?: MoveFlag; // Has no effect on Pokemon with the Ability Bulletproof.
	charge?: MoveFlag; // The user is unable to make a move between turns.
	contact?: MoveFlag; // Makes contact.
	dance?: MoveFlag; // When used by a Pokemon, other Pokemon with the Ability Dancer can attempt to execute the same move.
	defrost?: MoveFlag; // Thaws the user if executed successfully while the user is frozen.
	distance?: MoveFlag; // Can target a Pokemon positioned anywhere in a Triple Battle.
	gravity?: MoveFlag; // Prevented from being executed or selected during Gravity's effect.
	heal?: MoveFlag; // Prevented from being executed or selected during Heal Block's effect.
	mirror?: MoveFlag; // Can be copied by Mirror Move.
	mystery?: MoveFlag; // Unknown effect.
	nonsky?: MoveFlag; // Prevented from being executed or selected in a Sky Battle.
	powder?: MoveFlag; // Has no effect on Pokemon which are Grass-type, have the Ability Overcoat, or hold Safety Goggles.
	protect?: MoveFlag; // Blocked by Detect, Protect, Spiky Shield, and if not a Status move, King's Shield.
	pulse?: MoveFlag; // Power is multiplied by 1.5 when used by a Pokemon with the Ability Mega Launcher.
	punch?: MoveFlag; // Power is multiplied by 1.2 when used by a Pokemon with the Ability Iron Fist.
	recharge?: MoveFlag; // If this move is successful, the user must recharge on the following turn and cannot make a move.
	reflectable?: MoveFlag; // Bounced back to the original user by Magic Coat or the Ability Magic Bounce.
	snatch?: MoveFlag; // Can be stolen from the original user and instead used by another Pokemon using Snatch.
	sound?: MoveFlag; // Has no effect on Pokemon with the Ability Soundproof.
}
type MoveTarget =
    // single-target
    'normal'|'any'|'adjacentAlly'|'adjacentFoe'|'adjacentAllyOrSelf'|
    // single-target, automatic
    'self'|'randomNormal'|
    // spread
    'allAdjacent'|'allAdjacentFoes'|
    // side and field
    'allySide'|'foeSide'|'all';

interface Nature {
	id: ID;
	name: NatureName;
	plus?: StatName;
	minus?: StatName;
}

type DataType = 'Ability' | 'Move' | 'Item' | 'Species';
type Nonstandard = 'Glitch' | 'Past' | 'Future' | 'CAP' | 'LGPE' | 'Pokestar' | 'Custom';
interface Data {
	id: ID;
	type: DataType;
	name: string;
	num: number;
	gen: Generation;
	isUnreleased?: boolean;
	isNonstandard: Nonstandard | null;
	exists?: boolean; // TODO
}

interface Ability extends Data {
	type: 'Ability';
	suppressWeather: boolean;
	isUnbreakable?: boolean
}
interface Item extends Data {
	type: 'Item';

	fling?: { basePower: number status?: string volatileStatus?: string };
	forcedForme?: string;
	ignoreKlutz?: boolean;
	infiltrates?: boolean;
	isBerry?: boolean;
	isChoice?: boolean;
	isGem?: boolean;
	isPokeball?: boolean;
	megaEvolves?: string;
	megaStone?: string;
	naturalGift?: {basePower: number, type: TypeName};
	onDrive?: TypeName;
	onMemory?: TypeName;
	onPlate?: TypeName;
	recoil?: [number, number];
	status?: string;
	weather?: string;
	zMove?: string | true | null;
	zMoveFrom?: string;
	zMoveType?: TypeName;
	zMoveUser?: string[] | null;
}



/// WIP


interface Move extends Data {
	type: 'Move';

	noCopy?: boolean;
	status?: ID;
	weather?: ID;
}

interface Species extends Data {
	type 'Species';
}

//////////////
type Language = 'de' | 'en' | 'es' | 'fr' | 'hi' | 'it' | 'ja' | 'nl' | 'pl' | 'pt' | 'ru' | 'tr' | 'tw' | 'zh';
getDescription(
