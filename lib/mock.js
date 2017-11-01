"use strict";
const { Event, EventTarget } = require('shelving-mock-event');
const structuredClone = require('realistic-structured-clone');

// Vars.
const connections = {}; // Open connections.
const versions = {}; // Highest database versions.
const storage = {}; // Root storage.

// IndexedDB classes.

	// IDBFactory mock.
	class IDBFactory
	{
		// Construct.
		constructor()
		{
			// Methods.
			Object.defineProperty(this, 'open', { value: open });
			Object.defineProperty(this, 'deleteDatabase', { value: deleteDatabase });

			// Lock it down.
			Object.freeze(this);

			// Open a connection.
			function open(name, version)
			{
				// Make a new request.
				return new IDBOpenDBRequest(name, version);
			}

			// Delete a database.
			// Internally we regard 'opening a connection to a falsy/zero version' as a delete request.
			function deleteDatabase(name)
			{
				// Make a new request.
				return new IDBOpenDBRequest(name, false);
			}
		}
	}

		// Compare two keys.
		Object.defineProperty(IDBFactory, 'cmp', { value: (a,b) => {
			if (a < b) return -1;
			else if (a > b) return 1;
			else return 0;
		}});

	// IDBDatabase database connection mock.
	class IDBDatabase extends EventTarget
	{
		// Construct.
		constructor(dbName, version, data)
		{
			// Check params.
			if (!validIdentifier(dbName)) throw new TypeError('IDBDatabase: dbName must be a valid identifier');
			if (!validVersion(version)) throw new TypeError('IDBDatabase: version must be a valid version');
			if (!(data instanceof Object)) throw new TypeError('IDBDatabase: data must be an object');
			if (data.constructor !== Object) throw new TypeError('IDBDatabase: data must be a plain object');

			// EventTarget.
			// 'upgradeneeded' events require all other connections to the database to be closed in order to run.
			// So 'versionchange' is called on this connection to alert us that it needs to be closed.
			// This usually happens in a different tab/window (i.e. the the user opened a new tab that reloaded the schema from the server and the database now needs an updated schema).
			// 'versionchange' must close this connection or the connection in the other tab will be blocked (e.g. 'block' will be fired on the IDBOpenDBRequest).
			// e.g. either call `this.close` or do a `window.location = window.location` to refresh the page.
			super(null, ['abort', 'error', 'versionchange', 'close']);
			this.onerror = err => { throw err; }; // Throw it up by default.

			// Vars.
			const queue = []; // Secret transaction queue for this database.
			let closed = false; // closed flag.
			let closing = false; // closing flag.
			let active = null; // Active transaction.
			let timeout = null; // Run timeout.

			// Properties.
			Object.defineProperty(this, 'name', { value: dbName, enumerable: true });
			Object.defineProperty(this, 'version', { value: version, enumerable: true });
			Object.defineProperty(this, 'objectStoreNames', {
				enumerable: true,
				get() { const names = Object.keys(data); names.sort(); return names; },
				set() { throw new Error('IDBDatabase: _data is read only'); }
			});
			Object.defineProperty(this, '_data', {
				get() { if (closed) throw new Error('IDBDatabase: _data cannot be accessed after connection has closed'); return data; },
				set() { throw new Error('IDBDatabase: _data is read only'); }
			});

			// Methods.
			Object.defineProperty(this, 'transaction', { value: transaction });
			Object.defineProperty(this, 'createObjectStore', { value: createObjectStore });
			Object.defineProperty(this, 'deleteObjectStore', { value: deleteObjectStore });
			Object.defineProperty(this, 'close', { value: close });
			Object.defineProperty(this, '_upgradeTransaction', { value: upgradeTransaction }); // Secret _versionTransaction() method.
			Object.defineProperty(this, '_run', { value: run }); // Secret _run() method.

			// Lock it down.
			Object.freeze(this);

			// Add this to list of open connections.
			if (!connections[dbName]) connections[dbName] = [];
			connections[dbName].push(this);

			// Create a transaction on this database that accesses one or more stores.
			function transaction(storeNames, mode)
			{
				// Check params.
				if (typeof storeNames === 'string') storeNames = [storeNames];
				if (!(storeNames instanceof Array)) throw new TypeError('IDBDatabase.transaction(): storeNames must be string or array');
				if (!storeNames.length) throw new TypeError('IDBDatabase.transaction(): storeNames cannot be empty');
				for (let i = 0; i < storeNames.length; i++) if (!validIdentifier(storeNames[i])) throw new TypeError('IDBDatabase.transaction(): storeNames must only include valid identifiers');
				if (!('length' in storeNames) || !storeNames.length) throw new TypeError('IDBDatabase.transaction(): storeNames must be an identifier or non-empty array of identifiers');
				if (mode !== 'readonly' && mode !== 'readwrite') throw new TypeError('IDBDatabase.transaction(): mode must be readwrite or readonly');

				// Check state.
				if (closed) throw new DOMException('IDBDatabase.transaction(): Database connection is closed', 'InvalidStateError');
				if (closing) throw new DOMException('IDBDatabase.transaction(): Database connection is closing', 'InvalidStateError');

				// In 20ms run the database, to run this pending transaction.
				if (!timeout) setTimeout(run, 20);

				// Return new transaction.
				const transaction = new IDBTransaction(this, storeNames, mode);
				queue.push(transaction);
				return transaction;
			}

			// Create a 'versionchange' transaction on this database.
			function upgradeTransaction()
			{
				// Check state.
				if (closed) throw new DOMException('IDBDatabase._upgradeTransaction(): Database connection is closed', 'InvalidStateError');
				if (closing) throw new DOMException('IDBDatabase._upgradeTransaction(): Database connection is closing', 'InvalidStateError');
				if (queue.length) throw new DOMException('IDBDatabase._upgradeTransaction(): Database connection already has transactions', 'InvalidStateError');

				// Return new transaction.
				const transaction = new IDBTransaction(this, [], 'versionchange');
				queue.push(transaction);
				return transaction;
			}

			// Create object store.
			function createObjectStore(storeName, { keyPath = null, autoIncrement = false } = { keyPath: null, autoIncrement: false })
			{
				// Check params.
				if (!validIdentifier(storeName)) throw new TypeError('IDBDatabase.createObjectStore(): storeName must be valid identifier');
				if (!validKeyPath(keyPath) && keyPath !== null) throw new TypeError('IDBDatabase.createObjectStore(): keyPath must be a valid keyPath or null');
				if (typeof autoIncrement !== 'boolean') throw new TypeError('IDBDatabase.createObjectStore(): autoIncrement must be boolean');

				// Check state.
				if (closed) throw new DOMException('IDBDatabase.transaction(): Database connection is closed', 'InvalidStateError');
				if (!active) throw new DOMException('IDBDatabase.createObjectStore(): Can only be used used when a transaction is running', 'InvalidStateError');
				if (active.mode !== 'versionchange') throw new DOMException('IDBDatabase.createObjectStore(): Can only be used used within an active \'versionchange\' transaction, not \'' + active.mode + '\'', 'InvalidStateError');
				if (active._data[storeName]) throw new DOMException('IDBDatabase.createObjectStore(): Object store \'' + storeName + '\' already exists', 'ConstraintError');

				// Create a plain data template for this object store.
				active._data[storeName] = { records: new Map, indexes: {}, key: 0, keyPath, autoIncrement };

				// Make and return the new IDBObjectStore.
				return new IDBObjectStore(active, storeName);
			}

			// Delete object store.
			function deleteObjectStore(storeName)
			{
				// Check params.
				if (!validIdentifier(storeName)) throw new TypeError('IDBDatabase.deleteObjectStore(): storeName must be valid identifier');

				// Check state.
				if (closed) throw new DOMException('IDBDatabase.deleteObjectStore(): Database connection is closed', 'InvalidStateError');
				if (!active) throw new DOMException('IDBDatabase.deleteObjectStore(): Can only be used used within an active \'versionchange\' transaction', 'InvalidStateError');
				if (active.mode !== 'versionchange') throw new DOMException('IDBDatabase.deleteObjectStore(): Can only be used used within an active \'versionchange\' transaction', 'InvalidStateError');
				if (!active._data[storeName]) throw new DOMException('IDBDatabase.deleteObjectStore(): Object store \'' + storeName + '\' does not exist', 'NotFoundError');

				// Delete the object store on the transaction.
				delete active._data[storeName];
			}

			// Close the connection to this database.
			// This will block any more transactions from being opened.
			function close()
			{
				// Check state.
				if (closed) throw new DOMException('IDBDatabase.close(): Database connection is closed', 'InvalidStateError');
				if (closing) return; // Already closing.

				// Close is pending.
				// Blocks any new transactions from being made.
				closing = true;

				// Run any remaining transactions before we close.
				run();

				// Closed.
				closed = true;

				// Remove this connection from connections list.
				connections[dbName] = connections[dbName].filter(connection => connection !== this);

				// Event.
				this.dispatchEvent(new Event('close', { bubbles: true }));
			}

			// Run any pending transactions.
			function run()
			{
				// Check state.
				if (closed) throw new DOMException('IDBDatabase._run(): Database connection is closed', 'InvalidStateError');

				// Stop run() running run again in future.
				clearTimeout(timeout);
				timeout = false;

				// Run each transaction.
				while (queue.length)
				{
					// Activate and run.
					active = queue.shift();
					active._run();
					active = null;
				}
			}
		}
	}

	// IDBTransaction mock.
	class IDBTransaction extends EventTarget
	{
		// Construct.
		constructor(db, storeNames, mode = 'readonly')
		{
			// Check params.
			if (!(db instanceof IDBDatabase)) throw new TypeError('IDBTransaction: db must be an IDBDatabase');
			if (!(storeNames instanceof Array)) throw new TypeError('IDBTransaction: storeNames must be array');
			for (let i = 0; i < storeNames.length; i++) if (!validIdentifier(storeNames[i])) throw new TypeError('IDBTransaction: storeNames must only include valid identifiers');
			if (mode !== 'readonly' && mode !== 'readwrite' && mode !== 'versionchange') throw new TypeError('IDBTransaction: mode must be readwrite, readonly, or versionchange');

			// Vars.
			const stores = {}; // List of instantiated IDBObjectStore instances that have been initialised for this transaction.
			const queue = []; // Secret requests queue for this transaction.
			let data = db._data; // Database data.
			let finished = false; // Whether this transaction is finished or not (can have requests made on it).
			let active = null; // The active request on this transaction.
			let aborted = false; // Whether this transaction has been aborted.

			// EventTarget.
			super(db, ['complete', 'error', 'abort']);

			// Freeze store names.
			Object.freeze(storeNames);

			// Properties.
			Object.defineProperty(this, 'db', { value: db, enumerable: true });
			Object.defineProperty(this, 'mode', { value: mode, enumerable: true });
			Object.defineProperty(this, 'objectStoreNames', { value: storeNames, enumerable: true });
			Object.defineProperty(this, 'error', {
				get() { if (!finished) throw new Error('IDBTransaction: error can only be accessed after transaction has finished'); return null; },
				set() { throw new Error('IDBTransaction: error is read only'); }
			});
			Object.defineProperty(this, '_finished', {
				get() { return finished; },
				set() { throw new Error('IDBTransaction: _finished is read only') },
			});
			Object.defineProperty(this, '_data', {
				get() { if (finished) throw new Error('IDBTransaction: _data cannot be accessed after transaction has finished'); return data; },
				set() { throw new Error('IDBTransaction: _data is read only') },
			});

			// Methods.
			Object.defineProperty(this, 'objectStore', { value: objectStore });
			Object.defineProperty(this, 'abort', { value: abort });
			Object.defineProperty(this, '_request', { value: request }); // Secret _request() method.
			Object.defineProperty(this, '_run', { value: run }); // Secret _run() method.

			// Lock it down.
			Object.freeze(this);

			// Get object store.
			function objectStore(storeName)
			{
				// Check params.
				if (!validIdentifier(storeName)) throw new TypeError('IDBTransaction.objectStore(): storeName must be valid identifier');

				// Check state.
				if (finished) throw new DOMException('IDBTransaction.objectStore(): Transaction has already finished', 'InvalidStateError');
				if (storeNames.indexOf(storeName) < 0) throw new DOMException('IDBTransaction.objectStore(): Object store is not in this transaction\'s scope', 'NotFoundError');
				if (!data[storeName]) throw new DOMException('IDBTransaction.objectStore(): Object store \'' + storeName + '\' does not exist', 'NotFoundError');

				// Make a new IDBObjectStore instance.
				// Add it to the list of instantiated object stores and return it.
				if (!stores[storeName]) stores[storeName] = new IDBObjectStore(this, storeName);
				return stores[storeName];
			}

			// Abort this transaction.
			// Means that changes made by this transaction won't be committed.
			function abort()
			{
				// Checks.
				if (finished) throw new DOMException('IDBTransaction.abort(): Transaction has already finished', 'InvalidStateError');

				// Aborted.
				finished = true;
				aborted = true;
			}

			// Add a request to this transaction.
			function request(input, callback)
			{
				// Checks.
				if (finished) throw new DOMException('IDBTransaction: Cannot create request when transaction has already finished', 'InvalidStateError');

				// New or existing request.
				if (input instanceof IDBRequest)
				{
					// Existing request.
					queue.push(input);
					return input;
				}
				else
				{
					// Create request, add to queue, and return it.
					const request = new IDBRequest(input, callback);
					queue.push(request);
					return request;
				}
			}

			// Run this transaction.
			function run()
			{
				// Check state.
				if (finished) throw new DOMException('IDBTransaction._run(): Transaction has already finished', 'InvalidStateError');
				if (active) throw new DOMException('IDBTransaction._run(): Transaction is currently running', 'InvalidStateError');

				// Make a clone of data.
				const original = data;
				data = {};
				for (const store in original)
				{
					// Clone the records Map (manually).
					data[store] = Object.assign({}, original[store], {
						records: new Map(original[store].records),
						indexes: Object.assign({}, original[store].indexes),
					});
				}

				// Run each request in the request queue.
				while (!aborted && queue.length)
				{
					// Activate and run.
					active = queue.shift();
					active._run();
					active = false;
				}

				// Finished.
				finished = true;

				// Was it aborted?
				if (aborted)
				{
					// Abort any pending queue.
					while (queue.length) queue.shift()._abort();

					// 'abort' event.
					// This is a 'non-erroring' abort, i.e. 'error' isn't set.
					this.dispatchEvent(new Event('abort', { bubbles: true, cancelable: false }));
				}
				else
				{
					// Commit the changes back into the database.
					for (const store in original) delete original[store];
					for (const store in data) original[store] = data[store];

					// 'complete' event.
					this.dispatchEvent(new Event('complete', { bubbles: false, cancelable: false }));
				}
			}
		}
	}

	// IDBRequest mock.
	class IDBRequest extends EventTarget
	{
		// Construct.
		constructor(input, callback)
		{
			// Check params.
			let transaction, source;
			if (input instanceof IDBTransaction)
			{
				transaction = input;
				source = null;
			}
			else if (input instanceof IDBObjectStore)
			{
				transaction = input.transaction;
				source = input;
			}
			else if (input instanceof IDBIndex)
			{
				transaction = input.objectStore.transaction;
				source = input;
			}
			else throw new TypeError('IDBRequest: input must be an IDBTransaction, IDBObjectStore, or IDBIndex');
			if (!(transaction instanceof IDBTransaction)) throw new TypeError('IDBRequest: transaction must be an IDBTransaction');
			if (typeof callback !== 'function') throw new TypeError('IDBRequest: callback must be a function');

			// Vars.
			let result = undefined; // The result, if any, that this request generated.
			let active = true; // Whether request is still active (pending) or complete (done).
			let error = undefined; // Error, if any, on this request. Used when request is aborted.

			// EventTarget.
			super(transaction, ['success', 'error']);

			// Properties.
			Object.defineProperty(this, 'transaction', { value: transaction, enumerable: true });
			Object.defineProperty(this, 'source', { value: source, enumerable: true });
			Object.defineProperty(this, 'readyState', {
				enumerable: true,
				get() { return active ? 'pending' : 'done' },
				set() { throw new Error('IDBRequest: readyState is read only') },
			});
			Object.defineProperty(this, 'result', {
				enumerable: true,
				get() { if (active) throw new DOMException('IDBRequest: Cannot get result until request is done', 'InvalidStateError'); return result; },
				set() { throw new Error('IDBRequest: result is read only') },
			});
			Object.defineProperty(this, 'error', {
				enumerable: true,
				get() { if (active) throw new DOMException('IDBRequest: Cannot get error until request is done', 'InvalidStateError'); return error; },
				set() { throw new Error('IDBRequest: error is read only') },
			});

			// Methods.
			Object.defineProperty(this, '_run', { value: run }); // Secret _run() method.
			Object.defineProperty(this, '_rerun', { value: rerun }); // Secret _rerun() method.
			Object.defineProperty(this, '_abort', { value: abort }); // Secret _abort() method.

			// Lock it down.
			Object.freeze(this);

			// Run this request.
			function run()
			{
				// Get result.
				active = true;
				result = callback(this);
				active = false;

				// Event.
				this.dispatchEvent(new Event('success', { bubbles: false, cancelable: false }));
			}

			// Rerun this request.
			// By adding it to the end of its transaction's queue.
			function rerun()
			{
				// Add to the request queue for the transaction.
				// Will fail if the transaction has already finished.
				transaction._request(this);
			}

			// Abort this request.
			// Called when this request is part of an aborted transaction.
			function abort()
			{
				// Error.
				result = undefined;
				error = new DOMException('IDBRequest: Request\'s transaction has been aborted', 'AbortError');
				active = false;

				// Event.
				this.dispatchEvent(new Event('error', { bubbles: true, cancelable: true }));
			}
		}
	}

	// IDBOpenDBRequest mock.
	class IDBOpenDBRequest extends EventTarget
	{
		// Construct.
		constructor(dbName, version)
		{
			// Checks.
			if (!validIdentifier(dbName)) throw new TypeError('IDBOpenDBRequest: dbName must be valid identifier');
			if (!validVersion(version) && version !== false) throw new TypeError('IDBOpenDBRequest: version must be a valid version or false');

			// Vars.
			let result = undefined; // The result, if any, that this request generated.
			let active = true; // Whether request is still active (pending) or complete (done).
			let transaction = null; // Transaction under this request.

			// EventTarget.
			const request = super(null, ['success', 'error', 'blocked', 'upgradeneeded']);

			// Properties.
			Object.defineProperty(this, 'transaction', {
				get() { return transaction; },
				set() { throw new Error('IDBRequest: transaction is read only') },
			});
			Object.defineProperty(this, 'source', { value: null });
			Object.defineProperty(this, 'readyState', {
				get() { return active ? 'pending' : 'done' },
				set() { throw new Error('IDBRequest: readyState is read only') },
			});
			Object.defineProperty(this, 'result', {
				get() { if (active) throw new DOMException('IDBRequest: Cannot get result until request is done', 'InvalidStateError'); return result; },
				set() { throw new Error('IDBRequest: result is read only') },
			});
			Object.defineProperty(this, 'error', {
				get() { if (active) throw new DOMException('IDBRequest: Cannot get error until request is done', 'InvalidStateError'); return null; },
				set() { throw new Error('IDBRequest: error is read only') },
			});

			// Lock it down.
			Object.freeze(this);

			// Open requests automatically run.
			// Allow 20ms — enough time for user to attach handlers etc.
			setTimeout(run, 20);

			// Run this request.
			function run()
			{
				// Vars.
				const oldVersion = versions[dbName] || 0;

				// Check state.
				if (!active) throw new DOMException('IDBOpenDBRequest._run(): Request has already been run', 'InvalidStateError');

				// Already stopped.
				active = false;

				// Check version.
				if (!version) // Open request.
				{
					// Delete request (falsy/zero version).
					if (!close()) return;

					// Delete.
					delete connections[dbName];
					delete versions[dbName];
					delete storage[dbName];

					// Success.
					request.dispatchEvent(new Event('success', { bubbles: false, cancelable: false }));
				}
				else if (version < oldVersion)
				{
					// Request for an older version.
					throw new DOMException('IDBOpenDBRequest: Requested version is lower than current version', 'VersionError')
				}
				else if (version === oldVersion)
				{
					// Request for current version.
					result = new IDBDatabase(dbName, version, storage[dbName]);

					// Dispatch 'success'.
					request.dispatchEvent(new Event('success', { bubbles: false, cancelable: false }));
				}
				else if (version > oldVersion)
				{
					// Request for a newer version.
					// Close all connections first.
					if (!close()) return;

					// Make a database.
					const db = new IDBDatabase(dbName, version, {}); // New database.
					const tx = db._upgradeTransaction(); // 'versionchange' transaction.

					// Add a temp/wrapper request on the transaction.
					tx._request(tx, () => {

						// Result is DB.
						result = db;

						// Dispatch 'upgradeneeded' on the IDBOpenDBRequest.
						transaction = tx;
						request.dispatchEvent(new IDBVersionChangeEvent('upgradeneeded', oldVersion, version));
						transaction = null;

					});

					// Run the database now to run the 'versionchange' transaction.
					db._run();

					// Commit the changes.
					versions[dbName] = version; // Increment version number.
					storage[dbName] = db._data; // Set current global data store to request database's store.

					// Dispatch 'success' event on the open request.
					request.dispatchEvent(new Event('success', { bubbles: false, cancelable: false }));
				}
			}

			// Close all other connections.
			function close()
			{
				// Are there connections open?
				if (connections[dbName] && connections[dbName].length)
				{
					// Close other connections (dispatch 'versionchange' on each).
					// If connections are still open, block this open request.
					connections[dbName].forEach(connection => connection.dispatchEvent(new Event('versionchange', { bubbles: false, cancelable: false })));

					// Fail if connections are still open.
					if (connections[dbName].length)
					{
						// 'blocked' event.
						request.dispatchEvent(new Event('blocked', { bubbles: false, cancelable: false }));

						// Fail.
						return false;
					}
				}

				// Win.
				return true;
			}
		}
	}

	// IDBObjectStore mock.
	class IDBObjectStore
	{
		// Construct.
		constructor(transaction, storeName)
		{
			// Check params.
			if (!(transaction instanceof IDBTransaction)) throw new TypeError('IDBObjectStore: transaction must be a transaction');
			if (!validIdentifier(storeName)) throw new TypeError('IDBObjectStore: storeName must be valid identifier');

			// Check state.
			if (transaction._finished) throw new DOMException('IDBObjectStore: Transaction has finished', 'InvalidStateError');
			if (!transaction._data[storeName]) throw new DOMException('IDBObjectStore: Object store \'' + storeName + '\' does not exist', 'InvalidStateError');

			// Vars.
			const store = this;
			const { keyPath, autoIncrement } = transaction._data[storeName];

			// Properties.
			Object.defineProperty(this, 'transaction', { value: transaction, enumerable: true });
			Object.defineProperty(this, 'name', { value: storeName, enumerable: true }); // @todo In IDB 2.0 name is editable.
			Object.defineProperty(this, 'keyPath', { value: keyPath, enumerable: true });
			Object.defineProperty(this, 'autoIncrement', { value: autoIncrement, enumerable: true });
			Object.defineProperty(this, 'indexNames', {
				enumerable: true,
				get() { const names = Object.keys(transaction._data[storeName].indexes); names.sort(); return names; },
				set() { throw new Error('IDBObjectStore: indexNames is read only'); }
			});

			// Methods.
			Object.defineProperty(this, 'count', { value: count });
			Object.defineProperty(this, 'get', { value: get });
			Object.defineProperty(this, 'openCursor', { value: openCursor });
			Object.defineProperty(this, 'put', { value: put });
			Object.defineProperty(this, 'add', { value: add });
			Object.defineProperty(this, 'delete', { value: _delete });
			Object.defineProperty(this, 'clear', { value: clear });
			Object.defineProperty(this, 'index', { value: index });
			Object.defineProperty(this, 'createIndex', { value: createIndex });
			Object.defineProperty(this, 'deleteIndex', { value: deleteIndex });

			// Lock it down.
			Object.freeze(this);

			// Count documents.
			function count(key = undefined)
			{
				// Check params.
				if (!validKey(key) && !validKeyRange(key) && key !== undefined) throw new DOMException('count(): The key parameter was provided but does not contain a valid key (number, string, date), key range (IDBKeyRange or array of valid keys), or undefined', 'DataError');

				// Check state.
				if (transaction._finished) throw new DOMException('IDBObjectStore.count(): Transaction has finished', 'InvalidStateError');

				// Return an IDBRequest on the transaction returns the count from a cursor.
				return transaction._request(store, request => {

					// Check state.
					if (transaction._finished) throw new DOMException('IDBObjectStore.count(): Transaction has finished', 'InvalidStateError');
					if (!transaction._data[storeName]) throw new DOMException('IDBIndex.count(): Object store \'' + storeName + '\' does not exist', 'InvalidStateError');

					// Return the number of keys found on the cursor.
					return new IDBCursor(request, key)._count;

				});
			}

			// Get a single result.
			// Returns a request that fires a 'success' event when its result is available.
			// `request.result` will be either:
			// 1. The value for the first result with a key matching `key`.
			// 2. `undefined`, if there are no matching results.
			function get(key = undefined)
			{
				// Check params.
				if (!validKey(key) && !validKeyRange(key) && key !== undefined) throw new DOMException('count(): The key parameter was provided but does not contain a valid key (number, string, date), key range (IDBKeyRange or array of valid keys), or undefined', 'DataError');

				// Check state.
				if (transaction._finished) throw new DOMException('IDBObjectStore.get(): Transaction has finished', 'InvalidStateError');

				// Return an IDBRequest on the transaction.
				return transaction._request(store, request => {

					// Check state.
					if (transaction._finished) throw new DOMException('IDBObjectStore.get(): Transaction has finished', 'InvalidStateError');
					if (!transaction._data[storeName]) throw new DOMException('IDBIndex.get(): Object store \'' + storeName + '\' does not exist', 'InvalidStateError');

					// Return the value of the first key found by the cursor.
					return new IDBCursorWithValue(request, key).value;

				});
			}

			// Open a cursor to retrieve several results.
			// Returns a request that fires one or more 'success' events when its results is available.
			// Continues to fire 'success' as many times as `cursor.continue()` is called and results are available.
			// request.result will be either:
			// 1. An `IDBCursor` (with `cursor.value` and `cursor.key` to read values, and `cursor.continue()` method to continue).
			// 2. `undefined`, if there are no more results.
			function openCursor(query = undefined, direction = 'next')
			{
				// Check params.
				if (!validKey(query) && !validKeyRange(query) && query !== undefined) throw new DOMException('count(): The query parameter not contain a valid key (number, string, date), key range (IDBKeyRange or array of valid keys), or undefined', 'DataError');
				if (direction !== 'next' && direction !== 'prev') throw new TypeError('IDBCursor: direction must be one of \'next\' or \'prev\' (\'nextunique\' or \'prevunique\' are not relevant for primary keys, which must be unique)');

				// Check state.
				if (transaction._finished) throw new DOMException('IDBObjectStore.openCursor(): Transaction has finished', 'InvalidStateError');

				// Return an IDBRequest.
				// The result of the request is an IDBCursor (if there's a value at the current cursor position),
				// or undefined (if there isn't, because we iterated past the end or there were no results).
				let cursor;
				return transaction._request(store, request => {

					// Check state.
					if (transaction._finished) throw new DOMException('IDBObjectStore.openCursor(): Transaction has finished', 'InvalidStateError');
					if (!transaction._data[storeName]) throw new DOMException('IDBIndex.openCursor(): Object store \'' + storeName + '\' does not exist', 'InvalidStateError');

					// Make a cursor if it doesn't exist.
					// Don't create the cursor until the request is run.
					// (Otherwise records added by other requests between this request being created and it being run, won't be included.)
					if (!cursor) cursor = new IDBCursorWithValue(request, query, direction);

					// Return cursor if there is a value.
					return cursor.primaryKey !== undefined ? cursor : undefined;

				});
			}

			// Save a document to a specified key.
			// Returns a request that fires 'success' event when `value` has been saved under `key`.
			function put(value, key)
			{
				// Check params.
				if (keyPath)
				{
					// Value must be an object if keyPath is set.
					if (!(value instanceof Object)) throw new DOMException('IDBObjectStore.put(): value must be an object for object stores where a keyPath is set', 'DataError');

					// Checks for in-line keys (key at value.keyPath).
					// key parameter must not be set.
					if (key !== undefined) throw new DOMException('IDBObjectStore.put(): key parameter cannot be set (use value.' + keyPath + ' instead)', 'DataError');
					key = value[keyPath];
					if (key !== undefined && !validKey(key)) throw new DOMException('IDBObjectStore.put(): inline key (value.' + keyPath + ') must be a valid key (number, string, date)', 'DataError');
					if (key === undefined && !autoIncrement) throw new DOMException('IDBObjectStore.put(): inline key (value.' + keyPath + ') must be set (object store does not autoincrement)', 'DataError');
				}
				else
				{
					// Checks for out-of-line keys (key parameter).
					if (key !== undefined && !validKey(key)) throw new DOMException('IDBObjectStore.put(): key parameter must be valid key (number, string, date)', 'DataError');
					if (key === undefined && !autoIncrement) throw new DOMException('IDBObjectStore.put(): key parameter must be set (object store does not autoincrement)', 'DataError');
				}

				// Check state.
				if (transaction._finished) throw new DOMException('IDBObjectStore.put(): Transaction has finished', 'InvalidStateError');
				if (transaction.mode === 'readonly') throw new DOMException('IDBObjectStore.put(): Transaction is read only', 'ReadOnlyError');

				// Clone.
				try { value = clone(value); } catch (err) { throw new DOMException('IDBObjectStore.put(): value can only be one of the limited set of values allowed by the "structured clone algorithm" (strings, numbers, booleans, undefined, null, plain array, plain object, Date, RegExp, Map, Set, Blob, File, FileList, ImageData, ArrayBuffer, ArrayBufferView)', 'DataCloneError') }

				// Return an IDBRequest on the transaction that saves the value at the key.
				return transaction._request(store, () => {

					// Check state.
					if (transaction._finished) throw new DOMException('IDBObjectStore.put(): Transaction has finished', 'InvalidStateError');
					if (!transaction._data[storeName]) throw new DOMException('IDBObjectStore.put(): Object store \'' + storeName + '\' does not exist', 'InvalidStateError');

					// Generate a key if it's not set.
					if (key === undefined)
					{
						// Generate a key.
						transaction._data[storeName].key++;
						key = transaction._data[storeName].key;

						// Set key on value if keyPath is set.
						if (keyPath) value[keyPath] = key;
					}

					// Save the value.
					const records = transaction._data[storeName].records;
					records.set(key, value);

				});
			}

			// Alias for put()
			function add(value, key) { return store.put(value, key); }

			// Delete a record by key.
			function _delete(range)
			{
				// Check params.
				if (!validKey(range) && !validKeyRange(range)) throw new DOMException('IDBObjectStore.delete(): The range parameter was provided but does not contain a valid key (number, string, date) or key range (IDBKeyRange or array of valid keys)', 'DataError');

				// Check state.
				if (transaction.mode === 'readonly') throw new DOMException('IDBObjectStore.delete(): Transaction is read only', 'ReadOnlyError');
				if (transaction._finished) throw new DOMException('IDBObjectStore.delete(): Transaction has finished', 'InvalidStateError');

				// Return an IDBRequest on the transaction that deletes values in the range.
				return transaction._request(store, () => {

					// Check state.
					if (transaction._finished) throw new DOMException('IDBObjectStore.delete(): Transaction has finished', 'InvalidStateError');
					if (!transaction._data[storeName]) throw new DOMException('IDBObjectStore.delete(): Object store \'' + storeName + '\' does not exist', 'InvalidStateError');

					// Delete matching keys in records.
					const records = transaction._data[storeName].records;
					for (const [primary] of records) if (keyInRange(primary, range)) records.delete(primary);

				});
			}

			// Clear all documents.
			function clear()
			{
				// Check state.
				if (transaction._finished) throw new DOMException('IDBObjectStore.clear(): Transaction has finished', 'InvalidStateError');

				// Return an IDBRequest on the transaction that deletes everything in the store.
				return transaction._request(store, () => {

					// Check state.
					if (transaction._finished) throw new DOMException('IDBObjectStore.clear(): Transaction has finished', 'InvalidStateError');
					if (!transaction._data[storeName]) throw new DOMException('IDBObjectStore.clear(): Object store \'' + storeName + '\' does not exist', 'InvalidStateError');

					// Clear all records.
					transaction._data[storeName].records.clear();

				});
			}

			// Get an existing index.
			function index(indexName)
			{
				// Check params.
				if (!validIdentifier(indexName)) throw new TypeError('IDBObjectStore.index(): indexName must be a valid identifier');

				// Check state.
				if (transaction._finished) throw new DOMException('IDBObjectStore.index(): Transaction has finished', 'InvalidStateError');
				if (!transaction._data[storeName]) throw new DOMException('IDBObjectStore.index(): Object store \'' + storeName + '\' does not exist', 'InvalidStateError');
				if (!transaction._data[storeName].indexes[indexName]) throw new DOMException('IDBObjectStore.index(): Index \'' + indexName + '\' does not exist', 'InvalidStateError');

				// Return the existing index.
				return new IDBIndex(store, indexName);
			}

			// Create an index on this object store.
			function createIndex(indexName, keyPath, { unique = false, multiEntry = false } = { unique: false, multiEntry: false })
			{
				// Check params.
				if (!validIdentifier(indexName)) throw new TypeError('IDBObjectStore.createIndex(): indexName must be a valid identifier');
				if (!validKeyPath(keyPath) && !validMultiKeyPath(keyPath)) throw new TypeError('IDBObjectStore.createIndex(): keyPath must be a valid key path (\'a\' or \'a.b\') or array of valid key paths');
				if (typeof unique !== 'boolean') throw new TypeError('IDBObjectStore.createIndex(): unique must be boolean');
				if (typeof multiEntry !== 'boolean') throw new TypeError('IDBObjectStore.createIndex(): multiEntry must be boolean');

				// Block array keys.
				if (validMultiKeyPath(keyPath)) throw new TypeError('IDBObjectStore.createIndex(): array keyPaths are not yet supported by this mock'); // @todo add support for array keyPaths.

				// Check state.
				if (transaction._finished) throw new DOMException('IDBObjectStore.createIndex(): Transaction has finished', 'InvalidStateError');
				if (transaction.mode !== 'versionchange') throw new DOMException('IDBObjectStore.createIndex(): Can only be used used within an active \'versionchange\' transaction, not \'' + transaction.mode + '\'', 'InvalidStateError');
				if (!transaction._data[storeName]) throw new DOMException('IDBObjectStore.createIndex(): Object store \'' + storeName + '\' does not exist', 'InvalidStateError');
				if (transaction._data[storeName].indexes[indexName]) throw new DOMException('IDBObjectStore.createIndex(): Index already exists', 'ConstraintError');

				// Create a plain data template for this index.
				transaction._data[storeName].indexes[indexName] = { keyPath: keyPath, unique: unique, multiEntry: multiEntry };

				// Return a new IDBIndex.
				return new IDBIndex(store, indexName);
			}

			// Delete an index on this object store.
			function deleteIndex(indexName)
			{
				// Check params.
				if (!validIdentifier(indexName)) throw new TypeError('IDBObjectStore.deleteIndex(): indexName must be a valid identifier');

				// Check state.
				if (transaction._finished) throw new DOMException('IDBObjectStore.deleteIndex(): Transaction has finished', 'InvalidStateError');
				if (transaction.mode !== 'versionchange') throw new DOMException('IDBObjectStore.deleteIndex(): Can only be used used within an active \'versionchange\' transaction, not \'' + transaction.mode + '\'', 'InvalidStateError');
				if (!transaction._data[storeName]) throw new DOMException('IDBObjectStore.deleteIndex(): Object store \'' + storeName + '\' does not exist', 'InvalidStateError');
				if (!transaction._data[storeName].indexes[indexName]) throw new DOMException('IDBObjectStore.deleteIndex(): Index \'' + indexName + '\' does not exist', 'NotFoundError');

				// Delete the index.
				delete transaction._data[storeName].indexes[indexName];
			}
		}
	}

	// IDBIndex mock.
	class IDBIndex
	{
		// Construct.
		constructor(store, indexName)
		{
			// Check params.
			if (!(store instanceof IDBObjectStore)) throw new TypeError('IDBIndex: store must be an IDBObjectStore');
			if (!validIdentifier(indexName)) throw new TypeError('IDBIndex: indexName must be a valid identifier');

			// Vars.
			const index = this;
			const storeName = store.name;
			const transaction = store.transaction;

			// Check state.
			if (!transaction._data[storeName]) throw new DOMException('IDBIndex: Object store \'' + storeName + '\' does not exist', 'InvalidStateError');
			if (!transaction._data[storeName].indexes[indexName]) throw new DOMException('IDBIndex: Index \'' + indexName + '\' does not exist', 'InvalidStateError');

			// Vars.
			const { keyPath, unique, multiEntry } = transaction._data[storeName].indexes[indexName];

			// Properties.
			Object.defineProperty(this, 'objectStore', { value: store, enumerable: true });
			Object.defineProperty(this, 'name', { value: indexName, enumerable: true });
			Object.defineProperty(this, 'keyPath', { value: keyPath, enumerable: true });
			Object.defineProperty(this, 'multiEntry', { value: multiEntry, enumerable: true });
			Object.defineProperty(this, 'unique', { value: unique, enumerable: true });

			// Methods.
			Object.defineProperty(this, 'count', { value: count });
			Object.defineProperty(this, 'get', { value: get });
			Object.defineProperty(this, 'openCursor', { value: openCursor });

			// Lock it down.
			Object.freeze(this);

			// Count documents.
			function count(key = undefined)
			{
				// Check params.
				if (!validKey(key) && !validKeyRange(key) && key !== undefined) throw new DOMException('count(): The key parameter was provided but does not contain a valid key (number, string, date), key range (IDBKeyRange or array of valid keys), or undefined', 'DataError');

				// Check state.
				if (transaction._finished) throw new DOMException('IDBIndex.count(): Transaction has finished', 'InvalidStateError');
				if (!transaction._data[storeName]) throw new DOMException('IDBIndex.count(): Object store \'' + storeName + '\' does not exist', 'InvalidStateError');
				if (!transaction._data[storeName].indexes[indexName]) throw new DOMException('IDBIndex.count(): Index \'' + indexName + '\' does not exist', 'InvalidStateError');

				// Return an IDBRequest on the transaction returns the count from a cursor.
				return transaction._request(index, request => {

					// Check state.
					if (transaction._finished) throw new DOMException('IDBIndex.count(): Transaction has finished', 'InvalidStateError');
					if (!transaction._data[storeName]) throw new DOMException('IDBIndex.count(): Object store \'' + storeName + '\' does not exist', 'InvalidStateError');
					if (!transaction._data[storeName].indexes[indexName]) throw new DOMException('IDBIndex.count(): Index \'' + indexName + '\' does not exist', 'InvalidStateError');

					// Return the number of keys found on the cursor.
					return new IDBCursor(request, key)._count;

				});
			}

			// Get a single result.
			// Returns a request that fires a 'success' event when its result is available.
			// `request.result` will be either:
			// 1. The value for the first result with a key matching `key`.
			// 2. `undefined`, if there are no matching results.
			function get(key = undefined)
			{
				// Check params.
				if (!validKey(key) && !validKeyRange(key) && key !== undefined) throw new DOMException('count(): The key parameter was provided but does not contain a valid key (number, string, date), key range (IDBKeyRange or array of valid keys), or undefined', 'DataError');

				// Check state.
				if (transaction._finished) throw new DOMException('IDBIndex.get(): Transaction has finished', 'InvalidStateError');
				if (!transaction._data[storeName]) throw new DOMException('IDBIndex.get(): Object store \'' + storeName + '\' does not exist', 'InvalidStateError');
				if (!transaction._data[storeName].indexes[indexName]) throw new DOMException('IDBIndex.get(): Index \'' + indexName + '\' does not exist', 'InvalidStateError');

				// Return an IDBRequest on the transaction.
				return transaction._request(index, request => {

					// Check state.
					if (transaction._finished) throw new DOMException('IDBIndex.get(): Transaction has finished', 'InvalidStateError');
					if (!transaction._data[storeName]) throw new DOMException('IDBIndex.get(): Object store \'' + storeName + '\' does not exist', 'InvalidStateError');
					if (!transaction._data[storeName].indexes[indexName]) throw new DOMException('IDBIndex.get(): Index \'' + indexName + '\' does not exist', 'InvalidStateError');

					// Return the value of the first key found by the cursor.
					return new IDBCursorWithValue(request, key).value;

				});
			}

			// Open a cursor to retrieve several results.
			// Returns a request that fires one or more 'success' events when its results is available.
			// Continues to fire 'success' as many times as `cursor.continue()` is called and results are available.
			// request.result will be either:
			// 1. An `IDBCursor` (with `cursor.value` and `cursor.key` to read values, and `cursor.continue()` method to continue).
			// 2. `undefined`, if there are no more results.
			function openCursor(query = undefined, direction = 'next')
			{
				// Check params.
				if (!validKey(query) && !validKeyRange(query) && query !== undefined) throw new DOMException('count(): The query parameter was provided but does not contain a valid key (number, string, date), key range (IDBKeyRange or array of valid keys), or undefined', 'DataError');
				if (direction !== 'next' && direction !== 'nextunique' && direction !== 'prev' && direction !== 'prevunique') throw new TypeError('IDBCursor: direction must be one of \'next\', \'nextunique\', \'prev\', \'prevunique\'');

				// Check state.
				if (transaction._finished) throw new DOMException('IDBIndex.openCursor(): Transaction has finished', 'InvalidStateError');
				if (!transaction._data[storeName]) throw new DOMException('IDBIndex.openCursor(): Object store \'' + storeName + '\' does not exist', 'InvalidStateError');
				if (!transaction._data[storeName].indexes[indexName]) throw new DOMException('IDBIndex.openCursor(): Index \'' + indexName + '\' does not exist', 'InvalidStateError');

				// Return an IDBRequest.
				// The result of the request is an IDBCursor (if there's a value at the current cursor position),
				// or undefined (if there isn't, because we iterated past the end or there were no results).
				let cursor;
				return transaction._request(index, request => {

					// Check state.
					if (transaction._finished) throw new DOMException('IDBIndex.openCursor(): Transaction has finished', 'InvalidStateError');
					if (!transaction._data[storeName]) throw new DOMException('IDBIndex.openCursor(): Object store \'' + storeName + '\' does not exist', 'InvalidStateError');
					if (!transaction._data[storeName].indexes[indexName]) throw new DOMException('IDBIndex.openCursor(): Index \'' + indexName + '\' does not exist', 'InvalidStateError');

					// Make a cursor if it doesn't exist.
					// Don't create the cursor until the request is run.
					// (Otherwise records added by other requests between this request being created and it being run, won't be included.)
					if (!cursor) cursor = new IDBCursorWithValue(request, query, direction);

					// Return cursor if there is a value.
					return cursor.primaryKey !== undefined ? cursor : undefined;

				});
			}
		}
	}

	// IDBCursor mock.
	class IDBCursor
	{
		// Construct.
		constructor(request, range = undefined, direction = 'next', withValue = false)
		{
			// Check params.
			if (!(request instanceof IDBRequest)) throw new TypeError('IDBCursor: request must be an IDBRequest');
			if (!(request.source instanceof IDBObjectStore) && !(request.source instanceof IDBIndex)) throw new TypeError('IDBCursor: request must have a source that must be an IDBObjectStore or an IDBIndex');
			if (direction !== 'next' && direction !== 'nextunique' && direction !== 'prev' && direction !== 'prevunique') throw new TypeError('IDBCursor: direction must be one of \'next\', \'nextunique\', \'prev\', \'prevunique\'');
			if (!validKey(range) && !validKeyRange(range) && range !== undefined) throw new TypeError('IDBCursor: range must be a valid key (string, number, date), key range (array, IDBKeyRange), or undefined');

			// Vars.
			const transaction = request.transaction;
			const source = request.source;
			const store = source instanceof IDBObjectStore ? source : source.objectStore;
			const storeName = store.name;
			const index = source instanceof IDBIndex ? source : null;
			const indexName = index ? index.name : null;

			// Check state.
			if (!transaction._data[storeName]) throw new DOMException('IDBCursor: Object store \'' + storeName + '\' does not exist', 'InvalidStateError');
			if (index && !transaction._data[storeName].indexes[indexName]) throw new DOMException('IDBCursor: Index \'' + indexName + '\' does not exist', 'InvalidStateError');

			// Vars.
			const keys = find(transaction._data[storeName].records);
			let value = undefined;
			let key = undefined;
			let primaryKey = undefined;

			// Properties.
			Object.defineProperty(this, 'request', { value: request, enumerable: true });
			Object.defineProperty(this, 'source', { value: source, enumerable: true });
			Object.defineProperty(this, 'direction', { value: direction, enumerable: true });
			Object.defineProperty(this, 'key', {
				enumerable: true,
				get() { return key; },
				set() { throw new Error('IDBCursor: key is read only'); },
			});
			Object.defineProperty(this, 'primaryKey', {
				enumerable: true,
				get() { return primaryKey; },
				set() { throw new Error('IDBCursor: primaryKey is read only'); },
			});
			if (withValue) Object.defineProperty(this, 'value', {
				enumerable: true,
				get() { return value; },
				set() { throw new Error('IDBCursor: value is read only'); },
			});
			Object.defineProperty(this, '_count', { value: keys.length });

			// Go to the first key.
			progress();

			// Methods.
			Object.defineProperty(this, 'advance', { value: advance });
			Object.defineProperty(this, 'continue', { value: _continue });
			Object.defineProperty(this, 'continuePrimaryKey', { value: continuePrimaryKey });
			if (withValue) Object.defineProperty(this, 'delete', { value: _delete });
			if (withValue) Object.defineProperty(this, 'update', { value: update });

			// Lock it down.
			Object.freeze(this);

			// Functions.
			function progress()
			{
				// Set key, value, primaryKey
				if (keys.length)
				{
					// Get key and primaryKey from list.
					key = keys[0][0];
					primaryKey  = keys[0][1];
					keys.shift();

					// Fill in the value if neccessary.possible.
					if (withValue) value = transaction._data[storeName].records.get(primaryKey);
				}
				else
				{
					key = undefined;
					primaryKey = undefined;
					value = undefined;
				}
			}

			// Sets the number times a cursor should move its position forward.
			function advance(count)
			{
				// Check params.
				if (typeof count !== 'number') throw new TypeError('advance(): count must be a number');
				if (count <= 0) throw new TypeError('advance(): count must be 1 or more');

				// Check state.
				if (!keys.length) throw new DOMException('advance(): Cursor has iterated past the end of the set', 'InvalidStateError');
				if (request.readyState !== 'done') throw new DOMException('advance(): Cursor is currently iterating', 'InvalidStateError');
				if (!transaction._data[storeName]) throw new DOMException('advance(): Object store \'' + storeName + '\' does not exist', 'InvalidStateError');

				// Move forward by count.
				for (let i = 0; i < count; i++) progress();

				// Run the request again.
				request._rerun();
			}

			// Continue on to the next one, or onto a specific one.
			function _continue(targetKey = undefined)
			{
				// Check params.
				if (!validKey(targetKey) && !validKeyRange(targetKey) && targetKey !== undefined) throw new DOMException('continue(): targetKey must be a valid key (string, number, date), key range (array or IDBKeyRange), or undefined', 'DataError');

				// Check state.
				if (!primaryKey) throw new DOMException('continue(): Cursor has iterated past the end of the set', 'InvalidStateError');
				if (request.readyState !== 'done') throw new DOMException('continue(): Cursor is currently iterating', 'InvalidStateError');
				if (!transaction._data[storeName]) throw new DOMException('continue(): Object store \'' + storeName + '\' does not exist', 'InvalidStateError');

				// Move forward by one.
				progress();

				// If key is not null, continue to progress until we find key or reach the end.
				if (targetKey !== undefined) while (primaryKey !== undefined && !keyInRange(key, targetKey)) progress();

				// Run the request again.
				request._rerun();
			}

			// Continue on to the next one that matches
			function continuePrimaryKey(targetKey, targetPrimaryKey)
			{
				// Check params.
				if (!validKey(targetKey) && !validKeyRange(targetKey)) throw new DOMException('continuePrimaryKey(): targetKey must be a valid key (string, number, date) or key range (array or IDBKeyRange)', 'DataError');
				if (!validKey(targetPrimaryKey) && !validKeyRange(targetPrimaryKey)) throw new DOMException('continuePrimaryKey(): targetPrimaryKey must be a valid key (string, number, date) or key range (array or IDBKeyRange)', 'DataError');

				// Check state.
				if (!keys.length) throw new DOMException('continuePrimaryKey(): Cursor has iterated past the end of the set', 'InvalidStateError');
				if (request.readyState !== 'done') throw new DOMException('continuePrimaryKey(): Cursor is currently iterating', 'InvalidStateError');
				if (!transaction._data[storeName]) throw new DOMException('continuePrimaryKey(): Object store \'' + storeName + '\' does not exist', 'InvalidStateError');

				// Continue until we find a value that has the right key and primaryKey.
				while (primaryKey !== undefined && !keyInRange(key, targetKey) && !keyInRange(primaryKey, targetPrimaryKey)) progress();

				// Run the request again.
				request._rerun();
			}

			// Delete the current primary key.
			function _delete()
			{
				// Checks.
				if (primaryKey !== null) throw new DOMException('delete(): Cursor does not have a value', 'InvalidStateError');

				// Return a request from IDBObjectStore.delete().
				return store.delete(primaryKey);
			}

			// Update the current primary key.
			function update(value)
			{
				// Checks.
				if (primaryKey !== null) throw new DOMException('update(): Cursor does not have a value', 'InvalidStateError');

				// Return a request from IDBObjectStore.put().
				return store.put(value, primaryKey);
			}

			// Find matching keys.
			function find(records)
			{
				// Vars.
				const keys = [];

				// Source is index or object store?
				if (index)
				{
					// Index source.
					// Loop through records.
					for (const [primary, value] of records)
					{
						// Get key at index.keyPath and filter.
						const key = (value instanceof Object ? value[index.keyPath] : undefined);
						if (range === undefined || keyInRange(key, range)) keys.push([key, primary]);
					}
				}
				else
				{
					// Object store source.
					// Loop through records and filter.
					for (const [primary] of records) if (range === undefined || keyInRange(primary, range)) keys.push([primary, primary]);
				}

				// Sort the keys by key.
				const sortedKeys = keys.sort((a,b) => IDBFactory.cmp(a[0],b[0]));

				// Possibly remove duplicate keys.
				if (direction === 'nextunique' || direction === 'prevunique') for (let i = sortedKeys.length-2; i >= 0; i--) if (sortedKeys[i] === sortedKeys[i+1]) sortedKeys.splice(i+1, 1);

				// Possibly reverse the keys.
				if (direction === 'prev' || direction === 'prevunique') sortedKeys.reverse();

				// Return.
				return sortedKeys;
			}
		}
	}

	// IDBCursorWithValue mock.
	class IDBCursorWithValue extends IDBCursor
	{
		// Construct.
		constructor(request, range = undefined, direction = 'next')
		{
			// Super.
			super(request, range, direction, true);
		}
	}

	// IDBKeyRange mock.
	class IDBKeyRange
	{
		// Construct.
		constructor(lower, upper, lowerOpen = false, upperOpen = false)
		{
			// Checks.
			if (!validKey(lower) && lower !== undefined) throw new DOMException('IDBKeyRange: lower must be a valid key (string, number, date) or undefined', 'DataError');
			if (!validKey(upper) && upper !== undefined) throw new DOMException('IDBKeyRange: upper must be a valid key (string, number, date) or undefined', 'DataError');
			if (typeof lowerOpen !== 'boolean') throw new DOMException('IDBKeyRange: lowerOpen must be boolean', 'DataError');
			if (typeof upperOpen !== 'boolean') throw new DOMException('IDBKeyRange: upperOpen must be boolean', 'DataError');
			if (lower > upper) throw new DOMException('IDBKeyRange: lower must be lower than upper', 'DataError');

			// Properties.
			Object.defineProperty(this, 'lower', { value: lower, enumerable: true });
			Object.defineProperty(this, 'upper', { value: upper, enumerable: true });
			Object.defineProperty(this, 'lowerOpen', { value: lowerOpen, enumerable: true });
			Object.defineProperty(this, 'upperOpen', { value: upperOpen, enumerable: true });

			// Methods.
			Object.defineProperty(this, 'includes', { value: includes });

			// Lock it down.
			Object.freeze(this);

			// Whether or not the given value is included in this range.
			function includes(key)
			{
				// Checks.
				if (!validKey(key)) throw new DOMException('includes(): key must be a valid key (string, number, date)', 'DataError');

				// See if it's in the range.
				if (upper !== undefined)
				{
					if (upperOpen) { if (key >= upper) return false; }
					else { if (key > upper) return false; }
				}
				if (lower !== undefined)
				{
					if (lowerOpen) { if (key <= lower) return false; }
					else { if (key < lower) return false; }
				}
				return true;
			}
		}
	}

		// Create a key range with upper/lower bounds (static).
		IDBKeyRange.bound = function (lower, upper, lowerOpen = false, upperOpen = false)
		{
			// Checks.
			if (!validKey(lower)) throw new DOMException('bound(): lower must be a valid key (string, number, date)', 'DataError');
			if (!validKey(upper)) throw new DOMException('bound(): upper must be a valid key (string, number, date)', 'DataError');
			if (typeof lowerOpen !== 'boolean') throw new DOMException('bound(): lowerOpen must be boolean', 'DataError');
			if (typeof upperOpen !== 'boolean') throw new DOMException('bound(): upperOpen must be boolean', 'DataError');
			if (lower > upper) throw new DOMException('bound(): lower must be lower than upper', 'DataError');

			// Make an IDBKeyRange and return it.
			return new IDBKeyRange(lower, upper, lowerOpen, upperOpen);
		}

		// Create a key range with a single key (static).
		IDBKeyRange.only = function (value)
		{
			// Checks.
			if (!validKey(value)) throw new DOMException('only(): value must be a valid key (string, number, date)', 'DataError');

			// Make an IDBKeyRange and return it.
			return new IDBKeyRange(value, value, false, false);
		}

		// Create a key range with a lower bound but no upper bound (static).
		IDBKeyRange.lowerBound = function (value, open = false)
		{
			// Checks.
			if (!validKey(value)) throw new DOMException('lowerBound(): value must be a valid key (string, number, date)', 'DataError');
			if (typeof open !== 'boolean') throw new DOMException('lowerBound(): open must be boolean', 'DataError');

			// Make an IDBKeyRange and return it.
			return new IDBKeyRange(value, undefined, open, true);
		}

		// Create a key range with an upper bound but no lower bound (static).
		IDBKeyRange.upperBound = function (value, open = false)
		{
			// Checks.
			if (!validKey(value)) throw new DOMException('upperBound(): value must be a valid key (string, number, date)', 'DataError');
			if (typeof open !== 'boolean') throw new DOMException('upperBound(): open must be boolean', 'DataError');

			// Make an IDBKeyRange and return it.
			return new IDBKeyRange(undefined, value, true, open);
		}

	// IDBVersionChangeEvent mock.
	class IDBVersionChangeEvent extends Event
	{
		// Construct.
		constructor(name, oldVersion, newVersion)
		{
			// Check.
			if (typeof name !== 'string') throw new TypeError('IDBVersionChangeEvent: name must be string');
			if (typeof oldVersion !== 'number' && oldVersion !== 0) throw new TypeError('IDBVersionChangeEvent: oldVersion must be number');
			if (typeof newVersion !== 'number') throw new TypeError('IDBVersionChangeEvent: newVersion must be number');

			// Super.
			super(name, { bubbles: false, cancelable: false });

			// Public.
			Object.defineProperty(this, 'oldVersion', { value: oldVersion, enumerable: true });
			Object.defineProperty(this, 'newVersion', { value: newVersion, enumerable: true });

			// Lock it down.
			Object.freeze(this);
		}
	}

	// DOMException mock.
	// Name should be one of e.g. AbortError, ConstraintError, QuotaExceededError, UnknownError, NoError, VersionError
	class DOMException extends Error
	{
		// Construct.
		constructor(message = '', name = '')
		{
			// Super.
			super(message);

			// Check.
			if (typeof name !== 'string') throw new TypeError('DOMException: name must be string');

			// Properties.
			Object.defineProperty(this, 'name', { value: name });

			// Lock it down.
			Object.freeze(this);
		}
	}

// Functions.

	// Reset data.
	function reset()
	{
		// Delete everything.
		for (const key in connections) delete connections[key];
		for (const key in versions) delete versions[key];
		for (const key in storage) delete storage[key];
	}

	// Is the supplied identified a valid identifier?
	const r_identifier = /^[a-z_][a-zA-Z0-9_\-\$]*$/;
	function validIdentifier(identifier)
	{
		if (typeof identifier === 'string' && identifier.match(r_identifier)) return true;
		else return false;
	}

	// Is the supplied key a valid keyPath?
	// e.g. 'id' or 'abc' or 'abc.def'
	function validKeyPath(keyPath)
	{
		if (typeof keyPath === 'string')
		{
			// Can be either 'abc' or 'abc.def'.
			const keyPathParts = keyPath.split('.');
			for (let i = 0; i < keyPathParts.length; i++) if (!validIdentifier(keyPathParts[i])) return false;
			return true;
		}
		else return false;
	}

	// Is the supplied array an array of valid key paths?
	// e.g. ['id', 'abc', 'abc.def']
	function validMultiKeyPath(keyPath)
	{
		if (keyPath instanceof Array)
		{
			// An array of otherwise valid single key paths.
			if (keyPath.length < 1) return false;
			for (let i = 0; i < keyPath.length; i++) if (!validKeyPath(keyPath[i])) return false;
			return true;
		}
		else return false;
	}

	// Valid version number.
	function validVersion(version)
	{
		// Must be a round finite number that's more than 1.
		if (typeof version === 'number' && version > 0 && isFinite(version) && version === Math.round(version)) return true;
		else return false;
	}

	// Is the supplied key a valid key?
	function validKey(key)
	{
		// Simple keys.
		if (typeof key === 'number' && isFinite(key)) return true;
		else if (typeof key === 'string') return true;
		else if (key instanceof Date) return true;
		return false;
	}

	// Is the supplied key a valid key range?
	function validKeyRange(key)
	{
		if (key instanceof Array)
		{
			if (key.length < 1) return false;
			for (let i = 0; i < key.length; i++) if (!validKey(key[i]) && !validKeyRange(key[i])) return false;
			return true;
		}
		if (key instanceof IDBKeyRange) return true;
		return false;
	}

	// Is the key in the key range?
	function keyInRange(key, range)
	{
		// Primitive ranges use simple comparisons.
		if (typeof range === 'number' || typeof range === 'string') return key === range;

		// Array ranges just test existance.
		if (range instanceof Array)
		{
			for (let i = 0; i < range.length; i++) if (keyInRange(key, range[i])) return true;
			return false;
		}

		// IDBKeyRanges test the key being inside the higher and lower range.
		if (range instanceof IDBKeyRange) return range.includes(key);

		// Anything else is false.
		return false;
	}

	// Deep clone a value.
	// Uses realistic-structured-clone to be as close to that as possible.
	function clone(value)
	{
		// Return a cloned value.
		return structuredClone(value);
	}

// Exports.
module.exports.IDBFactory = IDBFactory;
module.exports.IDBDatabase = IDBDatabase;
module.exports.IDBTransaction = IDBTransaction;
module.exports.IDBRequest = IDBRequest;
module.exports.IDBOpenDBRequest = IDBOpenDBRequest;
module.exports.IDBObjectStore = IDBObjectStore;
module.exports.IDBIndex = IDBIndex;
module.exports.IDBCursor = IDBCursor;
module.exports.IDBCursorWithValue = IDBCursorWithValue;
module.exports.IDBKeyRange = IDBKeyRange;
module.exports.IDBVersionChangeEvent = IDBVersionChangeEvent;
module.exports.DOMException = DOMException;
module.exports.helpers = {
	validIdentifier: validIdentifier,
	validKeyPath: validKeyPath,
	validMultiKeyPath: validMultiKeyPath,
	validVersion: validVersion,
	validKey: validKey,
	validKeyRange: validKeyRange,
	keyInRange: keyInRange,
	clone: clone,
};
module.exports.reset = reset;