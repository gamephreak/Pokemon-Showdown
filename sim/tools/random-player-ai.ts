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

export class RandomPlayerAI extends BattlePlayer {
	protected readonly move: number;
	protected readonly mega: number;
	protected readonly prng: PRNG;

	constructor(
		playerStream: ObjectReadWriteStream<string>,
		options: {move?: number, mega?: number, seed?: PRNG | PRNGSeed | null } = {},
		debug = false
	) {
		super(playerStream, debug);
		this.move = options.move || 1.0;
		this.mega = options.mega || 0;
		this.prng = options.seed && !Array.isArray(options.seed) ? options.seed : new PRNG(options.seed);
	}

	receiveError(error: Error) {
		// If we made an unavailable choice we will receive a followup request to
		// allow us the opportunity to correct our decision.
		if (error.message.startsWith('[Unavailable choice]')) return;
		throw error;
	}

	receiveRequest(request: AnyObject) {
		if (request.wait) {
			// wait request
			// do nothing
		} else if (request.forceSwitch) {
			// switch request
			const pokemon = request.side.pokemon;
			const chosen: number[] = [];
			const choices: string[] = [];
			for (const mustSwitch of request.forceSwitch) {
				if (!mustSwitch) {
					choices.push(`pass`);
					continue;
				}

				const options = [];
				for (let i = 1; i <= 6; i++) {
					if (pokemon[i - 1] &&
						// not active
						i > request.forceSwitch.length &&
						// not chosen for a simultaneous switch
						!chosen.includes(i) &&
						// not fainted
						!pokemon[i - 1].condition.endsWith(` fnt`)) {
						options.push({slot: i, pokemon: pokemon[i - 1]});
					}
				}

				if (!options.length) {
					choices.push(`pass`);
					continue;
				}

				const target = this.chooseSwitch(request.active, options);
				chosen.push(target);
				choices.push(`switch ${target}`);
			}

			this.choose(choices.join(`, `));
		} else if (request.active) {
			// move request
			let [canMegaEvo, canUltraBurst, canZMove, canDynamax] = [true, true, true, true];
			const pokemon = request.side.pokemon;
			const chosen: number[] = [];
			const choices: string[] = [];
			for (let i = 0; i < request.active.length; i++) {
				const active: AnyObject = request.active[i];
				if (pokemon[i].condition.endsWith(` fnt`)) {
					choices.push(`pass`);
					continue;
				}

				canMegaEvo = canMegaEvo && active.canMegaEvo;
				canUltraBurst = canUltraBurst && active.canUltraBurst;
				canZMove = canZMove && !!active.canZMove;
				canDynamax = canDynamax && !!active.canDynamax;

				// Determine whether we should change form if we do end up switching
				const change = (canMegaEvo || canUltraBurst || canDynamax) && this.prng.next() < this.mega;
				// If we've already dynamaxed or if we're planning on potentially dynamaxing
				// we need to use the maxMoves instead of our regular moves
				const useMaxMoves = (!active.canDynamax && active.maxMoves) || (change && canDynamax);
				const possibleMoves = useMaxMoves ? active.maxMoves.maxMoves : active.moves;

				// Filter out adjacentAlly moves if we have no allies left, unless they're our
				// only possible move options.
				const hasAlly = pokemon.length > 1 && !pokemon[i ^ 1].condition.endsWith(` fnt`);
				const filtered: {choice: string, move: AnyObject}[] = [];

				let moves: {choice: string, move: AnyObject}[] = [];
				for (let j = 1; j <= possibleMoves.length; j++) {
					// not disabled
					if (!possibleMoves[j - 1].disabled) {
						// NOTE: we don't actually check for whether we have PP or not because the
						// simulator will mark the move as disabled if there is zero PP and there are
						// situations where we actually need to use a move with 0 PP (Gen 1 Wrap).
						const move = this.toMoveChoice({
							slot: j,
							move: possibleMoves[j - 1].move,
							target: possibleMoves[j - 1].target,
							zMove: false,
						}, i, request, hasAlly);
						if (!hasAlly && possibleMoves[j - 1].target === `adjacentAlly`) {
							filtered.push(move);
						} else {
							moves.push(move);
						}
					}
				}
				if (canZMove) {
					for (let j = 0; j < active.canZMove.length; j++) {
						if (active.canZMove[j - 1]) {
							const move = this.toMoveChoice({
								slot: j,
								move: active.canZMove[j - 1].move,
								target: active.canZMove[j - 1].target,
								zMove: true,
							}, i, request, hasAlly);
							if (!hasAlly && possibleMoves[j - 1].target === `adjacentAlly`) {
								filtered.push(move);
							} else {
								moves.push(move);
							}
						}
					}
				}
				moves = moves.length ? moves : filtered;

				const switches: {slot: number, pokemon: AnyObject}[] = [];
				if (!active.trapped) {
					for (let j = 1; j <= 6; j++) {
						if (pokemon[j - 1] &&
							// not active
							!pokemon[j - 1].active &&
							// not chosen for a simultaneous switch
							!chosen.includes(j) &&
							// not fainted
							!pokemon[j - 1].condition.endsWith(` fnt`)
						) {
							switches.push({slot: j, pokemon: pokemon[j - 1]});
						}
					}
				}

				if (switches.length && (!moves.length || this.prng.next() > this.move)) {
					const target = this.chooseSwitch(active, switches);
					chosen.push(target);
					choices.push(`switch ${target}`);
				} else if (moves.length) {
					const move = this.chooseMove(active, moves);
					if (move.endsWith(` zmove`)) {
						canZMove = false;
						choices.push(move);
					} else if (change) {
						if (canDynamax) {
							canDynamax = false;
							choices.push(`${move} dynamax`);
						} else if (canMegaEvo) {
							canMegaEvo = false;
							choices.push(`${move} mega`);
						} else {
							canUltraBurst = false;
							choices.push(`${move} ultra`);
						}
					} else {
						choices.push(move);
					}
				} else {
					throw new Error(`${this.constructor.name} unable to make choice ${i}. ` +
						`request:'${JSON.stringify(request)}', chosen='${chosen}', (mega=${canMegaEvo}, ` +
						`ultra=${canUltraBurst}, zmove:${canZMove}, dynamax:${canDynamax})`);
				}
			}
			this.choose(choices.join(`, `));
		} else {
			// team preview?
			this.choose(this.chooseTeamPreview(request.side.pokemon));
		}
	}

	protected chooseTeamPreview(team: AnyObject[]): string {
		return `default`;
	}

	protected chooseMove(active: AnyObject, moves: {choice: string, move: AnyObject}[]): string {
		return this.prng.sample(moves).choice;
	}

	protected chooseSwitch(active: AnyObject | undefined, switches: {slot: number, pokemon: AnyObject}[]): number {
		return this.prng.sample(switches).slot;
	}

	private toMoveChoice(m: AnyObject, i: number, request: AnyObject, hasAlly: boolean) {
		let move = `move ${m.slot}`;
		// NOTE: We don't generate all possible targeting combinations.
		if (request.active.length > 1) {
			if ([`normal`, `any`, `adjacentFoe`].includes(m.target)) {
				move += ` ${1 + Math.floor(this.prng.next() * 2)}`;
			}
			if (m.target === `adjacentAlly`) {
				move += ` -${(i ^ 1) + 1}`;
			}
			if (m.target === `adjacentAllyOrSelf`) {
				if (hasAlly) {
					move += ` -${1 + Math.floor(this.prng.next() * 2)}`;
				} else {
					move += ` -${i + 1}`;
				}
			}
		}
		if (m.zMove) move += ` zmove`;
		return {choice: move, move: m};
	}
}
