const { IDBFactory, IDBRequest, IDBCursorWithValue, IDBKeyRange, reset } = require('../lib/mock');

// Vars.
const indexedDB = new IDBFactory;

// Reset before and after.
beforeEach(() => reset());
afterEach(() => reset());

// Ensure any setTimeout functions are run with tests.
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.runAllTimers());

// Index select.
describe('IndexedDB mock index', () => {
	test('get(): Get record from object store (outline key)', () => {

		// Handlers.
		const success = jest.fn(e => {
			expect(e.target.result).toEqual({indexed:502});
		});

		// Events.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create store and index.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false }).createIndex('index', 'indexed');

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			e.target.result.transaction('store', 'readwrite').objectStore('store').put({indexed:501}, 1); // Outline key.
			e.target.result.transaction('store', 'readwrite').objectStore('store').put({indexed:502}, 2); // Outline key.
			e.target.result.transaction('store', 'readwrite').objectStore('store').put({indexed:503}, 3); // Outline key.

			// Get.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').index('index').get(502);
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalled();

	});
	test('get(): Get non-existant record returns undefined', () => {

		// Handlers.
		const storeoutlinesuccess = jest.fn(e => {
			expect(e.target.result).toBe(undefined);
		});

		// Events.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create store and index.
			e.target.result.createObjectStore('storeoutline', { keyPath: null, autoIncrement: false }).createIndex('index', 'indexed');

		});
		request.onsuccess = jest.fn(e => {

			// Get.
			const request = e.target.result.transaction('storeoutline', 'readonly').objectStore('storeoutline').index('index').get(9999);
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = storeoutlinesuccess;

		});

		// Run.
		jest.runAllTimers();
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(storeoutlinesuccess).toHaveBeenCalled();

	});
	test('openCursor(): Get record from object store by cursor', () => {

		// Handlers.
		const success = jest.fn(e => {
			expect(e.target.result).toBeInstanceOf(IDBCursorWithValue);
			expect(e.target.result.key).toBe(502);
			expect(e.target.result.primaryKey).toBe(2);
			expect(e.target.result.value).toEqual({indexed:502}); // No inline key.
		});

		// Open a connection.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create store and index.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false }).createIndex('index', 'indexed');

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			e.target.result.transaction('store', 'readwrite').objectStore('store').put({indexed:501}, 1); // Outline key.
			e.target.result.transaction('store', 'readwrite').objectStore('store').put({indexed:502}, 2); // Outline key.
			e.target.result.transaction('store', 'readwrite').objectStore('store').put({indexed:503}, 3); // Outline key.

			// Cursor.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').index('index').openCursor(502);
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalled();

	});
	test('openCursor(): Getting non-existant record returns undefined', () => {

		// Handlers.
		const success = jest.fn(e => {
			expect(e.target.result).toBe(undefined);
		});

		// Open a connection.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create store and index.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false }).createIndex('index', 'indexed');

		});
		request.onsuccess = jest.fn(e => {

			// Cursor.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').index('index').openCursor(9999);
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalled();

	});
	test('openCursor(): Iterate through all records', () => {

		// Handlers.
		let i = 1;
		const success = jest.fn(e => {
			if (e.target.result)
			{
				expect(e.target.result).toBeInstanceOf(IDBCursorWithValue);
				expect(e.target.result.key).toBe(i+500);
				expect(e.target.result.primaryKey).toBe(i);
				expect(e.target.result.value).toEqual({indexed:i+500});
				e.target.result.continue();
				i++;
			}
		});

		// Open a connection.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create store and index.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false }).createIndex('index', 'indexed');

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const puts = e.target.result.transaction('store', 'readwrite').objectStore('store');
			for (let i = 1; i <= 99; i++) puts.put({indexed:i+500}, i); // Outline key.

			// Cursor.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').index('index').openCursor();
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalledTimes(99 + 1);

	});
	test('openCursor(): Get a single record by primary key', () => {

		// Handlers.
		const success = jest.fn(e => {
			expect(e.target.result).toBeInstanceOf(IDBCursorWithValue);
			expect(e.target.result.key).toBe(548);
			expect(e.target.result.primaryKey).toBe(48);
			expect(e.target.result.value).toEqual({indexed:548});
		});

		// Open a connection.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create store and index.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false }).createIndex('index', 'indexed');

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const puts = e.target.result.transaction('store', 'readwrite').objectStore('store');
			for (let i = 1; i <= 99; i++) puts.put({indexed:i+500}, i); // Outline key.

			// Cursor.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').index('index').openCursor(548);
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalled();

	});
	test('openCursor(): Iterate through a range of records', () => {

		// Handlers.
		let i = 40;
		const success = jest.fn(e => {
			if (e.target.result)
			{
				expect(e.target.result).toBeInstanceOf(IDBCursorWithValue);
				expect(e.target.result.key).toBe(i+500);
				expect(e.target.result.primaryKey).toBe(i);
				expect(e.target.result.value).toEqual({indexed:i+500});
				e.target.result.continue();
				i++;
			}
		});

		// Open a connection.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create store and index.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false }).createIndex('index', 'indexed');

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const puts = e.target.result.transaction('store', 'readwrite').objectStore('store');
			for (let i = 1; i <= 99; i++) puts.put({indexed:i+500}, i); // Outline key.

			// Cursor.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').index('index').openCursor(IDBKeyRange.bound(540, 559));
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalledTimes(20+1);

	});
	test('openCursor(): Iterate through an array of records', () => {

		// Vars.
		const records = [511, 515, 540, 'abc', 19999, 2000]; // Three existant, three non-existant.

		// Handlers.
		const success = jest.fn(e => {
			if (e.target.result)
			{
				const record = records.shift();
				expect(e.target.result).toBeInstanceOf(IDBCursorWithValue);
				expect(e.target.result.key).toEqual(record);
				expect(e.target.result.primaryKey).toEqual(record-500);
				expect(e.target.result.value).toEqual({indexed:record});
				e.target.result.continue();
			}
		});

		// Open a connection.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create store and index.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false }).createIndex('index', 'indexed');

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const puts = e.target.result.transaction('store', 'readwrite').objectStore('store');
			for (let i = 1; i <= 99; i++) puts.put({indexed:i+500}, i); // Outline key.

			// Cursor.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').index('index').openCursor(records);
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalledTimes(3 + 1);

	});
	test('openCursor(): advance() can skip multiple entries', () => {

		// Vars.
		const totalCount = 48;

		// Handlers.
		let i = 1;
		const success = jest.fn(e => {
			if (e.target.result)
			{
				expect(e.target.result).toBeInstanceOf(IDBCursorWithValue);
				expect(e.target.result.key).toBe(i+500);
				expect(e.target.result.primaryKey).toBe(i);
				expect(e.target.result.value).toEqual({indexed:i+500});
				e.target.result.advance(3);
				i += 3;
			}
		});

		// Open a connection.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create store and index.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false }).createIndex('index', 'indexed');

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const puts = e.target.result.transaction('store', 'readwrite').objectStore('store');
			for (let i = 1; i <= totalCount; i++) puts.put({indexed:i+500}, i); // Outline key.

			// Cursor.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').index('index').openCursor();
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalledTimes((totalCount / 3) + 1);

	});
	test('openCursor(): continue() can skip to a specific entry', () => {

		// Handlers.
		const success1 = jest.fn(e => {
			expect(e.target.result).toBeInstanceOf(IDBCursorWithValue);
			expect(e.target.result.key).toBe(501);
			expect(e.target.result.primaryKey).toBe(1);
			expect(e.target.result.value).toEqual({indexed:501});
			e.target.onsuccess = success2; // Change success handler.
			e.target.result.continue(520);
		});
		const success2 = jest.fn(e => {
			expect(e.target.result).toBeInstanceOf(IDBCursorWithValue);
			expect(e.target.result.key).toBe(520);
			expect(e.target.result.primaryKey).toBe(20);
			expect(e.target.result.value).toEqual({indexed:520});
		});

		// Open a connection.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create store and index.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false }).createIndex('index', 'indexed');

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const puts = e.target.result.transaction('store', 'readwrite').objectStore('store');
			for (let i = 1; i <= 50; i++) puts.put({indexed:i+500}, i); // Outline key.

			// Cursor.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').index('index').openCursor();
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success1;

		});

		// Run.
		jest.runAllTimers();
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success1).toHaveBeenCalled();
		expect(success2).toHaveBeenCalled();

	});
	test('openCursor(): continuePrimaryKey() can skip to a specific entry', () => {

		// Handlers.
		const success1 = jest.fn(e => {
			expect(e.target.result).toBeInstanceOf(IDBCursorWithValue);
			expect(e.target.result.key).toBe(501);
			expect(e.target.result.primaryKey).toBe(1);
			expect(e.target.result.value).toEqual({indexed:501});
			e.target.onsuccess = success2; // Change success handler.
			e.target.result.continuePrimaryKey(520, 20);
		});
		const success2 = jest.fn(e => {
			expect(e.target.result).toBeInstanceOf(IDBCursorWithValue);
			expect(e.target.result.key).toBe(520);
			expect(e.target.result.primaryKey).toBe(20);
			expect(e.target.result.value).toEqual({indexed:520});
		});

		// Open a connection.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create store and index.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false }).createIndex('index', 'indexed');

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const puts = e.target.result.transaction('store', 'readwrite').objectStore('store');
			for (let i = 1; i <= 50; i++) puts.put({indexed:i+500}, i); // Outline key.

			// Cursor.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').index('index').openCursor();
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success1;

		});

		// Run.
		jest.runAllTimers();
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success1).toHaveBeenCalled();
		expect(success2).toHaveBeenCalled();

	});
	test('count(): Count zero records', () => {

		// Handlers.
		const success = jest.fn(e => {
			expect(e.target.result).toBe(0);
		});

		// Open a connection.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create store and index.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false }).createIndex('index', 'indexed');

		});
		request.onsuccess = jest.fn(e => {

			// Count.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').index('index').count();
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalled();

	});
	test('count(): Count all records', () => {

		// Handlers.
		const success = jest.fn(e => {
			expect(e.target.result).toBe(99);
		});

		// Open a connection.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create store and index.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false }).createIndex('index', 'indexed');

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const puts = e.target.result.transaction('store', 'readwrite').objectStore('store');
			for (let i = 1; i <= 99; i++) puts.put({indexed:i+500}, i); // Outline key.

			// Count.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').index('index').count();
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalled();

	});
	test('count(): Count a range of records', () => {

		// Handlers.
		const success = jest.fn(e => {
			expect(e.target.result).toBe(20);
		});

		// Open a connection.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create store and index.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false }).createIndex('index', 'indexed');

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const puts = e.target.result.transaction('store', 'readwrite').objectStore('store');
			for (let i = 1; i <= 99; i++) puts.put({indexed:i+500}, i); // Outline key.

			// Count.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').index('index').count(IDBKeyRange.bound(510, 529));
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalled();

	});
	test('count(): Count a partial range of records', () => {

		// Handlers.
		const success = jest.fn(e => {
			expect(e.target.result).toBe(51);
		});

		// Open a connection.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create store and index.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false }).createIndex('index', 'indexed');

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const puts = e.target.result.transaction('store', 'readwrite').objectStore('store');
			for (let i = 1; i <= 100; i++) puts.put({indexed:i+500}, i); // Outline key.

			// Count.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').index('index').count(IDBKeyRange.bound(550, 8000));
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalled();

	});
	test('count(): Count an array of records', () => {

		// Vars.
		const records = [512, 549, 562, 2000, 9999, 'abc']; // Three existant, three non-existant.

		// Handlers.
		const success = jest.fn(e => {
			expect(e.target.result).toBe(3); // Ranges include top/bottom number.
		});

		// Open a connection.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create store and index.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false }).createIndex('index', 'indexed');

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const puts = e.target.result.transaction('store', 'readwrite').objectStore('store');
			for (let i = 1; i <= 99; i++) puts.put({indexed:i+500}, i); // Outline key.

			// Count.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').index('index').count(records);
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalled();

	});
	// @todo test('Index unique constraints are respected', () => {});
	// @todo test('Indexes with array (multiple) key paths work correctly', () => {});
});