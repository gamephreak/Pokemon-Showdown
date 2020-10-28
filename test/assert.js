/**
 * Assert extensions
 *
 * WARNING: These extensions are added directly to Node's `assert.strict`,
 * modifying built-ins. We don't personally consider this a problem because
 * it only happens in tests, but you should be aware in case you care.
 *
 * by Slayer95 and Zarel
 */

'use strict';

const legacyAssert = require('assert');
const assert = legacyAssert.strict;
const AssertionError = assert.AssertionError;

assert.bounded = function (value, range, message) {
	if (value >= range[0] && value <= range[1]) return;
	throw new AssertionError({
		actual: value,
		expected: `[${range[0]}, ${range[1]}]`,
		operator: '\u2208',
		message: message,
		stackStartFunction: assert.bounded,
	});
};

assert.atLeast = function (value, threshold, message) {
	if (value >= threshold) return;
	throw new AssertionError({
		actual: value,
		expected: `${threshold}`,
		operator: '>=',
		message: message,
		stackStartFunction: assert.atLeast,
	});
};

assert.atMost = function (value, threshold, message) {
	if (value <= threshold) return;
	throw new AssertionError({
		actual: value,
		expected: `${threshold}`,
		operator: '<=',
		message: message,
		stackStartFunction: assert.atMost,
	});
};

assert.constant = function (getter, fn, message) {
	const initialValue = getter();
	fn();
	const finalValue = getter();
	if (finalValue === initialValue) return;
	throw new AssertionError({
		message: message || `Expected value to remain as ${initialValue}, not to change to ${finalValue}.`,
		stackStartFunction: assert.constant,
	});
};

assert.sets = function (getter, value, fn, message) {
	assert.notEqual(getter(), value, `Function was prematurely equal to ${value}.`);
	fn();
	const finalValue = getter();
	if (finalValue === value) return;
	throw new AssertionError({
		actual: finalValue,
		expected: value,
		operator: '===',
		message: message,
		stackStartFunction: assert.sets,
	});
};

assert.strictEqual = () => {
	throw new Error(`This API is deprecated; please use assert.equal()`);
};
assert.deepStrictEqual = () => {
	throw new Error(`This API is deprecated; please use assert.deepEqual()`);
};
assert.notStrictEqual = () => {
	throw new Error(`This API is deprecated; please use assert.notEqual()`);
};
assert.notDeepStrictEqual = () => {
	throw new Error(`This API is deprecated; please use assert.notDeepEqual()`);
};
assert.ok = () => {
	throw new Error(`This API is deprecated; please use assert()`);
};
for (const fn in legacyAssert) {
	if (fn !== 'strict' && typeof legacyAssert[fn] === 'function') {
		legacyAssert[fn] = () => {
			throw new Error(`This API is deprecated; please use assert.strict`);
		};
	}
}

const assertMethods = Object.getOwnPropertyNames(assert).filter(methodName => (
	methodName !== 'constructor' && methodName !== 'AssertionError' && typeof assert[methodName] === 'function'
));
assert.false = function (value, message) {
	if (!value) return;
	throw new AssertionError({
		actual: `!${value}`,
		expected: true,
		operator: '===',
		message: message,
		stackStartFunction: assert.false,
	});
};
for (const methodName of assertMethods) {
	const lastArgIndex = assert[methodName].length - 1;
	assert.false[methodName] = function (...args) {
		try {
			assert[methodName].apply(null, args);
		} catch (err) {
			return;
		}
		throw new AssertionError({
			message: lastArgIndex < args.length ? args[lastArgIndex] : `Expected '${methodName}' assertion to fail.`,
			stackStartFunction: assert.false[methodName],
		});
	};
}

module.exports = assert;
