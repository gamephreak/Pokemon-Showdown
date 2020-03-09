/**
 * Example random player AI.
 *
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * @license MIT
 */

import {ObjectReadWriteStream} from '../../lib/streams';
import {BattlePlayer} from '../battle-stream';
import {PRNG, PRNGSeed} from '../prng';

export interface Request {
	rqid: number;
	active: RequestActivePokemon[];
	side: {
		name: string,
		id: string,
		pokemon: RequestPokemon[],
	};
	forceSwitch?: [true] & boolean[];
	wait?: boolean;
}

export interface RequestActivePokemon {
	trapped?: boolean;
	maybeDisabled?: boolean;
	maybeTrapped?: boolean;
	canMegaEvo?: boolean;
	canUltraBurst?: boolean;
	canZMove?: ZMoveOptions;
	canDynamax?: boolean;
	maxMoves?: DynamaxOptions;
	moves: {
		move: string,
		id: ID,
		pp: number,
		maxpp: number,
		target: MoveTarget,
		disabled: string | boolean,
	}[];
}

export interface RequestPokemon {
	active?: boolean;
	details: string;
	ident: string;
	pokeball: ID;
	ability: ID;
	baseAbility: ID;
	condition: string;
	item: ID;
	moves: ID[];
	stats: StatsTable;
}

export interface MoveOption {
	slot: number;
	move: string;
	target: string;
	maxMove?: boolean;
	zMove?: boolean;
}

export class RandomPlayerAI extends BattlePlayer {
	protected readonly prng: PRNG;

	constructor(
		playerStream: ObjectReadWriteStream<string>,
		seed?: PRNG | PRNGSeed,
		debug = false
	) {
		super(playerStream, debug);
		this.prng = seed && !Array.isArray(seed) ? seed : new PRNG(seed);
	}

	receiveError(error: Error) {
		// If we made an unavailable choice we will receive a followup request to
		// allow us the opportunity to correct our decision.
		if (error.message.startsWith('[Unavailable choice]')) return;
		throw error;
	}

	receiveRequest(request: Request) {
		if (request.wait) {
			// wait request
			// do nothing
		} else if (request.forceSwitch) {
			// switch request
			const pokemon = request.side.pokemon;
			const chosen: number[] = [];
			const choices = request.forceSwitch.map((mustSwitch: boolean, i: number) => {
				if (!mustSwitch) return `pass`;

				const canSwitch = range(1, 6).filter(j => (
					pokemon[j - 1] &&
					// not active
					j > request.forceSwitch!.length &&
					// not chosen for a simultaneous switch
					!chosen.includes(j) &&
					// not fainted
					!pokemon[j - 1].condition.endsWith(` fnt`)
				));

				if (!canSwitch.length) return `pass`;
				const target = this.chooseForceSwitch(
					request.active && request.active[i],
					canSwitch.map(slot => ({slot, pokemon: pokemon[slot - 1]}))
				);
				chosen.push(target);
				return `switch ${target}`;
			});

			this.choose(choices.join(`, `));
		} else if (request.active) {
			// move request
			let [canMegaEvo, canUltraBurst, canZMove, canDynamax] = [true, true, true, true];
			const pokemon = request.side.pokemon;
			const chosen: number[] = [];
			const choices = request.active.map((active: RequestActivePokemon, i: number) => {
				if (pokemon[i].condition.endsWith(` fnt`)) return `pass`;

				canMegaEvo = canMegaEvo && !!active.canMegaEvo;
				canUltraBurst = canUltraBurst && !!active.canUltraBurst;
				canZMove = canZMove && !!active.canZMove;
				canDynamax = canDynamax && !!active.canDynamax;

				const isDynamax = !active.canDynamax && active.maxMoves;

				let canMove: MoveOption[] = [];
				if (!isDynamax) {
					canMove.push(...range(1, active.moves.length).filter(j => (
						// not disabled
						!active.moves[j - 1].disabled
						// NOTE: we don't actually check for whether we have PP or not because the
						// simulator will mark the move as disabled if there is zero PP and there are
						// situations where we actually need to use a move with 0 PP (Gen 1 Wrap).
					)).map(j => ({
						slot: j,
						move: active.moves[j - 1].move,
						target: active.moves[j - 1].target,
					})));
				}
				if (active.maxMoves) {
					const maxMoves: DynamaxOptions['maxMoves'] = active.maxMoves.maxMoves;
					canMove.push(...range(1, maxMoves.length).filter(j => (
						// not disabled
						!maxMoves[j - 1].disabled
					)).map(j => ({
						slot: j,
						move: maxMoves[j - 1].move,
						target: maxMoves[j - 1].target,
						maxMove: true,
					})));
				} else if (canZMove) {
					canMove.push(...range(1, active.canZMove!.length)
						.filter(j => active.canZMove![j - 1])
						.map(j => ({
							slot: j,
							move: active.canZMove![j - 1]!.move,
							target: active.canZMove![j - 1]!.target,
							zMove: true,
						})));
				}

				// Filter out adjacentAlly moves if we have no allies left, unless they're our
				// only possible move options.
				const hasAlly = pokemon.length > 1 && !pokemon[i ^ 1].condition.endsWith(` fnt`);
				const filtered = canMove.filter(m => m.target !== `adjacentAlly` || hasAlly);
				canMove = filtered.length ? filtered : canMove;

				const moves: {choice: string, move: MoveOption}[] = [];
				for (const m of canMove) {
					let move = `move ${m.slot}`;
					if (request.active.length > 1) {
						if ([`normal`, `any`, `adjacentFoe`].includes(m.target)) {
							moves.push(toMoveChoice(m, `${move} 1`));
							moves.push(toMoveChoice(m, `${move} 2`));
							continue;
						} else if (m.target === `adjacentAlly`) {
							move += ` -${(i ^ 1) + 1}`;
						} else if (m.target === `adjacentAllyOrSelf`) {
							if (hasAlly) {
								moves.push(toMoveChoice(m, `${move} -1`));
								moves.push(toMoveChoice(m, `${move} -2`));
								continue;
							} else {
								move += ` -${i + 1}`;
							}
						}
					}
					moves.push(toMoveChoice(m, move));
				}

				const canSwitch = range(1, 6).filter(j => (
					pokemon[j - 1] &&
					// not active
					!pokemon[j - 1].active &&
					// not chosen for a simultaneous switch
					!chosen.includes(j) &&
					// not fainted
					!pokemon[j - 1].condition.endsWith(` fnt`)
				));
				const switches = active.trapped ? [] : canSwitch.map(slot => ({slot, pokemon: pokemon[slot - 1]}));
				if (!switches.length && !moves.length) {
					throw new Error(`${this.constructor.name} unable to make choice ${i}. request='${request}',` +
					` chosen='${chosen}', (mega=${canMegaEvo}, ultra=${canUltraBurst}, zmove=${canZMove},` +
					` dynamax='${canDynamax}')`);
				}

				const canFormeChange = canMegaEvo || canUltraBurst || canDynamax;
				const decision = this.makeDecision(active, moves, switches, canFormeChange);
				if (decision.type === 'move') {
					const move = decision.choice;
					if (move.endsWith(` zmove`)) {
						canZMove = false;
						return move;
					} else if (decision.formeChange) {
						if (canDynamax) {
							canDynamax = false;
							return `${move} dynamax`;
						} else if (canMegaEvo) {
							canMegaEvo = false;
							return `${move} mega`;
						} else {
							canUltraBurst = false;
							return `${move} ultra`;
						}
					} else {
						return move;
					}
				} else {
					chosen.push(decision.slot);
					return `switch ${decision.slot}`;
				}
			});
			this.choose(choices.join(`, `));
		} else {
			// team preview?
			this.choose(this.chooseTeamPreview(request.side.pokemon));
		}
	}

	protected chooseTeamPreview(team: RequestPokemon[]): string {
		return `default`;
	}

	protected chooseForceSwitch(
		active: RequestActivePokemon | undefined,
		switches: {slot: number, pokemon: RequestPokemon}[]
	): number {
		return this.chooseSwitch(active, switches).slot;
	}

	protected makeDecision(
		active: RequestActivePokemon,
		moves: {choice: string, move: MoveOption}[],
		switches: {slot: number, pokemon: RequestPokemon}[],
		canFormeChange: boolean,
	): {type: 'switch', slot: number} | {type: 'move', choice: string, formeChange: boolean} {
		if (this.prng.next(0, switches.length + moves.length) < switches.length) {
			return {type: 'switch', slot: this.chooseSwitch(active, switches).slot};
		} else {
			return {type: 'move', choice: this.chooseMove(active, moves).choice, formeChange: canFormeChange};
		}
	}

	protected chooseSwitch(_: RequestActivePokemon | undefined, switches: {slot: number, pokemon: RequestPokemon}[]) {
		return this.prng.sample(switches);
	}

	protected chooseMove(_: RequestActivePokemon, moves: {choice: string, move: MoveOption}[]) {
		return this.prng.sample(moves);
	}
}

function toMoveChoice(move: MoveOption, choice: string) {
	return {choice: move.zMove ? `${choice} zmove` : choice, move};
}

// Creates an array of numbers progressing from start up to and including end
function range(start: number, end?: number, step = 1) {
	if (end === undefined) {
		end = start;
		start = 0;
	}
	const result = [];
	for (; start <= end; start += step) {
		result.push(start);
	}
	return result;
}
