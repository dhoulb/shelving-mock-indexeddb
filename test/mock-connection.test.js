const { IDBFactory, IDBDatabase, IDBTransaction, IDBOpenDBRequest, IDBObjectStore, IDBIndex, IDBVersionChangeEvent, reset } = require('../lib/mock');
const { Event } = require('shelving-mock-event');

// Vars.
const indexedDB = new IDBFactory;

// Reset before and after.
beforeEach(() => reset());
afterEach(() => reset());

// Ensure any setTimeout functions are run with tests.
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.runAllTimers());

// Connections and 'upgradeneeded' events.
describe('IndexedDB mock connections', () => {
	test('Connect to database and call \'upgradeneeded\' event', () => {

		// Vars.
		const storeNames = ['storeinline', 'storeinlineincrement', 'storeoutline', 'storeoutlineincrement']; // Alphabetic.
		const indexNames = ['index', 'indexmulti', 'indexunique', 'indexuniquemulti']; // Alphabetic.

		// Open a connection.
		const request = indexedDB.open('testing', 1);
		expect(request).toBeInstanceOf(IDBOpenDBRequest);

		// 'upgradeneeded' will be fired because the database doesn't exist yet.
		request.onupgradeneeded = jest.fn(e => {

			// Check the event.
			expect(e).toBeInstanceOf(IDBVersionChangeEvent);
			expect(e.target).toBe(request);
			expect(e.oldVersion).toBe(0);
			expect(e.newVersion).toBe(1);

			// Check the result.
			expect(request.result).toBeInstanceOf(IDBDatabase);

			// Check the database.
			const db = request.result;
			expect(db).toBeInstanceOf(IDBDatabase);
			expect(db.name).toBe('testing');
			expect(db.version).toBe(1);
			expect(db.objectStoreNames).toEqual([]);

			// Create all combinations of object store.
			const storeoutline = db.createObjectStore('storeoutline', { keyPath: null, autoIncrement: false });
			const storeinline = db.createObjectStore('storeinline', { keyPath: 'id', autoIncrement: false });
			const storeoutlineincrement = db.createObjectStore('storeoutlineincrement', { keyPath: null, autoIncrement: true });
			const storeinlineincrement = db.createObjectStore('storeinlineincrement', { keyPath: 'id', autoIncrement: true });
			expect(storeoutline).toBeInstanceOf(IDBObjectStore);
			expect(storeoutline.name).toBe('storeoutline');
			expect(storeoutline.keyPath).toBe(null);
			expect(storeoutline.autoIncrement).toBe(false);
			expect(storeinline).toBeInstanceOf(IDBObjectStore);
			expect(storeinline.name).toBe('storeinline');
			expect(storeinline.keyPath).toBe('id');
			expect(storeinline.autoIncrement).toBe(false);
			expect(storeoutlineincrement).toBeInstanceOf(IDBObjectStore);
			expect(storeoutlineincrement.name).toBe('storeoutlineincrement');
			expect(storeoutlineincrement.keyPath).toBe(null);
			expect(storeoutlineincrement.autoIncrement).toBe(true);
			expect(storeinlineincrement).toBeInstanceOf(IDBObjectStore);
			expect(storeinlineincrement.name).toBe('storeinlineincrement');
			expect(storeinlineincrement.keyPath).toBe('id');
			expect(storeinlineincrement.autoIncrement).toBe(true);

			// Create all combinations of index on all four combinations of store.
			expect(storeoutline.createIndex('index', 'indexed', { unique: false, multiEntry: false })).toBeInstanceOf(IDBIndex);
			expect(storeoutline.createIndex('indexunique', 'indexed', { unique: true, multiEntry: false })).toBeInstanceOf(IDBIndex);
			expect(storeoutline.createIndex('indexmulti', 'indexed', { unique: false, multiEntry: true })).toBeInstanceOf(IDBIndex);
			expect(storeoutline.createIndex('indexuniquemulti', 'indexed', { unique: true, multiEntry: true })).toBeInstanceOf(IDBIndex);
			expect(storeinline.createIndex('index', 'indexed', { unique: false, multiEntry: false })).toBeInstanceOf(IDBIndex);
			expect(storeinline.createIndex('indexunique', 'indexed', { unique: true, multiEntry: false })).toBeInstanceOf(IDBIndex);
			expect(storeinline.createIndex('indexmulti', 'indexed', { unique: false, multiEntry: true })).toBeInstanceOf(IDBIndex);
			expect(storeinline.createIndex('indexuniquemulti', 'indexed', { unique: true, multiEntry: true })).toBeInstanceOf(IDBIndex);
			expect(storeoutlineincrement.createIndex('index', 'indexed', { unique: false, multiEntry: false })).toBeInstanceOf(IDBIndex);
			expect(storeoutlineincrement.createIndex('indexunique', 'indexed', { unique: true, multiEntry: false })).toBeInstanceOf(IDBIndex);
			expect(storeoutlineincrement.createIndex('indexmulti', 'indexed', { unique: false, multiEntry: true })).toBeInstanceOf(IDBIndex);
			expect(storeoutlineincrement.createIndex('indexuniquemulti', 'indexed', { unique: true, multiEntry: true })).toBeInstanceOf(IDBIndex);
			expect(storeinlineincrement.createIndex('index', 'indexed', { unique: false, multiEntry: false })).toBeInstanceOf(IDBIndex);
			expect(storeinlineincrement.createIndex('indexunique', 'indexed', { unique: true, multiEntry: false })).toBeInstanceOf(IDBIndex);
			expect(storeinlineincrement.createIndex('indexmulti', 'indexed', { unique: false, multiEntry: true })).toBeInstanceOf(IDBIndex);
			expect(storeinlineincrement.createIndex('indexuniquemulti', 'indexed', { unique: true, multiEntry: true })).toBeInstanceOf(IDBIndex);

			// Add a store and delete it again.
			db.createObjectStore('deletedstore');
			expect(db.deleteObjectStore('deletedstore')).toBe(undefined);

		});

		// 'success' will be fired because the connection will open.
		request.onsuccess = jest.fn(e => {

			// Check the event.
			expect(e).toBeInstanceOf(Event);
			expect(e.target).toBe(request);

			// Check the result.
			expect(request.result).toBeInstanceOf(IDBDatabase);

			// Check the database.
			const db = request.result;
			expect(db).toBeInstanceOf(IDBDatabase);
			expect(db.name).toBe('testing');
			expect(db.version).toBe(1);
			expect(db.objectStoreNames).toEqual(storeNames); // Alphabetic order.

			// Create several transactions.
			const transaction = db.transaction(storeNames, 'readonly');
			expect(transaction).toBeInstanceOf(IDBTransaction);

			// Check.
			for (const i in storeNames)
			{
				const store = transaction.objectStore(storeNames[i]);
				expect(store).toBeInstanceOf(IDBObjectStore); // IDBObjectStore.
				expect(store.transaction).toEqual(transaction); // Index transaction is set.
				expect(store.indexNames).toEqual(indexNames); // Index names are right.
				for (const j in indexNames) expect(store.index(indexNames[j])).toBeInstanceOf(IDBIndex); // Index exists.
			}

		});

		// Run and check handlers.
		jest.runAllTimers();
		expect(request.onupgradeneeded).toHaveBeenCalled();
		expect(request.onsuccess).toHaveBeenCalled();

	});
});

// Multiple connections and 'versionchange' events.
describe('IndexedDB mock multiple connections', () => {
	test('Database connection is blocked if other connections DO NOT close on versionchange event', () => {

		// First connection.
		const request1 = indexedDB.open('testing', 1);
			const versionchange = jest.fn(); // Empty function that DOES NOT close the connection (so the second connection is blocked).
			request1.onsuccess = jest.fn(e => { e.target.result.onversionchange = versionchange; }); // Add the version change handler to the database.

		// Second connection.
		const request2 = indexedDB.open('testing', 2);
			request2.onblocked = jest.fn();
			request2.onupgradeneeded = jest.fn();
			request2.onsuccess = jest.fn();

		// Run.
		jest.runAllTimers();

		// Check handlers.
		expect(request1.onsuccess).toHaveBeenCalled(); // Called when request1 completes.
		expect(versionchange).toHaveBeenCalled(); // Called when request2 tries to close it.
		expect(request2.onblocked).toHaveBeenCalled(); // Called because request1 is still open.
		expect(request2.onupgradeneeded).not.toHaveBeenCalled(); // Not called because request1 is still open.
		expect(request2.onsuccess).not.toHaveBeenCalled(); // Not called because request1 is still open.

	});
	test('Database connection is NOT blocked if other connections DO close on versionchange event', () => {

		// First connection.
		const request1 = indexedDB.open('testing', 1);
			const versionchange = jest.fn(e => { e.target.close(); }); // Close the database on versionchange event.
			request1.onsuccess = jest.fn(e => { e.target.result.onversionchange = versionchange; }); // Add the version change handler to the database.

		// Second connection.
		const request2 = indexedDB.open('testing', 2);
			request2.onblocked = jest.fn();
			request2.onupgradeneeded = jest.fn();
			request2.onsuccess = jest.fn();

		// Run.
		jest.runAllTimers();

		// Check handlers.
		expect(request1.onsuccess).toHaveBeenCalled(); // Called when request1 completes.
		expect(versionchange).toHaveBeenCalled(); // Called when request2 tries to close it.
		expect(request2.onblocked).not.toHaveBeenCalled(); // Called because request1 is still open.
		expect(request2.onupgradeneeded).toHaveBeenCalled(); // Not called because request1 is still open.
		expect(request2.onsuccess).toHaveBeenCalled(); // Not called because request1 is still open.

	});
});