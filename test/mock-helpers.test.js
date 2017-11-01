const { IDBKeyRange, helpers } = require('../lib/mock');

// Polyfills for browser APIs.
require('blob-polyfill');

// Destructure helpers.
const { clone, validIdentifier, validKeyPath, validMultiKeyPath, validVersion, validKey, validKeyRange, keyInRange } = helpers;

// Helpers.
describe('IndexedDB mock helpers', () => {
	test('clone(): Allows primatives', () => {
		expect(clone(123)).toBe(123);
		expect(() => clone(123)).not.toThrow(Error);
		expect(clone('abc')).toBe('abc');
		expect(() => clone('abc')).not.toThrow(Error);
		expect(clone(true)).toBe(true);
		expect(() => clone(true)).not.toThrow(Error);
		expect(clone(false)).toBe(false);
		expect(() => clone(false)).not.toThrow(Error);
		expect(clone(undefined)).toBe(undefined);
		expect(() => clone(undefined)).not.toThrow(Error);
		expect(clone(null)).toBe(null);
		expect(() => clone(null)).not.toThrow(Error);
	});
	test('clone(): Allows instances of structured-cloneable objects (available in Node)', () => {
		expect(() => clone(new RegExp('/[a-z]/'))).not.toThrow(Error);
		expect(() => clone(new String('abc'))).not.toThrow(Error);
		expect(() => clone(new Number(123))).not.toThrow(Error);
		expect(() => clone(new Boolean(true))).not.toThrow(Error);
		expect(() => clone(new Date())).not.toThrow(Error);
		expect(() => clone(new ArrayBuffer())).not.toThrow(Error);
		expect(() => clone(new Array())).not.toThrow(Error);
		expect(() => clone(new Object())).not.toThrow(Error);
		expect(() => clone(new Set())).not.toThrow(Error);
		expect(() => clone(new Map())).not.toThrow(Error);
		expect(() => clone(new Blob())).not.toThrow(Error); // eslint-disable-line no-undef
	});
	test('clone(): Correctly deep-clones objects', () => {
		const obj1 = {'a':{'aa':11,'ab':12},b:2,c:[31,32]};
		const obj2 = clone(obj1);
		expect(obj2).toEqual(obj1);
		expect(obj2).not.toBe(obj1);
		expect(obj2.a).not.toBe(obj1.a);
		expect(obj2.c).not.toBe(obj1.c);
	});
	test('clone(): Correctly deep-clones arrays', () => {
		const arr1 = [{'aa':11,'ab':12},2,[31,32]];
		const arr2 = clone(arr1);
		expect(arr2).toEqual(arr1);
		expect(arr2).not.toBe(arr1);
		expect(arr2[0]).not.toBe(arr1[0]);
		expect(arr2[2]).not.toBe(arr1[2]);
	});
	test('clone(): Rejects non-plain objects', () => {
		expect(() => clone(new class Something { })).toThrow(Error);
	});
	test('validIdentifier(): Returns true for valid identifiers', () => {
		expect(validIdentifier('a')).toBe(true);
		expect(validIdentifier('aA')).toBe(true);
		expect(validIdentifier('a-a')).toBe(true);
		expect(validIdentifier('a_a')).toBe(true);
		expect(validIdentifier('_a')).toBe(true);
	});
	test('validIdentifier(): Returns false for invalid identifiers', () => {
		expect(validIdentifier('A')).toBe(false);
		expect(validIdentifier('1')).toBe(false);
		expect(validIdentifier(123)).toBe(false);
		expect(validIdentifier(null)).toBe(false);
		expect(validIdentifier(undefined)).toBe(false);
	});
	test('validKeyPath(): Returns true for valid key paths', () => {
		expect(validKeyPath('a')).toBe(true);
		expect(validKeyPath('a-a')).toBe(true);
		expect(validKeyPath('_a')).toBe(true);
		expect(validKeyPath('a.a.a')).toBe(true);
	});
	test('validKeyPath(): Returns false for invalid key paths', () => {
		expect(validKeyPath('A')).toBe(false);
		expect(validKeyPath('1')).toBe(false);
		expect(validKeyPath(123)).toBe(false);
		expect(validKeyPath(null)).toBe(false);
		expect(validKeyPath(undefined)).toBe(false);
	});
	test('validMultiKeyPath(): Returns true for valid array key paths', () => {
		expect(validMultiKeyPath(['a'])).toBe(true);
		expect(validMultiKeyPath(['a', 'a', 'a'])).toBe(true);
		expect(validMultiKeyPath(['a.a'])).toBe(true);
	});
	test('validMultiKeyPath(): Returns false for invalid array key paths', () => {
		expect(validMultiKeyPath(['A'])).toBe(false);
		expect(validMultiKeyPath([123])).toBe(false);
		expect(validMultiKeyPath('a')).toBe(false);
		expect(validMultiKeyPath(123)).toBe(false);
		expect(validMultiKeyPath(null)).toBe(false);
		expect(validMultiKeyPath(undefined)).toBe(false);
	});
	test('validVersion(): Returns true for valid version numbers', () => {
		expect(validVersion(1)).toBe(true);
		expect(validVersion(10)).toBe(true);
		expect(validVersion(10000)).toBe(true);
	});
	test('validVersion(): Returns false for invalid version numbers', () => {
		expect(validVersion(0)).toBe(false);
		expect(validVersion(1.5)).toBe(false);
		expect(validVersion(-1)).toBe(false);
		expect(validVersion(Infinity)).toBe(false);
		expect(validVersion(-Infinity)).toBe(false);
		expect(validVersion(NaN)).toBe(false);
	});
	test('validKey(): Returns true for valid keys (number, string, or date)', () => {
		expect(validKey(1)).toBe(true);
		expect(validKey(1.5)).toBe(true);
		expect(validKey(0)).toBe(true);
		expect(validKey(-1)).toBe(true);
		expect(validKey('a')).toBe(true);
		expect(validKey('A')).toBe(true);
		expect(validKey('€')).toBe(true);
		expect(validKey(new Date)).toBe(true);
	});
	test('validKey(): Returns false for invalid keys', () => {
		expect(validKey(Infinity)).toBe(false);
		expect(validKey(-Infinity)).toBe(false);
		expect(validKey(NaN)).toBe(false);
		expect(validKey(null)).toBe(false);
		expect(validKey(undefined)).toBe(false);
		expect(validKey(['a'])).toBe(false);
	});
	test('validKeyRange(): Returns true for valid arrays of keys and key ranges', () => {
		expect(validKeyRange(['a'])).toBe(true);
		expect(validKeyRange([1])).toBe(true);
		expect(validKeyRange(IDBKeyRange.bound(10, 20))).toBe(true);
	});
	test('validKeyRange(): Returns false for invalid arrays of keys and key ranges', () => {
		expect(validKeyRange([undefined])).toBe(false);
		expect(validKeyRange([null])).toBe(false);
		expect(validKeyRange([])).toBe(false);
	});
	test('keyInRange(): Returns true for keys that are in a key range', () => {
		expect(keyInRange('a', ['a'])).toBe(true);
		expect(keyInRange('a', IDBKeyRange.only('a'))).toBe(true);
	});
	test('keyInRange(): Returns false for keys that are not in a key range', () => {
		expect(keyInRange('a', ['b'])).toBe(false);
		expect(keyInRange('a', IDBKeyRange.only('b'))).toBe(false);
	});
});