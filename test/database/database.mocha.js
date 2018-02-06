'use strict';

const Database = require('../../src/database/database');
const assert = require('chai').assert;

describe('Database', () => {
    function createDatabase() {
        return Database('localhost', 'root', 'PinkiePie', 'test', true);
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

        const newItem = {
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

        await db.push([newItem]).then((updates) => {
            assert.isObject(updates);
            assert.deepEqual(updates.priceUpdates.length, 0);
            assert.deepEqual(updates.newOffers.length, 1);
            assert.deepEqual(updates.newOffers[0], newItem);
        });

        await new Promise((resolve) => db.close(resolve));
    });
});