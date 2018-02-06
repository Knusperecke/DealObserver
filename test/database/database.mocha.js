'use strict';

const Database = require('../../src/database/database');
const assert = require('chai').assert;

const newOutletItem = {
    name: 'Speedmax CF 9.0 2017',
    id: 'speedmax cf 9.0 2017',
    price: 2299,
    offerId: '000000000000111695',
    size: '|XL|',
    modelYear: '2017',
    permanent: false,
    url: 'someUrl',
    condition: 'new'
};

const newOutletItemDifferentSize = {
    name: 'Speedmax CF 9.0 2017',
    id: 'speedmax cf 9.0 2017',
    price: 2299,
    offerId: '000000000000111695',
    size: '|XS|',
    modelYear: '2017',
    permanent: false,
    url: 'someUrl',
    condition: 'new'
};

const newOutletItemDifferentCondition = {
    name: 'Speedmax CF 9.0 2017',
    id: 'speedmax cf 9.0 2017',
    price: 2299,
    offerId: '000000000000111695',
    size: '|XS|',
    modelYear: '2017',
    permanent: false,
    url: 'someUrl',
    condition: 'used'
};

const newOutletItemDifferentPrice = {
    name: 'Speedmax CF 9.0 2017',
    id: 'speedmax cf 9.0 2017',
    price: 1199,
    offerId: '000000000000111695',
    size: '|XS|',
    modelYear: '2017',
    permanent: false,
    url: 'someUrl',
    condition: 'used'
};

const newPermanentItem = {
    name: 'Speedmax CF 9.0 2017',
    id: 'speedmax cf 9.0 2017',
    price: 2299,
    offerId: '000000000000111695',
    size: '|XL|',
    modelYear: '2017',
    permanent: true,
    url: 'someUrl',
    condition: 'new'
};

const newPermanentItemUpdatedPrice = {
    name: 'Speedmax CF 9.0 2017',
    id: 'speedmax cf 9.0 2017',
    price: 1299,
    offerId: '000000000000111695',
    size: '|XL|',
    modelYear: '2017',
    permanent: true,
    url: 'someUrl',
    condition: 'new'
};

describe('Database', () => {
    function createDatabase(dropTables = true) {
        return Database('localhost', 'root', 'PinkiePie', 'test', dropTables);
    }

    it('Provides a function to connect', (done) => {
        assert.isFunction(Database);
        done();
    });

    it('Returns an object', (done) => {
        const db = createDatabase();
        assert.isObject(db);
        db.close(done);
    });

    it('Returns an object with a "query" function', (done) => {
        const db = createDatabase();
        assert.isFunction(db.query)
        db.close(done);
    });

    it('Returns an object with a "promiseQuery" function', (done) => {
        const db = createDatabase();
        assert.isFunction(db.promiseQuery)
        db.close(done);
    });

    it('Returns an object with a "close" function', (done) => {
        const db = createDatabase();
        assert.isFunction(db.close)
        db.close(done);
    });

    it('Can close a newly created connection', async () => {
        const db = createDatabase();

        await new Promise((resolve) => {
            db.close(function() {
                assert.ok(true);
                resolve();
            });
        });
    });

    it('Query function supports a simple query', async () => {
        const db = createDatabase();

        await new Promise((resolve) => {
            db.query('SELECT 1 + 1 AS solution', function(results) {
                assert.deepEqual(results[0].solution, 2);
                resolve();
            });
        });

        await new Promise((resolve) => db.close(resolve));
    });

    it('promiseQuery supports a simple query', async () => {
        const db = createDatabase();

        await db.promiseQuery('SELECT 1 + 1 AS solution').then((results) => {
            assert.deepEqual(results[0].solution, 2);
        });

        await new Promise((resolve) => db.close(resolve));
    });

    it('Does not drops tables per default', async () => {
        let db = createDatabase();
        await db.promiseQuery('INSERT INTO current (historyId) VALUES (7)');
        await new Promise((resolve) => db.close(resolve));

        db = createDatabase(false);
        await db.promiseQuery('SELECT historyId FROM current').then((results) => {
            assert.deepEqual(results[0].historyId, 7);
        });
        await new Promise((resolve) => db.close(resolve));
    });

    ['models', 'current', 'history'].forEach((name) => {
        it(`Database has a table named ${name}`, async () => {
            const db = createDatabase();

            await new Promise((resolve) => {
                db.query(`SELECT * FROM ${name}`, function() {
                    assert.ok(true);
                    resolve();
                });
            });

            await new Promise((resolve) => db.close(resolve));
        });
    });

    it('Returns an object with a "push" function', (done) => {
        const db = createDatabase();
        assert.isFunction(db.push)
        db.close(done);
    });

    it('"push" function accepts an empty array', async () => {
        const db = createDatabase();
        await db.push([]).then(() => assert.ok(true));
        await new Promise((resolve) => db.close(resolve));
    });

    it('"push" function returns a promise that provides an object', async () => {
        const db = createDatabase();
        await db.push([]).then((updates) => {
            assert.isObject(updates);
            assert.deepEqual(updates.priceUpdates.length, 0);
            assert.deepEqual(updates.newOffers.length, 0);
        });
        await new Promise((resolve) => db.close(resolve));
    });

    it('"push" function handles a new item', async () => {
        const db = createDatabase();

        await db.push([newOutletItem]).then((updates) => {
            assert.isObject(updates);
            assert.deepEqual(updates.priceUpdates.length, 0);
            assert.deepEqual(updates.newOffers.length, 1);
            assert.deepEqual(updates.newOffers[0], newOutletItem);
        });

        await new Promise((resolve) => db.close(resolve));
    });

    it('"push" function detects known items', async () => {
        const db = createDatabase();

        await db.push([newOutletItem]);
        await db.push([newOutletItem]).then((updates) => {
            assert.isObject(updates);
            assert.deepEqual(updates.priceUpdates.length, 0);
            assert.deepEqual(updates.newOffers.length, 0);
        });

        await new Promise((resolve) => db.close(resolve));
    });

    it('"push" function discerns size of items', async () => {
        const db = createDatabase();

        await db.push([newOutletItem]);
        await db.push([newOutletItemDifferentSize]).then((updates) => {
            assert.isObject(updates);
            assert.deepEqual(updates.priceUpdates.length, 0);
            assert.deepEqual(updates.newOffers.length, 1);
            assert.deepEqual(updates.newOffers[0], newOutletItemDifferentSize);
        });

        await new Promise((resolve) => db.close(resolve));
    });

    it('"push" function discerns condition of items', async () => {
        const db = createDatabase();

        await db.push([newOutletItem]);
        await db.push([newOutletItemDifferentCondition]).then((updates) => {
            assert.isObject(updates);
            assert.deepEqual(updates.priceUpdates.length, 0);
            assert.deepEqual(updates.newOffers.length, 1);
            assert.deepEqual(updates.newOffers[0], newOutletItemDifferentCondition);
        });

        await new Promise((resolve) => db.close(resolve));
    });

    it('"push" function discerns price of items', async () => {
        const db = createDatabase();

        await db.push([newOutletItem]);
        await db.push([newOutletItemDifferentPrice]).then((updates) => {
            assert.isObject(updates);
            assert.deepEqual(updates.priceUpdates.length, 0);
            assert.deepEqual(updates.newOffers.length, 1);
            assert.deepEqual(updates.newOffers[0], newOutletItemDifferentPrice);
        });

        await new Promise((resolve) => db.close(resolve));
    });

    it('"push" function discerns outlet items from permanent items', async () => {
        const db = createDatabase();

        await db.push([newOutletItem]);
        await db.push([newPermanentItem]).then((updates) => {
            assert.isObject(updates);
            assert.deepEqual(updates.priceUpdates.length, 0);
            assert.deepEqual(updates.newOffers.length, 1);
            assert.deepEqual(updates.newOffers[0], newPermanentItem);
        });

        await new Promise((resolve) => db.close(resolve));
    });

    it('"push" function provides a price update for permanent items', async () => {
        const db = createDatabase();

        await db.push([newPermanentItem]);
        await db.push([newPermanentItemUpdatedPrice]).then((updates) => {
            assert.isObject(updates);
            assert.deepEqual(updates.priceUpdates.length, 1);
            assert.deepEqual(updates.priceUpdates[0].item, newPermanentItemUpdatedPrice);
            assert.deepEqual(updates.priceUpdates[0].oldPrice, newPermanentItem.price);
            assert.deepEqual(updates.priceUpdates[0].newPrice, newPermanentItemUpdatedPrice.price);
            assert.deepEqual(updates.newOffers.length, 0);
        });

        await new Promise((resolve) => db.close(resolve));
    });

    it('"push" function handles multiple items at once', async () => {
        const db = createDatabase();

        await db.push([newOutletItem, newPermanentItem]).then((updates) => {
            assert.isObject(updates);
            assert.deepEqual(updates.priceUpdates.length, 0);
            assert.deepEqual(updates.newOffers.length, 2);
            assert.deepEqual(updates.newOffers[0], newOutletItem);
            assert.deepEqual(updates.newOffers[1], newPermanentItem);
        });

        await new Promise((resolve) => db.close(resolve));
    });
});