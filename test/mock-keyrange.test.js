const { IDBKeyRange, DOMException } = require('../lib/mock');

// Key range.
describe('IndexedDB mock key range', () => {
	test('IDBKeyRange.only(): instantiates correct IDBKeyRange', () => {
		expect(IDBKeyRange.only(10)).toMatchObject({ lower: 10, upper: 10, lowerOpen: false, upperOpen: false });
	});
	test('IDBKeyRange.only(): rejects invalid parameters', () => {
		expect(() => IDBKeyRange.only()).toThrow(DOMException);
	});
	test('IDBKeyRange.bound(): instantiates correct IDBKeyRange', () => {
		expect(IDBKeyRange.bound(10, 20)).toMatchObject({ lower: 10, upper: 20, lowerOpen: false, upperOpen: false });
		expect(IDBKeyRange.bound(10, 20, true)).toMatchObject({ lower: 10, upper: 20, lowerOpen: true, upperOpen: false });
		expect(IDBKeyRange.bound(10, 20, true, true)).toMatchObject({ lower: 10, upper: 20, lowerOpen: true, upperOpen: true });
		expect(IDBKeyRange.bound('aa', 'zz')).toMatchObject({ lower: 'aa', upper: 'zz', lowerOpen: false, upperOpen: false });
	});
	test('IDBKeyRange.bound(): rejects invalid parameters', () => {
		expect(() => IDBKeyRange.bound(null)).toThrow(DOMException);
		expect(() => IDBKeyRange.bound(10, null)).toThrow(DOMException);
		expect(() => IDBKeyRange.bound(10, 20, 123)).toThrow(DOMException);
		expect(() => IDBKeyRange.bound(10, 20, true, 123)).toThrow(DOMException);
		expect(() => IDBKeyRange.bound(100, 20)).toThrow(DOMException); // Lower higher than lower.
		expect(() => IDBKeyRange.bound('zz', 'aa')).toThrow(DOMException); // Lower higher than lower.
	});
	test('IDBKeyRange.lowerBound(): instantiates correct IDBKeyRange', () => {
		expect(IDBKeyRange.lowerBound(10)).toMatchObject({ lower: 10, upper: undefined, lowerOpen: false, upperOpen: true });
		expect(IDBKeyRange.lowerBound(10, true)).toMatchObject({ lower: 10, upper: undefined, lowerOpen: true, upperOpen: true });
		expect(IDBKeyRange.lowerBound('aa')).toMatchObject({ lower: 'aa', upper: undefined, lowerOpen: false, upperOpen: true });
	});
	test('IDBKeyRange.lowerBound(): rejects invalid parameters', () => {
		expect(() => IDBKeyRange.lowerBound(null)).toThrow(DOMException);
		expect(() => IDBKeyRange.lowerBound(null, 123)).toThrow(DOMException);
	});
	test('IDBKeyRange.upperBound(): instantiates correct IDBKeyRange', () => {
		expect(IDBKeyRange.upperBound(20)).toMatchObject({ lower: undefined, upper: 20, lowerOpen: true, upperOpen: false });
		expect(IDBKeyRange.upperBound(20, true)).toMatchObject({ lower: undefined, upper: 20, lowerOpen: true, upperOpen: true });
		expect(IDBKeyRange.upperBound('zz')).toMatchObject({ lower: undefined, upper: 'zz', lowerOpen: true, upperOpen: false });
	});
	test('IDBKeyRange.upperBound(): rejects invalid parameters', () => {
		expect(() => IDBKeyRange.upperBound(null)).toThrow(DOMException);
		expect(() => IDBKeyRange.upperBound(null, 123)).toThrow(DOMException);
	});
	test('IDBKeyRange.includes(): returns correct true/false for ranges', () => {
		expect(IDBKeyRange.only(10).includes(9)).toBe(false);
		expect(IDBKeyRange.only(10).includes(10)).toBe(true);
		expect(IDBKeyRange.only(10).includes(11)).toBe(false);
		expect(IDBKeyRange.only('b').includes('a')).toBe(false);
		expect(IDBKeyRange.only('b').includes('b')).toBe(true);
		expect(IDBKeyRange.only('b').includes('c')).toBe(false);
		expect(IDBKeyRange.lowerBound(10).includes(9)).toBe(false);
		expect(IDBKeyRange.lowerBound(10).includes(10)).toBe(true);
		expect(IDBKeyRange.lowerBound(10).includes(11)).toBe(true);
		expect(IDBKeyRange.lowerBound(10, true).includes(9)).toBe(false);
		expect(IDBKeyRange.lowerBound(10, true).includes(10)).toBe(false);
		expect(IDBKeyRange.lowerBound(10, true).includes(11)).toBe(true);
		expect(IDBKeyRange.lowerBound('b').includes('a')).toBe(false);
		expect(IDBKeyRange.lowerBound('b').includes('b')).toBe(true);
		expect(IDBKeyRange.lowerBound('b').includes('c')).toBe(true);
		expect(IDBKeyRange.lowerBound('b', true).includes('a')).toBe(false);
		expect(IDBKeyRange.lowerBound('b', true).includes('b')).toBe(false);
		expect(IDBKeyRange.lowerBound('b', true).includes('c')).toBe(true);
		expect(IDBKeyRange.upperBound(20).includes(19)).toBe(true);
		expect(IDBKeyRange.upperBound(20).includes(20)).toBe(true);
		expect(IDBKeyRange.upperBound(20).includes(21)).toBe(false);
		expect(IDBKeyRange.upperBound(20, true).includes(19)).toBe(true);
		expect(IDBKeyRange.upperBound(20, true).includes(20)).toBe(false);
		expect(IDBKeyRange.upperBound(20, true).includes(21)).toBe(false);
		expect(IDBKeyRange.upperBound('y').includes('x')).toBe(true);
		expect(IDBKeyRange.upperBound('y').includes('y')).toBe(true);
		expect(IDBKeyRange.upperBound('y').includes('z')).toBe(false);
		expect(IDBKeyRange.upperBound('y', true).includes('x')).toBe(true);
		expect(IDBKeyRange.upperBound('y', true).includes('y')).toBe(false);
		expect(IDBKeyRange.upperBound('y', true).includes('z')).toBe(false);
		expect(IDBKeyRange.bound(10, 20).includes(9)).toBe(false);
		expect(IDBKeyRange.bound(10, 20).includes(10)).toBe(true);
		expect(IDBKeyRange.bound(10, 20).includes(11)).toBe(true);
		expect(IDBKeyRange.bound(10, 20).includes(19)).toBe(true);
		expect(IDBKeyRange.bound(10, 20).includes(20)).toBe(true);
		expect(IDBKeyRange.bound(10, 20).includes(21)).toBe(false);
		expect(IDBKeyRange.bound(10, 20, true, true).includes(9)).toBe(false);
		expect(IDBKeyRange.bound(10, 20, true, true).includes(10)).toBe(false);
		expect(IDBKeyRange.bound(10, 20, true, true).includes(11)).toBe(true);
		expect(IDBKeyRange.bound(10, 20, true, true).includes(19)).toBe(true);
		expect(IDBKeyRange.bound(10, 20, true, true).includes(20)).toBe(false);
		expect(IDBKeyRange.bound(10, 20, true, true).includes(21)).toBe(false);
		expect(IDBKeyRange.bound('b', 'y').includes('a')).toBe(false);
		expect(IDBKeyRange.bound('b', 'y').includes('b')).toBe(true);
		expect(IDBKeyRange.bound('b', 'y').includes('c')).toBe(true);
		expect(IDBKeyRange.bound('b', 'y').includes('x')).toBe(true);
		expect(IDBKeyRange.bound('b', 'y').includes('y')).toBe(true);
		expect(IDBKeyRange.bound('b', 'y').includes('z')).toBe(false);
		expect(IDBKeyRange.bound('b', 'y', true, true).includes('a')).toBe(false);
		expect(IDBKeyRange.bound('b', 'y', true, true).includes('b')).toBe(false);
		expect(IDBKeyRange.bound('b', 'y', true, true).includes('c')).toBe(true);
		expect(IDBKeyRange.bound('b', 'y', true, true).includes('x')).toBe(true);
		expect(IDBKeyRange.bound('b', 'y', true, true).includes('y')).toBe(false);
		expect(IDBKeyRange.bound('b', 'y', true, true).includes('y')).toBe(false);
	});
});