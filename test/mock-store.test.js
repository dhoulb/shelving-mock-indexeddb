const { IDBFactory, IDBRequest, IDBCursorWithValue, IDBKeyRange, DOMException, reset } = require('../lib/mock');

// Vars.
const indexedDB = new IDBFactory;

// Reset before and after.
beforeEach(() => reset());
afterEach(() => reset());

// Ensure any setTimeout functions are run with tests.
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.runAllTimers());

// Object store CRUD.
describe('IndexedDB mock object store', () => {
	test('put(): Put record into object store (outline key)', () => {

		// Handlers.
		const success = jest.fn();

		// Events.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false });

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const request = e.target.result.transaction('store', 'readwrite').objectStore('store').put({a:1,b:2,c:3}, 1);
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalled();

	});
	test('put(): Put record into object store (inline key)', () => {

		// Handlers.
		const success = jest.fn();

		// Events.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: 'id', autoIncrement: false });

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const request = e.target.result.transaction('store', 'readwrite').objectStore('store').put({a:1,b:2,c:3,id:1});
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalled();

	});
	test('put(): Put record into object store (generated outline key)', () => {

		// Handlers.
		const success = jest.fn();

		// Events.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: true });

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const request = e.target.result.transaction('store', 'readwrite').objectStore('store').put({a:1,b:2,c:3}); // No key.
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalled();

	});
	test('put(): Put record into object store (generated inline key)', () => {

		// Handlers.
		const success = jest.fn();

		// Events.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: 'id', autoIncrement: true });

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const request = e.target.result.transaction('store', 'readwrite').objectStore('store').add({a:1,b:2,c:3});
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalled();

	});
	test('add(): Put record into object store (outline key)', () => {

		// Handlers.
		const success = jest.fn();

		// Events.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false });

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const request = e.target.result.transaction('store', 'readwrite').objectStore('store').add({a:1,b:2,c:3}, 1);
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalled();

	});
	test('add(): Put record into object store (inline key)', () => {

		// Handlers.
		const success = jest.fn();

		// Events.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: 'id', autoIncrement: false });

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const request = e.target.result.transaction('store', 'readwrite').objectStore('store').add({a:1,b:2,c:3,id:1});
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalled();

	});
	test('add(): Put record into object store (generated outline key)', () => {

		// Handlers.
		const success = jest.fn();

		// Events.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: true });

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const request = e.target.result.transaction('store', 'readwrite').objectStore('store').add({a:1,b:2,c:3}); // No key.
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalled();

	});
	test('add(): Put record into object store (generated inline key)', () => {

		// Handlers.
		const success = jest.fn();

		// Events.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: 'id', autoIncrement: true });

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const request = e.target.result.transaction('store', 'readwrite').objectStore('store').add({a:1,b:2,c:3}); // No key.
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalled();

	});
	test('put(): Disallow primative values as records (inline key)', () => {

		// Events.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: 'id', autoIncrement: true });

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			expect(() => e.target.result.transaction('store', 'readwrite').objectStore('store').put('abc')).toThrow(DOMException);  // Primative value throws DOMException.

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();

	});
	test('put(): Allow primative values as records (outline key)', () => {

		// Handlers.
		const success = jest.fn();

		// Events.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: true });

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const request = e.target.result.transaction('store', 'readwrite').objectStore('store').put('abc'); // Primative value.
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalled();

	});
	test('get(): Get record from object store (outline key)', () => {

		// Handlers.
		const success = jest.fn(e => {
			expect(e.target.result).toEqual({a:1,b:2,c:3});
		});

		// Events.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false });

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			e.target.result.transaction('store', 'readwrite').objectStore('store').put({a:1,b:2,c:3}, 1); // Outline key.

			// Get.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').get(1);
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalled();

	});
	test('get(): Get record from object store (inline key)', () => {

		// Handlers.
		const success = jest.fn(e => {
			expect(e.target.result).toEqual({a:1,b:2,c:3,id:1}); // Inline key.
		});

		// Events.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: 'id', autoIncrement: false });

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			e.target.result.transaction('store', 'readwrite').objectStore('store').put({a:1,b:2,c:3,id:1}); // Inline key.

			// Get.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').get(1);
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalled();

	});
	test('get(): Get record from object store (generated outline key)', () => {

		// Handlers.
		const success = jest.fn(e => {
			expect(e.target.result).toEqual({a:1,b:2,c:3});
		});

		// Events.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: true });

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			e.target.result.transaction('store', 'readwrite').objectStore('store').put({a:1,b:2,c:3}); // No key.

			// Get.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').get(1);
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalled();

	});
	test('get(): Get record from object store (generated inline key)', () => {

		// Handlers.
		const success = jest.fn(e => {
			expect(e.target.result).toEqual({a:1,b:2,c:3,id:1}); // Inline key.
		});

		// Events.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: 'id', autoIncrement: true });

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			e.target.result.transaction('store', 'readwrite').objectStore('store').put({a:1,b:2,c:3}); // No key.

			// Get.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').get(1);
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
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

			// Create object store.
			e.target.result.createObjectStore('storeoutline', { keyPath: null, autoIncrement: false });

		});
		request.onsuccess = jest.fn(e => {

			// Get.
			const request = e.target.result.transaction('storeoutline', 'readonly').objectStore('storeoutline').get(99999);
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = storeoutlinesuccess;

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(storeoutlinesuccess).toHaveBeenCalled();

	});
	test('openCursor(): Get record from object store by cursor (outline key)', () => {

		// Handlers.
		const success = jest.fn(e => {
			expect(e.target.result).toBeInstanceOf(IDBCursorWithValue);
			expect(e.target.result.key).toBe(1);
			expect(e.target.result.primaryKey).toBe(1);
			expect(e.target.result.value).toEqual({a:1,b:2,c:3}); // No inline key.
		});

		// Open a connection.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false });

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			e.target.result.transaction('store', 'readwrite').objectStore('store').put({a:1,b:2,c:3}, 1); // Outline key.

			// Get.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').openCursor();
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalled();

	});
	test('openCursor(): Get record from object store by cursor (inline key)', () => {

		// Handlers.
		const success = jest.fn(e => {
			expect(e.target.result).toBeInstanceOf(IDBCursorWithValue);
			expect(e.target.result.key).toBe(1);
			expect(e.target.result.primaryKey).toBe(1);
			expect(e.target.result.value).toEqual({a:1,b:2,c:3,id:1}); // Inline key.
		});

		// Open a connection.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: 'id', autoIncrement: false });

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			e.target.result.transaction('store', 'readwrite').objectStore('store').put({a:1,b:2,c:3,id:1}); // Inline key.

			// Get.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').openCursor();
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
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

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false });

		});
		request.onsuccess = jest.fn(e => {

			// Cursor.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').openCursor(48392);
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
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
				expect(e.target.result.key).toBe(i);
				expect(e.target.result.primaryKey).toBe(i);
				expect(e.target.result.value).toEqual({a:1,b:2,c:3});
				e.target.result.continue();
				i++;
			}
		});

		// Open a connection.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false });

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const puts = e.target.result.transaction('store', 'readwrite').objectStore('store');
			for (let i = 1; i <= 99; i++) puts.put({a:1,b:2,c:3}, i); // Outline key.

			// Get.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').openCursor();
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalledTimes(99 + 1);

	});
	test('openCursor(): Get a single record by primary key', () => {

		// Handlers.
		const success = jest.fn(e => {
			expect(e.target.result).toBeInstanceOf(IDBCursorWithValue);
			expect(e.target.result.key).toBe(24);
			expect(e.target.result.primaryKey).toBe(24);
			expect(e.target.result.value).toEqual({a:1,b:2,c:3});
		});

		// Open a connection.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false });

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const puts = e.target.result.transaction('store', 'readwrite').objectStore('store');
			for (let i = 1; i <= 99; i++) puts.put({a:1,b:2,c:3}, i); // Outline key.

			// Get.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').openCursor(24);
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalled();

	});
	test('openCursor(): Iterate through a range of records', () => {

		// Vars.
		const firstCount = 17;
		const lastCount = 24;

		// Handlers.
		let i = firstCount;
		const success = jest.fn(e => {
			if (e.target.result)
			{
				expect(e.target.result).toBeInstanceOf(IDBCursorWithValue);
				expect(e.target.result.key).toBe(i);
				expect(e.target.result.primaryKey).toBe(i);
				expect(e.target.result.value).toEqual({a:1,b:2,c:3});
				e.target.result.continue();
				i++;
			}
		});

		// Open a connection.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false });

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const puts = e.target.result.transaction('store', 'readwrite').objectStore('store');
			for (let i = 1; i <= 99; i++) puts.put({a:1,b:2,c:3}, i); // Outline key.

			// Get.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').openCursor(IDBKeyRange.bound(firstCount, lastCount));
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalledTimes((lastCount - firstCount + 1) + 1);

	});
	test('openCursor(): Iterate through an array of records', () => {

		// Vars.
		const records = [11, 15, 40, 'abc', 19999, 2000]; // Three existant, three non-existant.

		// Handlers.
		const success = jest.fn(e => {
			if (e.target.result)
			{
				const record = records.shift();
				expect(e.target.result).toBeInstanceOf(IDBCursorWithValue);
				expect(e.target.result.key).toEqual(record);
				expect(e.target.result.primaryKey).toEqual(record);
				expect(e.target.result.value).toEqual({a:1,b:2,c:3});
				e.target.result.continue();
			}
		});

		// Open a connection.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false });

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const puts = e.target.result.transaction('store', 'readwrite').objectStore('store');
			for (let i = 1; i <= 99; i++) puts.put({a:1,b:2,c:3}, i); // Outline key.

			// Get.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').openCursor(records);
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalledTimes(3 + 1);

	});
	test('openCursor(): advance() can skip multiple entries', () => {

		// Vars.
		const totalCount = 48;
		let i = 1;

		// Handlers.
		const success = jest.fn(e => {
			if (e.target.result)
			{
				expect(e.target.result).toBeInstanceOf(IDBCursorWithValue);
				expect(e.target.result.key).toBe(i);
				expect(e.target.result.primaryKey).toBe(i);
				expect(e.target.result.value).toEqual({a:1,b:2,c:3});
				e.target.result.advance(3);
				i += 3;
			}
		});

		// Open a connection.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false });

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const puts = e.target.result.transaction('store', 'readwrite').objectStore('store');
			for (let i = 1; i <= totalCount; i++) puts.put({a:1,b:2,c:3}, i); // Outline key.

			// Get.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').openCursor();
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalledTimes((totalCount / 3) + 1);

	});
	test('openCursor(): continue() can skip to a specific entry', () => {

		// Handlers.
		const success1 = jest.fn(e => {
			expect(e.target.result).toBeInstanceOf(IDBCursorWithValue);
			expect(e.target.result.key).toBe(1);
			expect(e.target.result.primaryKey).toBe(1);
			expect(e.target.result.value).toEqual({a:1,b:2,c:3});
			e.target.onsuccess = success2; // Change success handler.
			e.target.result.continue(20);
		});
		const success2 = jest.fn(e => {
			expect(e.target.result).toBeInstanceOf(IDBCursorWithValue);
			expect(e.target.result.key).toBe(20);
			expect(e.target.result.primaryKey).toBe(20);
			expect(e.target.result.value).toEqual({a:1,b:2,c:3});
		});

		// Open a connection.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false });

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const puts = e.target.result.transaction('store', 'readwrite').objectStore('store');
			for (let i = 1; i <= 50; i++) puts.put({a:1,b:2,c:3}, i); // Outline key.

			// Get.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').openCursor();
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success1;

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success1).toHaveBeenCalled();
		expect(success2).toHaveBeenCalled();

	});
	test('openCursor(): continuePrimaryKey() can skip to a specific entry', () => {

		// Handlers.
		const success1 = jest.fn(e => {
			expect(e.target.result).toBeInstanceOf(IDBCursorWithValue);
			expect(e.target.result.key).toBe(1);
			expect(e.target.result.primaryKey).toBe(1);
			expect(e.target.result.value).toEqual({a:1,b:2,c:3});
			e.target.onsuccess = success2; // Change success handler.
			e.target.result.continuePrimaryKey(20, 20);
		});
		const success2 = jest.fn(e => {
			expect(e.target.result).toBeInstanceOf(IDBCursorWithValue);
			expect(e.target.result.key).toBe(20);
			expect(e.target.result.primaryKey).toBe(20);
			expect(e.target.result.value).toEqual({a:1,b:2,c:3});
		});

		// Open a connection.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false });

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const puts = e.target.result.transaction('store', 'readwrite').objectStore('store');
			for (let i = 1; i <= 50; i++) puts.put({a:1,b:2,c:3}, i); // Outline key.

			// Get.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').openCursor();
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success1;

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
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

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false });

		});
		request.onsuccess = jest.fn(e => {

			// Count.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').count();
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
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

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false });

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const puts = e.target.result.transaction('store', 'readwrite').objectStore('store');
			for (let i = 1; i <= 99; i++) puts.put({a:1,b:2,c:3}, i); // Outline key.

			// Count.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').count();
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
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

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false });

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const puts = e.target.result.transaction('store', 'readwrite').objectStore('store');
			for (let i = 1; i <= 99; i++) puts.put({a:1,b:2,c:3}, i); // Outline key.

			// Count.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').count(IDBKeyRange.bound(10, 29));
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalled();

	});
	test('count(): Count a partial range of records', () => {

		// Handlers.
		const success = jest.fn(e => {
			expect(e.target.result).toBe(51); // Ranges include top/bottom number.
		});

		// Open a connection.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false });

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const puts = e.target.result.transaction('store', 'readwrite').objectStore('store');
			for (let i = 1; i <= 100; i++) puts.put({a:1,b:2,c:3}, i); // Outline key.

			// Count.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').count(IDBKeyRange.bound(50, 300));
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalled();

	});
	test('count(): Count an array of records', () => {

		// Vars.
		const records = [12, 49, 62, 2000, 9999, 'abc']; // Three existant, three non-existant.

		// Handlers.
		const success = jest.fn(e => {
			expect(e.target.result).toBe(3); // Ranges include top/bottom number.
		});

		// Open a connection.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false });

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const puts = e.target.result.transaction('store', 'readwrite').objectStore('store');
			for (let i = 1; i <= 99; i++) puts.put({a:1,b:2,c:3}, i); // Outline key.

			// Count.
			const request = e.target.result.transaction('store', 'readonly').objectStore('store').count(records);
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = success;

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(success).toHaveBeenCalled();

	});
	test('delete(): Delete a record', () => {

		// Handlers.
		const deleteSuccess = jest.fn(e => {
			expect(e.target.result).toBe(undefined);
		});
		const countSuccess = jest.fn(e => {
			expect(e.target.result).toBe(0);
		});

		// Open a connection.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false });

		});
		request.onsuccess = jest.fn(e => {
			e.target.result.transaction('store', 'readwrite').objectStore('store').put({a:1,b:2,c:3}, 1); // Outline key.

			// Delete.
			const request = e.target.result.transaction('store', 'readwrite').objectStore('store').delete(1);
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = deleteSuccess;

			// Count.
			e.target.result.transaction('store', 'readonly').objectStore('store').count().onsuccess = countSuccess;
		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(deleteSuccess).toHaveBeenCalled();
		expect(countSuccess).toHaveBeenCalled();

	});
	test('delete(): Delete a range of records', () => {

		// Handlers.
		const deleteSuccess = jest.fn(e => {
			expect(e.target.result).toBe(undefined);
		});
		const countSuccess = jest.fn(e => {
			expect(e.target.result).toBe(70);
		});

		// Open a connection.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false });

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const puts = e.target.result.transaction('store', 'readwrite').objectStore('store');
			for (let i = 1; i <= 100; i++) puts.put({a:1,b:2,c:3}, i); // Outline key.

			// Delete.
			const request = e.target.result.transaction('store', 'readwrite').objectStore('store').delete(IDBKeyRange.bound(30, 59));
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = deleteSuccess;

			// Count.
			e.target.result.transaction('store', 'readonly').objectStore('store').count().onsuccess = countSuccess;

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(deleteSuccess).toHaveBeenCalled();
		expect(countSuccess).toHaveBeenCalled();

	});
	test('delete(): Delete an array of records', () => {

		// Vars.
		const records = [10, 29, 44, 999, 2000, 'abc']; // Three existant, three non-existant.

		// Handlers.
		const deleteSuccess = jest.fn(e => {
			expect(e.target.result).toBe(undefined);
		});
		const countSuccess = jest.fn(e => {
			expect(e.target.result).toBe(97);
		});

		// Open a connection.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false });

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const puts = e.target.result.transaction('store', 'readwrite').objectStore('store');
			for (let i = 1; i <= 100; i++) puts.put({a:1,b:2,c:3}, i); // Outline key.

			// Delete.
			const request = e.target.result.transaction('store', 'readwrite').objectStore('store').delete(records);
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = deleteSuccess;

			// Count.
			e.target.result.transaction('store', 'readonly').objectStore('store').count().onsuccess = countSuccess;

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(deleteSuccess).toHaveBeenCalled();
		expect(countSuccess).toHaveBeenCalled();

	});
	test('clear(): Clear all records', () => {

		// Handlers.
		const clearSuccess = jest.fn(e => {
			expect(e.target.result).toBe(undefined);
		});
		const countSuccess = jest.fn(e => {
			expect(e.target.result).toBe(0);
		});

		// Open a connection.
		const request = indexedDB.open('testing', 1);
		request.onupgradeneeded = jest.fn(e => {

			// Create object store.
			e.target.result.createObjectStore('store', { keyPath: null, autoIncrement: false });

		});
		request.onsuccess = jest.fn(e => {

			// Put.
			const puts = e.target.result.transaction('store', 'readwrite').objectStore('store');
			for (let i = 1; i <= 100; i++) puts.put({a:1,b:2,c:3}, i); // Outline key.

			// Clear.
			const request = e.target.result.transaction('store', 'readwrite').objectStore('store').clear();
			expect(request).toBeInstanceOf(IDBRequest);
			request.onsuccess = clearSuccess;

			// Count.
			e.target.result.transaction('store', 'readonly').objectStore('store').count().onsuccess = countSuccess;

		});

		// Run.
		jest.runAllTimers();

		// Check handlers.
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();
		expect(clearSuccess).toHaveBeenCalled();
		expect(countSuccess).toHaveBeenCalled();

	});
});