'use strict';

const Database = require('../../src/database/database');
const assert = require('chai').assert;
const localConfig = require('../../config.local');
const defaultConfig = require('../../config');

const newOutletItem = {
    name: 'MoxiSpeed CF 9.0 2017',
    id: 'moxispeed cf 9.0 2017',
    price: 2299,
    offerId: '000000000000111695',
    size: '|XL|',
    modelYear: '2017',
    permanent: false,
    url: 'someUrl',
    smallImgUrl: 'someOtherUrl',
    condition: 'new'
};

const newOutletItemIdenticalOnDbLayer = {
    name: 'MoxiSpeed CF 9.0 2017',
    id: 'moxispeed cf 9.0 2017',
    price: 2299,
    offerId: '000000000000666777',
    size: '|XL|',
    modelYear: '2017',
    permanent: false,
    url: 'someUrl2',
    smallImgUrl: 'someOtherUrl2',
    condition: 'new'
};

const newOutletItemDifferentSize = {
    name: 'MoxiSpeed CF 9.0 2017',
    id: 'moxispeed cf 9.0 2017',
    price: 2299,
    offerId: '000000000000111695',
    size: '|XS|',
    modelYear: '2017',
    permanent: false,
    url: 'someUrl',
    smallImgUrl: 'someOtherUrl',
    condition: 'new'
};

const newOutletItemDifferentCondition = {
    name: 'MoxiSpeed CF 9.0 2017',
    id: 'moxispeed cf 9.0 2017',
    price: 2299,
    offerId: '000000000000111695',
    size: '|XL|',
    modelYear: '2017',
    permanent: false,
    url: 'someUrl',
    smallImgUrl: 'someOtherUrl',
    condition: 'used'
};

const newOutletItemDifferentPrice = {
    name: 'MoxiSpeed CF 9.0 2017',
    id: 'moxispeed cf 9.0 2017',
    price: 1199,
    offerId: '000000000000111695',
    size: '|XL|',
    modelYear: '2017',
    permanent: false,
    url: 'someUrl',
    smallImgUrl: 'someOtherUrl',
    condition: 'new'
};

const newPermanentItem = {
    name: 'MoxiSpeed CF 9.0 2017',
    id: 'moxispeed cf 9.0 2017',
    price: 2299,
    offerId: '000000000000111695',
    size: '|XL|',
    modelYear: '2017',
    permanent: true,
    url: 'someUrl',
    smallImgUrl: 'someOtherUrl',
    condition: 'new'
};

const newPermanentItemUpdatedPrice = {
    name: 'MoxiSpeed CF 9.0 2017',
    id: 'moxispeed cf 9.0 2017',
    price: 1299,
    offerId: '000000000000111695',
    size: '|XL|',
    modelYear: '2017',
    permanent: true,
    url: 'someUrl',
    smallImgUrl: 'someOtherUrl',
    condition: 'new'
};

describe('Database', () => {
    function createDatabase(dropTables = true) {
        // Uses real database for tests, so we consume actual configuration
        const config = Object.assign(defaultConfig, localConfig);
        return Database(
            config.database.host, config.database.user, config.database.password, config.database.testTable,
            dropTables);
    }

    describe('Basic behaviour', () => {
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
    });

    describe('Queries', () => {
        it('query supports a simple query', async () => {
            const db = createDatabase();

            await db.query('SELECT 1 + 1 AS solution').then((results) => {
                assert.deepEqual(results[0].solution, 2);
            });

            await new Promise((resolve) => db.close(resolve));
        });
    });

    describe('Table structure', () => {
        it('Does not drops tables per default', async () => {
            let db = createDatabase();
            await db.query('INSERT INTO current (historyId) VALUES (7)');
            await new Promise((resolve) => db.close(resolve));

            db = createDatabase(false);
            await db.query('SELECT historyId FROM current').then((results) => {
                assert.deepEqual(results[0].historyId, 7);
            });
            await new Promise((resolve) => db.close(resolve));
        });

        ['models', 'current', 'history'].forEach((name) => {
            it(`Database has a table named ${name}`, async () => {
                const db = createDatabase();

                await db.query(`SELECT * FROM ${name}`).then(() => {
                    assert.ok(true);
                });

                await new Promise((resolve) => db.close(resolve));
            });
        });
    });

    describe('Push items', () => {
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
                assert.deepEqual(updates.offerIds.length, 0);
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
                assert.deepEqual(updates.offerIds.length, 1);
            });

            await new Promise((resolve) => db.close(resolve));
        });

        it('"push" function detects known items', async () => {
            const db = createDatabase();

            await db.push([newOutletItem]).then(async (updates) => {
                await db.updateCurrent(updates.offerIds);
            });
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

        it('"push" function DOES NOT discern condition of items (Parsing for condition not stable)', async () => {
            const db = createDatabase();

            await db.push([newOutletItem]).then(async (updates) => {
                await db.updateCurrent(updates.offerIds);
            });
            await db.push([newOutletItemDifferentCondition]).then((updates) => {
                assert.isObject(updates);
                assert.deepEqual(updates.priceUpdates.length, 0);
                assert.deepEqual(updates.newOffers.length, 0);
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

            await db.push([newPermanentItem]).then(async (updates) => {
                await db.updateCurrent(updates.offerIds);
            });
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
                assert.deepEqual(updates.offerIds.length, 2);
            });

            await new Promise((resolve) => db.close(resolve));
        });

        it('"push" function updates all current items if one item matches multiple similar ones (tradeoff if we cannot discern them))',
           async () => {
               const db = createDatabase();

               await db.push([newOutletItem, newOutletItemIdenticalOnDbLayer]).then(async (updates) => {
                   assert.isObject(updates);
                   assert.deepEqual(updates.priceUpdates.length, 0);
                   assert.deepEqual(updates.newOffers.length, 2);
                   assert.deepEqual(updates.newOffers[0], newOutletItem);
                   assert.deepEqual(updates.newOffers[1], newOutletItemIdenticalOnDbLayer);
                   assert.deepEqual(updates.offerIds.length, 2);

                   await db.updateCurrent(updates.offerIds);
               });

               await db.push([newOutletItem, newOutletItemIdenticalOnDbLayer]).then(async (updates) => {
                   assert.isObject(updates);
                   assert.deepEqual(updates.priceUpdates.length, 0);
                   assert.deepEqual(updates.newOffers.length, 0);
                   assert.deepEqual(updates.offerIds.length, 2);

                   await db.updateCurrent(updates.offerIds);
               });

               await new Promise((resolve) => db.close(resolve));
           });
        
    });

    describe('Update current items', () => {
        it('"updateCurrent" with empty array must empty the "current" table', async () => {
            const db = createDatabase();

            await db.updateCurrent([]).then(async () => {
                await db.query('SELECT COUNT(historyId) AS count FROM current').then((results) => {
                    assert.deepEqual(results[0].count, 0);
                });
            });

            await new Promise((resolve) => db.close(resolve));
        });

        it('"updateCurrent" must return an empty array if no items disappeared', async () => {
            const db = createDatabase();

            await db.updateCurrent([]).then((oldItems) => {
                assert.deepEqual(oldItems.length, 0);
            });

            await new Promise((resolve) => db.close(resolve));
        });

        it('"updateCurrent" must handle offerIds returned by "push"', async () => {
            const db = createDatabase();

            await db.push([newOutletItem, newPermanentItem])
                .then((updates) => db.updateCurrent(updates.offerIds))
                .then(async () => {
                    await db.query('SELECT COUNT(historyId) AS count FROM current').then((results) => {
                        assert.deepEqual(results[0].count, 2);
                    });
                });

            await new Promise((resolve) => db.close(resolve));
        });

        it('"updateCurrent" must return a pushed outlet item when it is not in current anymore', async () => {
            const db = createDatabase();

            await db.push([newOutletItem])
                .then((updates) => db.updateCurrent(updates.offerIds))
                .then(() => db.updateCurrent([]))
                .then((disappearedItems) => {
                    assert.deepEqual(disappearedItems.length, 1);
                    assert.deepEqual(disappearedItems[0], newOutletItem);
                });

            await new Promise((resolve) => db.close(resolve));
        });

        it('"updateCurrent" must return a pushed permanent item when it is not in current anymore', async () => {
            const db = createDatabase();

            await db.push([newPermanentItem])
                .then((updates) => db.updateCurrent(updates.offerIds))
                .then(() => db.updateCurrent([]))
                .then((disappearedItems) => {
                    assert.deepEqual(disappearedItems.length, 1);
                    assert.deepEqual(disappearedItems[0], newPermanentItem);
                });

            await new Promise((resolve) => db.close(resolve));
        });

        it('"updateCurrent" must return multiple pushed items when they are not in current anymore', async () => {
            const db = createDatabase();

            await db.push([newOutletItem, newPermanentItem])
                .then((updates) => db.updateCurrent(updates.offerIds))
                .then(() => db.updateCurrent([]))
                .then((disappearedItems) => {
                    assert.deepEqual(disappearedItems.length, 2);
                    assert.deepEqual(disappearedItems[0], newOutletItem);
                    assert.deepEqual(disappearedItems[1], newPermanentItem);
                });

            await new Promise((resolve) => db.close(resolve));
        });

        it('"updateCurrent" must return the right item if some items went away', async () => {
            const db = createDatabase();

            await db.push([newOutletItem, newPermanentItem])
                .then(async (updates) => {
                    await db.updateCurrent(updates.offerIds);
                    return updates;
                })
                .then((updates) => db.updateCurrent([updates.offerIds[0]]))
                .then((disappearedItems) => {
                    assert.deepEqual(disappearedItems.length, 1);
                    assert.deepEqual(disappearedItems[0], newPermanentItem);
                });

            await new Promise((resolve) => db.close(resolve));
        });

        it('"updateCurrent" must return the right item if some items went away (alternative version)', async () => {
            const db = createDatabase();

            await db.push([newOutletItem, newPermanentItem])
                .then(async (updates) => {
                    await db.updateCurrent(updates.offerIds);
                    return updates;
                })
                .then((updates) => db.updateCurrent([updates.offerIds[1]]))
                .then((disappearedItems) => {
                    assert.deepEqual(disappearedItems.length, 1);
                    assert.deepEqual(disappearedItems[0], newOutletItem);
                });

            await new Promise((resolve) => db.close(resolve));
        });
    });
});