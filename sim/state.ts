/**
 * Simulator State
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * @license MIT
 */

import {Battle} from './battle';
import Dex = require('./dex');
import * as Data from './dex-data';
import {Field} from './field';
import {Pokemon} from './pokemon';
import {PRNG} from './prng';
import {Choice, Side} from './side';

const POSITIONS = 'abcdefghijklmnopqrstuvwx';

type Referable = Battle | Field | Side | Pokemon | PureEffect | Ability | Item | Move | Template;

const BATTLE = new Set([
	...Object.keys(Dex), 'inherit', 'cachedFormat', 'zMoveTable', 'teamGenerator',
	'NOT_FAIL', 'FAIL', 'SILENT_FAIL', 'field', 'sides', 'prng', 'hints', 'deserialized',
]);
const FIELD = new Set(['id', 'battle']);
const SIDE = new Set(['battle', 'team', 'pokemon', 'choice']);
const POKEMON = new Set([
	'side', 'battle', 'set', 'name', 'fullname', 'id', 'species', 'speciesid', 'happiness',
	'level', 'pokeball', 'baseTemplate', 'baseHpType', 'baseHpPower', 'baseMoveSlots',
]);
const CHOICE = new Set(['switchIns']);
const ACTIVE_MOVE = new Set(['move']);

export const State = new class {
	private REFERABLE?: Set<Referable>;

	serializeBattle(battle: Battle): /* Battle */ AnyObject {
		const state: /* Battle */ AnyObject = this.serialize(battle, BATTLE, battle);
		state.field = this.serializeField(battle.field);
		state.sides = new Array(battle.sides.length);
		for (const [i, side] of battle.sides.entries()) {
			state.sides[i] = this.serializeSide(side);
		}
		state.prng = battle.prng.seed;
		state.hints = Array.from(battle.hints);
		return state;
	}

	deserializeBattle(
		serialized: string | /* Battle */ AnyObject,
		send?: (type: string, data: string | string[]) => void
	): Battle {
		const state: /* Battle */ AnyObject =
			typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
		const options = {
			formatid: state.format,
			send,
			seed: state.prngSeed,
			rated: state.rated,
			debug: state.debugMode,
			deserialized: true,
			strictChoices: state.strictChoices,
		};
		for (const side of state.sides) {
			// @ts-ignore - index signature
			options[side.id] = {
				name: side.name,
				avatar: side.avatar,
				team: side.team.split('').map((p: string) => side.pokemon[POSITIONS.indexOf(p)].set),
			};
		}
		const battle = new Battle(options);
		this.deserialize(state, battle, BATTLE, battle);
		this.deserializeField(state.field, battle.field);
		for (const [i, side] of state.sides.entries()) {
			this.deserializeSide(side, battle.sides[i]);
		}
		battle.prng = new PRNG(state.prng);
		// @ts-ignore - readonly
		battle.hints = new Set(battle.hints);
		return battle;
	}

	serializeField(field: Field): /* Field */ AnyObject {
		return this.serialize(field, FIELD, field.battle);
	}

	private deserializeField(state: /* Field */ AnyObject, field: Field) {
		this.deserialize(state, field, FIELD, field.battle);
	}

	serializeSide(side: Side): /* Side */ AnyObject {
		const state: /* Side */ AnyObject = this.serialize(side, SIDE, side.battle);
		state.pokemon = new Array(side.pokemon.length);
		const team = new Array(side.pokemon.length);
		for (const [i, pokemon] of side.pokemon.entries()) {
			state.pokemon[i] = this.serializePokemon(pokemon);
			team[side.team.indexOf(pokemon.set)] = POSITIONS[i];
		}
		state.team = team.join('');
		state.choice = this.serializeChoice(side.choice, side.battle);
		return state;
	}

	private deserializeSide(state: /* Side */ AnyObject, side: Side) {
		this.deserialize(state, side, SIDE, side.battle);
		const ordered = new Array(side.pokemon.length);
		for (const [i, pos] of state.team.split('').entries()) {
			ordered[POSITIONS.indexOf(pos)] = side.pokemon[i];
		}
		side.pokemon = ordered;
		for (const [i, pokemon] of state.pokemon.entries()) {
			this.deserializePokemon(pokemon, side.pokemon[i]);
		}
		this.deserializeChoice(state.choice, side.choice, side.battle);
	}

	serializePokemon(pokemon: Pokemon): /* Pokemon */ AnyObject {
		const state: /* Pokemon */ AnyObject = this.serialize(pokemon, POKEMON, pokemon.battle);
		state.set = pokemon.set;
		return state;
	}

	private deserializePokemon(state: /* Pokemon */ AnyObject, pokemon: Pokemon) {
		this.deserialize(state, pokemon, POKEMON, pokemon.battle);
		// @ts-ignore - readonly
		pokemon.set = state.set;
	}

	private serializeChoice(choice: Choice, battle: Battle): /* Choice */ AnyObject {
		const state: /* Choice */ AnyObject = this.serialize(choice, CHOICE, battle);
		state.switchIns = Array.from(choice.switchIns as Set<number>);
		return state;
	}

	private deserializeChoice(state: /* Choice */ AnyObject, choice: Choice, battle: Battle) {
		this.deserialize(state, choice, CHOICE, battle);
		choice.switchIns = new Set(state.switchIns);
	}

	private isActiveMove(obj: AnyObject) {
		return obj.hasOwnProperty('hit') && obj.hasOwnProperty('id');
	}

	private serializeActiveMove(move: ActiveMove, battle: Battle): /* ActiveMove */ AnyObject {
		const skip = new Set([...Object.keys(battle.getMove(move.id)), ...ACTIVE_MOVE]);
		const state: /* ActiveMove */ AnyObject = this.serialize(move, skip, battle);
		state.move = `[Move:${move.id}]`;
		return state;
	}

	private deserializeActiveMove(state: /* ActiveMove */ AnyObject, battle: Battle): ActiveMove {
		const move = battle.getActiveMove(this.fromRef(state.move, battle)! as Move);
		this.deserialize(state, move, ACTIVE_MOVE, battle);
		return move;
	}

	private serializeWithRefs(obj: any, battle: Battle): any {
		switch (typeof obj) {
			case 'function':
				return undefined; // elide functions
			case 'undefined':
			case 'boolean':
			case 'number':
			case 'string':
				return obj;
			case 'object':
				if (obj === null) return null;
				if (Array.isArray(obj)) {
					const arr = new Array(obj.length);
					for (const [i, o] of obj.entries()) {
						arr[i] = this.serializeWithRefs(o, battle);
					}
					return arr;
				}

				if (this.isActiveMove(obj)) return this.serializeActiveMove(obj, battle);
				if (this.isReferable(obj)) return this.toRef(obj);
				if (obj.constructor !== Object) {
					throw new TypeError(`Unsupported type ${obj.constructor.name}: ${obj}`);
				}

				const o: any = {};
				for (const [key, value] of Object.entries(obj)) {
					o[key] = this.serializeWithRefs(value, battle);
				}
				return o;
			default:
				throw new TypeError(`Unexpected typeof === '${typeof obj}': ${obj}`);
		}
	}

	private deserializeWithRefs(obj: any, battle: Battle) {
		switch (typeof obj) {
			case 'undefined':
			case 'boolean':
			case 'number':
				return obj;
			case 'string':
				return this.fromRef(obj, battle) || obj;
			case 'object':
				if (obj === null) return null;
				if (Array.isArray(obj)) {
					const arr = new Array(obj.length);
					for (const [i, o] of obj.entries()) {
						arr[i] = this.deserializeWithRefs(o, battle);
					}
					return arr;
				}

				if (this.isActiveMove(obj)) return this.deserializeActiveMove(obj, battle);

				const o: any = {};
				for (const [key, value] of Object.entries(obj)) {
					o[key] = this.deserializeWithRefs(value, battle);
				}
				return o;
			case 'function': // lol wtf
			default:
				throw new TypeError(`Unexpected typeof === '${typeof obj}': ${obj}`);
		}
	}

	// NOTE: Can't be a constant because Battle and Field will be undefined due
	// to being circular dependencies.
	// NOTE: Formats which use onModifyTemplate will not be properly serializable.
	private isReferable(obj: any): boolean {
		if (!this.REFERABLE) {
			// @ts-ignore - globals.ts nonsense
			this.REFERABLE = new Set([
				Battle, Field, Side, Pokemon, Data.PureEffect,
				Data.Ability, Data.Item, Data.Move, Data.Template,
			]);
		}
		return this.REFERABLE!.has(obj.constructor);
	}

	private isRef(s: string): boolean {
		return s[0] === '[' && s[s.length - 1] === ']';
	}

	private toRef(obj: Referable): string {
		const id = obj instanceof Pokemon ? `${obj.side.id}${POSITIONS[obj.position]}` : `${obj.id}`;
		return `[${obj.constructor.name}${id ? ':' : ''}${id}]`;
	}

	private fromRef(ref: string, battle: Battle): Referable | undefined {
		if (!this.isRef(ref)) return undefined;

		ref = ref.substring(1, ref.length - 1);
		if (ref === 'Battle') return battle;
		if (ref === 'Field') return battle.field;

		const [type, id] = ref.split(':');
		switch (type) {
			case 'Side': return battle.sides[Number(id[1]) - 1];
			case 'Pokemon': return battle.sides[Number(id[1]) - 1].pokemon[POSITIONS.indexOf(id[2])];
			case 'Ability': return battle.getAbility(id);
			case 'Item': return battle.getItem(id);
			case 'Move': return battle.getMove(id);
			case 'PureEffect': return battle.getEffect(id);
			case 'Template': return battle.getTemplate(id);
			default: throw new TypeError(`Unknown reference type '${type}'`);
		}
	}

	private serialize(obj: any, skip: Set<string>, battle: Battle): AnyObject {
		const state: AnyObject = {};
		for (const [key, value] of Object.entries(obj)) {
			if (skip.has(key)) continue;
			state[key] = this.serializeWithRefs(value, battle);
		}
		return state;
	}

	private deserialize(state: AnyObject, obj: any, skip: Set<string>, battle: Battle) {
		for (const [key, value] of Object.entries(state)) {
			if (skip.has(key)) continue;
			obj[key] = this.deserializeWithRefs(value, battle);
		}
	}
};