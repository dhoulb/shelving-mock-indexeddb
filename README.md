# IndexedDB API mock

[![Build Status](https://travis-ci.org/dhoulb/shelving-mock-indexeddb.svg?branch=master)](https://travis-ci.org/dhoulb/shelving-mock-indexeddb)

Unit tested mock implementation of the browser IndexedDB API. Conforms as closely as possible to the [W3C Indexed Database API](https://www.w3.org/TR/IndexedDB/) (version 1.0).

**Important:** There are two outstanding features from the IndexedDB 1.0 spec that are not supported by this mock:

- Enforcing constraint for unique indexes (throw `DOMException('DataError')` on `put()` and `add()` etc).
- Indexes with array (multiple) keypaths and support for the `multiEntry` flag.

**Please note:** This mock does not support any functionality added in the 2.0 spec, such as `getAll()`, `getKey()`, `getAllKeys()` and `openKeyCursor()`

## Installation

```
npm install shelving-mock-indexeddb
```

## Usage

### Example: Using IndexedDB mock for Jest tests
This example shows the IndexedDB mock in use for testing including requiring the mock, making it global (so your code can access it through `window.indexedDB`, as it would in a browser), and inserting/reading records.

```js
// Require the mock.
const { IDBFactory, IDBKeyRange, reset } = require('shelving-mock-indexeddb');

// Create an IDBFactory at window.indexedDB so your code can use IndexedDB.
window.indexedDB = new IDBFactory();

// Make IDBKeyRange global so your code can create key ranges.
window.IDBKeyRange = IDBKeyRange;

// Reset the IndexedDB mock before/after tests.
// This will clear all object stores, indexes, and data.
beforeEach(() => reset());
afterEach(() => reset());

// The IndexedDB mock uses setTimeout() to simulate the asyncronous API.
// Add fake timers before/after tests to ensure the asyncronous responses are received by the test.
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.runAllTimers());

// Your tests...
test('etc', () => {

	// Simple IndexedDB example.
	// Open a connection to IndexedDB database (version 1).
	const request = window.indexedDB.open('myDatabase', 1);

	// 'upgradeneeded' will be called as the IndexedDB currently doesn't contain any object stores or data.
	request.addEventListener('upgradeneeded', () => {

		// Create an object store.
		// IDBDatabase object is accessed by request.result
		const store = request.result.createObjectStore('myStore', { keyPath: 'id', autoIncrement: true });

		// Create some indexes on some additional properties in the stores.
		const index = store.createIndex('myNameIndex', 'name');
		const index = store.createIndex('myLengthIndex', 'length');

	});

	// 'success' will be called after the 'upgradeneeded' event.
	request.addEventListener('success', () => {

		// Create a readwrite transaction and put some data into the store.
		const putTransaction = request.result.transaction(['myStore'], 'readwrite');
		const putStore = putTransaction.objectStore('myStore');
		putStore.put({ name: 'Fusilli', length: 4 }); // ID: 1
		putStore.put({ name: 'Spaghetti', length: 22 }); // ID: 2
		putStore.put({ name: 'Linguini', length: 28 }); // ID: 3
		putStore.put({ name: 'Tagliatteli', length: 22 }); // ID: 4

		// Create a readonly transaction and read back the data.
		const getTransaction = request.result.transaction(['myStore'], 'readonly');
		const getStore = getTransaction.objectStore('myStore');
		getStore.get(2).addEventListener('success', (event) => {
			// Result is { id: 2, name: 'Spaghetti'...
			console.log('Found', event.target.result);
		});
		getStore.get(4).addEventListener('success', (event) => {
			// Result is { id: 4, name: 'Tagliatteli'...
			console.log('Found', event.target.result);
		});

		// Create a readonly transaction and count some data that matches the queries.
		const indexTransaction = request.result.transaction(['myStore'], 'readonly');
		const indexStore = indexTransaction.objectStore('myStore');
		const lengthIndex = indexStore.index('myLengthIndex');
		const nameIndex = indexStore.index('myNameIndex');
		nameIndex.count('Fusilli').addEventListener('success', (event) => { 
			// Result is 1.
			console.log('Found ' + event.target.result + ' pasta called Fusilli');
		});
		lengthIndex.count(IDBKeyRange.upperBound(20)).addEventListener('success', (event) => { 
			// Result is 3.
			console.log('Found ' + event.target.result + ' pastas with length > 20');
		});

	});

});
```

## API

### IndexedDB

This mock is conformant to the [W3C Indexed Database API](https://www.w3.org/TR/IndexedDB/) (version 1.0). Once required and set as global (see the example above), it will work like the standard IndexedDB API. 

For additional usage examples of the IndexedDB API see the [Mozilla IndexedDB API documentation](https://developer.mozilla.org/en-US/docs/IndexedDB). 

For reference, this mock provides the following objects from the IndexedDB API:

- `IDBFactory`
- `IDBDatabase`
- `IDBTransaction`
- `IDBRequest`
- `IDBOpenDBRequest`
- `IDBObjectStore`
- `IDBIndex`
- `IDBKeyRange`
- `IDBCursor`
- `IDBCursorWithValue`

### Reset

- `reset()`
	Resets all data in the database. Clears all version, object stores, and data.

## Todo

- [ ] Enforce constraint for unique indexes (throw `DOMException('DataError')` on `put()` and `add()` etc).
- [ ] Allow indexes with array (multiple) keypaths and support for `multiEntry` flag.
- [ ] Add support for [https://w3c.github.io/IndexedDB/#async-api](Indexed Database API 2.0) features.