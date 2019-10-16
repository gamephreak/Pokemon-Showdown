interface Move extends Data {
	type: 'Move';

	accuracy: true | number;
	alwaysHit?: boolean;
	baseMoveType?: string;
	basePower: number;
	basePowerModifier?: number;
	boosts?: Partial<BoostsTable> | false
	breaksProtect?: boolean;
	category: MoveCategory;
	contestType?: string;
	critModifier?: number;
	critRatio?: number;
	damage?: number | 'level' | false | null;
	defensiveCategory?: MoveCategory;
	drain?: [number, number];
	flags: AnyObject; // TODO
	forceSTAB?: boolean;
	forceSwitch?: boolean;
	hasCustomRecoil?: boolean;
	heal?: number[] | null;
	ignoreAbility?: boolean;
	ignoreAccuracy?: boolean;
	ignoreDefensive?: boolean;
	ignoreEvasion?: boolean;
	ignoreImmunity?: boolean | {[k: string]: boolean};
	ignoreNegativeOffensive?: boolean;
	ignoreOffensive?: boolean;
	ignorePositiveDefensive?: boolean;
	ignorePositiveEvasion?: boolean;
	infiltrates?: boolean;
	isFutureMove?: boolean;
	isSelfHit?: boolean;
	isViable?: boolean;
	isZ?: boolean | ID;
	mindBlownRecoil?: boolean;
	multiaccuracy?: boolean;
	multihit?: number | number[];
	multihitType?: string;
	noDamageVariance?: boolean;
	noFaint?: boolean;
	noMetronome?: string[];
	noPPBoosts?: boolean;
	noSketch?: boolean;
	nonGhostTarget?: string;
	ohko?: boolean | string;
	pp: number;
	pressureTarget?: string;
	priority: number;
	pseudoWeather?: string:
	recoil?: [number, number];
	selfBoost?: {boosts?: Partial<BoostsTable>};
	selfSwitch?: string | boolean;
	selfdestruct?: string | boolean;
	sideCondition?: string;
	sleepUsable?: boolean;
	slotCondition?: string;
	spreadModifier?: number;
	stallingMove?: boolean;
	status?: string;
	stealsBoosts?: boolean;
	struggleRecoil?: boolean;
	target: string;
	terrain?: string;
	thawsTarget?: boolean;
	type: string;
	useSourceDefensive?: boolean;
	useTargetOffensive?: boolean;
	volatileStatus?: string;
	weather?: string;
	weather?: string;
	willCrit?: boolean;
	zMoveBoost?: Partial<BoostsTable>;
	zMoveEffect?: string;
	zMovePower?: number;
}

interface SpeciesAbilities = {0: string, 1?: string, H?: string, S?: string};
interface Species extends Data {
	type: 'Species';
	abilities: SpeciesAbilities;
	baseStats: StatsTable
	canHatch?: boolean;
	color: string;
	eggGroups: string[];
	heightm: number;
	num: number;
	species: string;
	types: string[];
	weightkg: number;
	baseForme?: string;
	baseSpecies?: string;
	evoLevel?: number;
	evoMove?: string;
	evoCondition?: string;
	evoItem?: string;
	evos?: string[];
	evoType?: 'trade' | 'stone' | 'levelMove' | 'levelExtra' | 'levelFriendship' | 'levelHold';
	forme?: string;
	formeLetter?: string;
	gender?: Gender;
	genderRatio?: {[gender in keyof Gender]: number}
	maxHP?: number;
	cosmeticForms?: string[];
	otherFormes?: string[]
	prevo?: string

	battleOnly?: boolean
	tier?: string
	doublesTier?: string
	encounters?: EventInfo[]
	eventOnly?: boolean
	eventPokemon?: EventInfo[]
	maleOnlyHidden?: boolean
	unreleasedHidden?: boolean
}

getDescription(gen: Generation, lang = en); // TODO
getShortDescription(gen: Generation, lang = en); // TODO

export class Template extends BasicEffect implements Readonly<BasicEffect & TemplateData & TemplateFormatsData> {
	effectType: 'Pokemon';
	/**
	 * Species ID. Identical to ID. Note that this is the full ID, e.g.
	 * 'basculinbluestriped'. To get the base species ID, you need to
	 * manually read toID(template.baseSpecies).
	 */
	speciesid: ID;
	/**
	 * Species. Identical to name. Note that this is the full name,
	 * e.g. 'Basculin-Blue-Striped'. To get the base species name, see
	 * template.baseSpecies.
	 */
	species: string;
	name: string;
	/**
	 * Base species. Species, but without the forme name.
	 */
	baseSpecies: string;
	/**
	 * Forme name. If the forme exists,
	 * `template.species === template.baseSpecies + '-' + template.forme`
	 */
	forme: string;
	/**
	 * Other forms. List of names of cosmetic forms. These should have
	 * `aliases.js` aliases to this entry, but not have their own
	 * entry in `pokedex.js`.
	 */
	otherForms?: string[];
	/**
	 * Other formes. List of names of formes, appears only on the base
	 * forme. Unlike forms, these have their own entry in `pokedex.js`.
	 */
	otherFormes?: string[];
	/**
	 * Forme letter. One-letter version of the forme name. Usually the
	 * first letter of the forme, but not always - e.g. Rotom-S is
	 * Rotom-Fan because Rotom-F is Rotom-Frost.
	 */
	formeLetter: string;
	/**
	 * Sprite ID. Basically the same as ID, but with a dash between
	 * species and forme.
	 */
	spriteid: string;
	/** Abilities. */
	abilities: TemplateAbility;
	/** Types. */
	types: string[];
	/** Added type (used in OMs). */
	addedType?: string;
	/** Pre-evolution. '' if nothing evolves into this Pokemon. */
	prevo: ID;
	/** Evolutions. Array because many Pokemon have multiple evolutions. */
	evos: ID[];
	evoType?: 'trade' | 'stone' | 'levelMove' | 'levelExtra' | 'levelFriendship' | 'levelHold';
	evoMove?: string;
	/** Evolution level. falsy if doesn't evolve. */
	evoLevel?: number;
	/** Is NFE? True if this Pokemon can evolve (Mega evolution doesn't count). */
	nfe: boolean;
	/** Egg groups. */
	eggGroups: string[];
	/**
	 * Gender. M = always male, F = always female, N = always
	 * genderless, '' = sometimes male sometimes female.
	 */
	gender: GenderName;
	/** Gender ratio. Should add up to 1 unless genderless. */
	genderRatio: {M: number, F: number};
	/** Base stats. */
	baseStats: StatsTable;
	/** Max HP. Overrides usual HP calculations (for Shedinja). */
	maxHP?: number;
	/** Weight (in kg). Not valid for OMs; use weighthg / 10 instead. */
	weightkg: number;
	/** Weight (in integer multiples of 0.1kg). */
	weighthg: number;
	/** Height (in m). */
	heightm: number;
	/** Color. */
	color: string;
	/** Does this Pokemon have an unreleased hidden ability? */
	unreleasedHidden: boolean;
	/**
	 * Is it only possible to get the hidden ability on a male pokemon?
	 * This is mainly relevant to Gen 5.
	 */
	maleOnlyHidden: boolean;
	/** True if a pokemon is mega. */
	isMega?: boolean;
	/** True if a pokemon is primal. */
	isPrimal?: boolean;
	/** True if a pokemon is a forme that is only accessible in battle. */
	battleOnly?: boolean;
	/** Required item. Do not use this directly; see requiredItems. */
	requiredItem?: string;
	/** Required move. Move required to use this forme in-battle. */
	requiredMove?: string;
	/** Required ability. Ability required to use this forme in-battle. */
	requiredAbility?: string;
	/**
	 * Required items. Items required to be in this forme, e.g. a mega
	 * stone, or Griseous Orb. Array because Arceus formes can hold
	 * either a Plate or a Z-Crystal.
	 */
	requiredItems?: string[];

	/**
	 * Keeps track of exactly how a pokemon might learn a move, in the
	 * form moveid:sources[].
	 */
	learnset?: {[moveid: string]: MoveSource[]};
	/** True if the only way to get this pokemon is from events. */
	eventOnly: boolean;
	/** List of event data for each event. */
	eventPokemon?: EventInfo[] ;

	/**
	 * Singles Tier. The Pokemon's location in the Smogon tier system.
	 * Do not use for LC bans (usage tier will override LC Uber).
	 */
	tier: string;
	/**
	 * Doubles Tier. The Pokemon's location in the Smogon doubles tier system.
	 * Do not use for LC bans (usage tier will override LC Uber).
	 */
	doublesTier: string;
	randomBattleMoves?: ID[];
	randomDoubleBattleMoves?: ID[];
	exclusiveMoves?: ID[];
	comboMoves?: ID[];
	essentialMove?: ID;
}

export class Move extends BasicEffect implements Readonly<BasicEffect & MoveData> {
	effectType: 'Move';
	/** Move type. */
	type: string;
	/** Move target. */
	target: string;
	/** Move base power. */
	basePower: number;
	/** Move base accuracy. True denotes a move that always hits. */
	accuracy: true | number;
	/** Critical hit ratio. Defaults to 1. */
	critRatio: number;
	/** Will this move always or never be a critical hit? */
	willCrit?: boolean;
	/** Can this move OHKO foes? */
	ohko?: boolean | string;
	/**
	 * Base move type. This is the move type as specified by the games,
	 * tracked because it often differs from the real move type.
	 */
	baseMoveType: string;
	/**
	 * Secondary effect. You usually don't want to access this
	 * directly; but through the secondaries array.
	 */
	secondary: SecondaryEffect | null;
	/**
	 * Secondary effects. An array because there can be more than one
	 * (for instance, Fire Fang has both a burn and a flinch
	 * secondary).
	 */
	secondaries: SecondaryEffect[] | null;
	/**
	 * Move priority. Higher priorities go before lower priorities,
	 * trumping the Speed stat.
	 */
	priority: number;
	/** Move category. */
	category: MoveCategory;
	/**
	 * Category that changes which defense to use when calculating
	 * move damage.
	 */
	defensiveCategory?: MoveCategory;
	/** Whether or not this move uses the target's boosts. */
	useTargetOffensive: boolean;
	/** Whether or not this move uses the user's boosts. */
	useSourceDefensive: boolean;
	/** Whether or not this move ignores negative attack boosts. */
	ignoreNegativeOffensive: boolean;
	/** Whether or not this move ignores positive defense boosts. */
	ignorePositiveDefensive: boolean;
	/** Whether or not this move ignores attack boosts. */
	ignoreOffensive: boolean;
	/** Whether or not this move ignores defense boosts. */
	ignoreDefensive: boolean;
	/**
	 * Whether or not this move ignores type immunities. Defaults to
	 * true for Status moves and false for Physical/Special moves.
	 */
	ignoreImmunity: AnyObject | boolean;
	/** Base move PP. */
	pp: number;
	/** Whether or not this move can receive PP boosts. */
	noPPBoosts: boolean;
	/** Is this move a Z-Move? */
	isZ: boolean | string;
	flags: MoveFlags;
	/** Whether or not the user must switch after using this move. */
	selfSwitch?: ID | boolean;
	/** Move target only used by Pressure. */
	pressureTarget: string;
	/** Move target used if the user is not a Ghost type (for Curse). */
	nonGhostTarget: string;
	/** Whether or not the move ignores abilities. */
	ignoreAbility: boolean;
	/**
	 * Move damage against the current target
	 * false = move will always fail with "But it failed!"
	 * null = move will always silently fail
	 * undefined = move does not deal fixed damage
	 */
	damage: number | 'level' | false | null;
	/** Whether or not this move hit multiple targets. */
	spreadHit: boolean;
	/** Modifier that affects damage when multiple targets are hit. */
	spreadModifier?: number;
	/**  Modifier that affects damage when this move is a critical hit. */
	critModifier?: number;
	/** Forces the move to get STAB even if the type doesn't match. */
	forceSTAB: boolean;
	/** True if it can't be copied with Sketch. */
	noSketch: boolean;
	/** STAB multiplier (can be modified by other effects) (default 1.5). */
	stab?: number;

	volatileStatus?: ID;
}

export class TypeInfo implements Readonly<TypeData> {
	/**
	 * ID. This will be a lowercase version of the name with all the
	 * non-alphanumeric characters removed. e.g. 'flying'
	 */
	id: ID;
	/** Name. e.g. 'Flying' */
	name: string;
	/** Effect type. */
	effectType: TypeInfoEffectType;
	/**
	 * Does it exist? For historical reasons, when you use an accessor
	 * for an effect that doesn't exist, you get a dummy effect that
	 * doesn't do anything, and this field set to false.
	 */
	exists: boolean;
	/**
	 * The generation of Pokemon game this was INTRODUCED (NOT
	 * necessarily the current gen being simulated.) Not all effects
	 * track generation; this will be 0 if not known.
	 */
	gen: number;
	/**
	 * Type chart, attackingTypeName:result, effectid:result
	 * result is: 0 = normal, 1 = weakness, 2 = resistance, 3 = immunity
	 */
	damageTaken: {[attackingTypeNameOrEffectid: string]: number};
	/** The IVs to get this Type Hidden Power (in gen 3 and later) */
	HPivs: SparseStatsTable;
	/** The DVs to get this Type Hidden Power (in gen 2). */
	HPdvs: SparseStatsTable;
}

// FIXME Icon Indexes

class Move implements Effect {
	// effect
	effectType = 'Move';
	id: ID;
	name: string;
	gen: number;
	exists: boolean;

	basePower: number;
	accuracy: number | true;
	pp: number;
	type: TypeName;
	category: 'Physical' | 'Special' | 'Status';
	priority: number;
	target:
		'normal' | 'any' | 'adjacentAlly' | 'adjacentFoe' | 'adjacentAllyOrSelf' | // single-target
		'self' | 'randomNormal' | // single-target, automatic
		'allAdjacent' | 'allAdjacentFoes' | // spread
		'allySide' | 'foeSide' | 'all'; // side and field
	flags: Readonly<MoveFlags>;
	critRatio: number;

	desc: string;
	shortDesc: string;
	isViable: boolean;
	isNonstandard: boolean;
	isZ: ID;
	zMovePower: number;
	zMoveEffect: string;
	zMoveBoost: {[stat in StatName]?: number} | null;
	ohko: true | 'Ice' | null;
	recoil: number[] | null;
	heal: number[] | null;
	hasCustomRecoil: boolean;
	noPPBoosts: boolean;
	secondaries: ReadonlyArray<any> | null;
	num: number;
}

class Template implements Effect {
	// effect
	effectType = 'Template';
	id: ID;
	name: string;
	gen: number;
	exists: boolean;

	// name
	species: string;
	speciesid: ID;
	baseSpecies: string;
	forme: string;
	formeid: string;
	spriteid: string;
	baseForme: string;

	// basic data
	num: number;
	types: ReadonlyArray<TypeName>;
	abilities: Readonly<{
		0: string, 1?: string, H?: string, S?: string,
	}>;
	baseStats: Readonly<{
		hp: number, atk: number, def: number, spa: number, spd: number, spe: number,
	}>;
	weightkg: number;

	// flavor data
	heightm: number;
	gender: GenderName;
	color: string;
	genderRatio: Readonly<{M: number, F: number}> | null;
	eggGroups: ReadonlyArray<string>;

	// format data
	otherFormes: ReadonlyArray<ID> | null;
	// TODO: rename to cosmeticForms
	otherForms: ReadonlyArray<ID> | null;
	evos: ReadonlyArray<ID> | null;
	prevo: ID;
	evoLevel: number;
	evoType: 'trade' | 'stone' | 'levelMove' | 'levelExtra' | '';
	requiredItem: string;
	tier: string;
	isTotem: boolean;
	isMega: boolean;
	isPrimal: boolean;
	battleOnly: boolean;
	isNonstandard: boolean;
	unreleasedHidden: boolean;
}

interface SpriteData {
	w: number;
	h: number;
	y?: number;
	gen?: number;
	url?: string;
	rawHTML?: string;
	pixelated?: boolean;
	isBackSprite?: boolean;
	cryurl?: string;
	shiny?: boolean;
}

getEffect(name: string | null | undefined): PureEffect | Item | Ability | Move;
getMove(nameOrMove: string | Move | null | undefined): Move;
getGen3Category(type: string);
getItem(nameOrItem: string | Item | null | undefined): Item;
getAbility(nameOrAbility: string | Ability | null | undefined): Ability;
getTemplate(nameOrTemplate: string | Template | null | undefined): Template;
getTier(pokemon: Template, gen = 7, isDoubles = false): string;
getType(type: any): Effect;
hasAbility(template: Template, ability: string);
getSpriteData(pokemon: Pokemon | Template | string, siden: number, options: {
	gen?: number, shiny?: boolean, gender?: GenderName, afd?: boolean, noScale?: boolean, mod?: string,
} = {gen: 6});
	getPokemonIconNum(id: ID, isFemale?: boolean, facingLeft?: boolean);
	getPokemonIcon(pokemon: any, facingLeft?: boolean);
	getTeambuilderSprite(pokemon: any, gen: number = 0);

	getItemIcon(item: any);
	getTypeIcon(type: string, b?: boolean);

///////

export interface MoveData {
  bp: number;
  type: Type;
  category?: Category;
  hasSecondaryEffect?: boolean;
  isSpread?: boolean | 'allAdjacent';
  makesContact?: boolean;
  hasRecoil?: Recoil;
  alwaysCrit?: boolean;
  givesHealth?: boolean;
  percentHealed?: number;
  ignoresBurn?: boolean;
  isPunch?: boolean;
  isBite?: boolean;
  isBullet?: boolean;
  isSound?: boolean;
  isPulse?: boolean;
  hasPriority?: boolean;
  dropsStats?: number;
  ignoresDefenseBoosts?: boolean;
  dealsPhysicalDamage?: boolean;
  bypassesProtect?: boolean;
  isZ?: boolean;
  usesHighestAttackStat?: boolean;
  zp?: number;
  isMultiHit?: boolean;
  isTwoHit?: boolean;
}

export interface Species {
  t1: Type; // type1
  t2?: Type; // type2
  bs: {
    hp: number;
    at: number;
    df: number;
    sa: number;
    sd: number;
    sp: number;
    sl?: number;
  }; // baseStats
  w: number; // weight
  canEvolve?: boolean;
  gender?: Gender;
  formes?: string[];
  isAlternateForme?: boolean;
  ab?: string; // ability
}

/////////////////////////////
export interface Ability extends Data {}

const ALIASES: Readonly<{[id: string]: string}> = aliases;

export type Effect = Ability|Move|Item;
export class Effects {
  static get(e: ID|string|undefined, gen: Generation = CURRENT): Effect;
}

interface SelfEffect {
  volatileStatus?: string;
  boosts?: Partial<BoostsTable>;
}

interface SecondaryEffect {
  chance?: number;
  boosts?: Partial<BoostsTable>;
  self?: SelfEffect;
  status?: Status;
  volatileStatus?: string;
}

export interface Move extends Data {
  basePower?: number;
  type: Type;
  pp: number;
  accuracy: number|true;
  category?: Category;
  defensiveCategory?: Category;
  target: Target;
  priority?: number;
  flags?: Readonly<Flags>;
  status?: Status;
  sideCondition?: string;
  volatileStatus?: string;
  boosts?: Partial<BoostsTable>;
  self?: SelfEffect;
  secondaries?: SecondaryEffect[];
  critRatio?: number;
  willCrit?: boolean;
  isZ?: ID;
  zMovePower?: number;
  zMoveBoosts?: Partial<BoostsTable>;
  multihit?: number|number[];
  percentHealed?: number;
  recoil?: Recoil;
  breaksProtect?: boolean;
  ignoreDefensive?: boolean;
  ohko?: boolean;
}

class Sets {
	packSet(s: PokemonSet): string;
	unpackSet(s: string): PokemonSet;
	exportSet(s: PokemonSet): string;
	importSet(s: string): PokemonSet;
}
class Teams {
	pakTeam(s: PokemonSet): string;
	unpackTeam(s: string): PokemonSet;
	exportTeam(s: PokemonSet): string;
	exportTeams(s: PokemonSet): string;
	importTeam(s: string): PokemonSet;
	importTeams(s: string): PokemonSet;
}

export interface Species extends Data {
  type1: Type;
  type2?: Type;
  baseStats: Readonly<StatsTable>;
  weight: number;
  gender?: Gender;
  abilities?:
      Readonly<{0: string, 1?: string, H?: string, S?: string}>;
  tier?: Tier;
  prevo?: ID;
  evos?: Readonly<ID[]>;
  baseSpecies: string;
  baseForme?: string;
  forme?: string;
  formeLetter?: string;
  otherFormes?: ID[];
  cosmeticForms?: Readonly<ID[]>;
  isMega?: boolean;
  isPrimal?: boolean;
}

class Species() {
  static getName(
      s: ID|string|undefined,
      /* istanbul ignore next: @cache */ gen: Generation = CURRENT): string
      |undefined;

  static get(
      s: ID|string|undefined,
      /* istanbul ignore next: @cache */ gen: Generation = CURRENT): Species
      |undefined;
}










































class Dex {

	Natures: Natures;
	Types: Types;
	Stats: Stats;
	Abilities: Abilities;
	Items: Items;
	Moves: Moves;
	Species: Species;


	// TODO: possibly add shortcut methods?
	// getNature(string): Nature|undefined;
	// ...
	// getSpecies(string):





}

class Natures {
  get(n: ID|string): Nature|undefined;
  entries(): Iterator<Nature>;
  fromString(s: string): Nature|undefined;
}


class Types {
  static get(): TypeChart;
  static chart(): TypeChart;
  static hiddenPower(pivs: Readonly<Partial<StatsTable>>): {type: Type, basePower: number}|undefined;
  static hiddenPowerDVs(t: Type): Readonly<Partial<StatsTable>>|undefined;
  static hiddenPowerIVs(t: Type): Readonly<Partial<StatsTable>>|undefined;
  static category(t: Type): Category;
}

export class Stats {
  static calc(
      stat: Stat, base: number, iv: number, ev: number, level: number,
	  gn?: Generation|Nature, g: Generation = CURRENT);

  static get(s: ID|string): Stat|undefined;

  static fromString(s: string): Stat|undefined;

  static display(str: string, full: boolean = true): string;
  static fill(p: Readonly<Partial<StatsTable>>, val: number = 31): StatsTable
  static itod(iv: number): number;
  static dtoi(dv: number): number;
  static getHPDV(pivs: Readonly<Partial<StatsTable>>): number;
}

dex.stats()




//////////////////////////////


export class ModdedDex {
	Data: typeof Data;
	ModdedDex: typeof ModdedDex;

	name: string;
	isBase: boolean;
	currentMod: string;

	getId: (text: any) => ID;
	getString: (str: any) => string;

	abilityCache: Map<ID, Ability>;
	effectCache: Map<ID, Effect | Move>;
	itemCache: Map<ID, Item>;
	moveCache: Map<ID, Move>;
	templateCache: Map<ID, Template>;
	typeCache: Map<string, TypeInfo>;

	gen: number;
	parentMod: string;
	modsLoaded: boolean;

	dataCache: DexTableData | null;
	formatsCache: DexTable<Format> | null;

	get dataDir(): string;
	get data(): DexTableData;
	get formats(): DexTable<Format>;
	get dexes(): {[mod: string]: ModdedDex};
	mod(mod: string | undefined): ModdedDex;
	forFormat(format: Format | string): ModdedDex;
	modData(dataType: DataType, id: string);
	/**
	 * Returns false if the target is immune; true otherwise.
	 * Also checks immunity to some statuses.
	 */
	getImmunity(
		source: {type: string} | string,
		target: {getTypes: () => string[]} | {types: string[]} | string[] | string
	): boolean;

	getEffectiveness(
		source: {type: string} | string,
		target: {getTypes: () => string[]} | {types: string[]} | string[] | string
	): number;
	/**
	 * Convert a pokemon name, ID, or template into its species name, preserving
	 * form name (which is the main way Dex.getSpecies(id) differs from
	 * Dex.getTemplate(id).species).
	 */
	getSpecies(species: string | Template): string;
	getTemplate(name?: string | Template): Template;
	getLearnset(template: string | AnyObject): AnyObject | null;
	getMove(name?: string | Move): Move;

	/**
	 * While this function can technically return any kind of effect at
	 * all, that's not a feature TypeScript needs to know about.
	 */
	getEffect(name?: string | Effect | null): Effect;
	getEffectByID(id: ID, effect?: Effect | Move): Effect;


	getFormat(name?: string | Format, isTrusted = false): Format;
	getItem(name?: string | Item): Item;
	getAbility(name: string | Ability = ''): Ability;
	getType(name: string | TypeInfo): TypeInfo;
	getNature(name: string | Nature): Nature;

	getAwakeningValues(set: PokemonSet, statName?: string);

	/** Given a table of base stats and a pokemon set, return the actual stats. */
	spreadModify(baseStats: StatsTable, set: PokemonSet): StatsTable;

	natureModify(stats: StatsTable, set: PokemonSet): StatsTable;

	getHiddenPower(ivs: AnyObject): {type: string, power: number};

	packTeam(team: PokemonSet[] | null): string;

	fastUnpackTeam(buf: string): PokemonSet[] | null;
}


