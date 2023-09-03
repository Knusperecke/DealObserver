import { assert } from 'chai';
import { defaultConfig } from '../../src/config.js';
import { configOverride } from '../../src/config.local.js';
import { DatabaseInterface, connectDatabase } from '../../src/database/database.js';
import { Config, Item } from '../../src/types.js';

const newOutletItem: Item = {
    name: 'MoxiSpeed CF 9.0 2017',
    id: 'moxispeed cf 9.0 2017',
    price: 2299,
    offerId: '000000000000111695',
    size: '|XL|',
    modelYear: '2017',
    permanent: false,
    url: 'someUrl',
    smallImgUrl: 'someOtherUrl',
    condition: 'new',
};

const newOutletItemIdenticalOnDbLayer: Item = {
    name: 'MoxiSpeed CF 9.0 2017',
    id: 'moxispeed cf 9.0 2017',
    price: 2299,
    offerId: '000000000000666777',
    size: '|XL|',
    modelYear: '2017',
    permanent: false,
    url: 'someUrl2',
    smallImgUrl: 'someOtherUrl2',
    condition: 'new',
};

const newOutletItemDifferentSize: Item = {
    name: 'MoxiSpeed CF 9.0 2017',
    id: 'moxispeed cf 9.0 2017',
    price: 2299,
    offerId: '000000000000111695',
    size: '|XS|',
    modelYear: '2017',
    permanent: false,
    url: 'someUrl',
    smallImgUrl: 'someOtherUrl',
    condition: 'new',
};

const newOutletItemDifferentCondition: Item = {
    name: 'MoxiSpeed CF 9.0 2017',
    id: 'moxispeed cf 9.0 2017',
    price: 2299,
    offerId: '000000000000111695',
    size: '|XL|',
    modelYear: '2017',
    permanent: false,
    url: 'someUrl',
    smallImgUrl: 'someOtherUrl',
    condition: 'used',
};

const newOutletItemDifferentPrice: Item = {
    name: 'MoxiSpeed CF 9.0 2017',
    id: 'moxispeed cf 9.0 2017',
    price: 1199,
    offerId: '000000000000111695',
    size: '|XL|',
    modelYear: '2017',
    permanent: false,
    url: 'someUrl',
    smallImgUrl: 'someOtherUrl',
    condition: 'new',
};

const newPermanentItem: Item = {
    name: 'MoxiSpeed CF 9.0 2017',
    id: 'moxispeed cf 9.0 2017',
    price: 2299,
    offerId: '000000000000111695',
    size: '|XL|',
    modelYear: '2017',
    permanent: true,
    url: 'someUrl',
    smallImgUrl: 'someOtherUrl',
    condition: 'new',
};

const newPermanentItemUpdatedPrice: Item = {
    name: 'MoxiSpeed CF 9.0 2017',
    id: 'moxispeed cf 9.0 2017',
    price: 1299,
    offerId: '000000000000111695',
    size: '|XL|',
    modelYear: '2017',
    permanent: true,
    url: 'someUrl',
    smallImgUrl: 'someOtherUrl',
    condition: 'new',
};

describe('Database', () => {
    function createDatabase(dropTables = true): Promise<DatabaseInterface> {
        // Uses real database for tests, so we consume actual configuration
        const config = { ...defaultConfig, ...configOverride } as Config;
        return connectDatabase(
            config.database.host,
            config.database.user,
            config.database.password,
            config.database.testTable,
            dropTables,
        );
    }

    describe('Basic behaviour', () => {
        it('can close a newly created connection', async () => {
            const db = await createDatabase();
            await db.close();
        });

        it('returns a DatabaseInterface object', async () => {
            const db = await createDatabase();
            assert.isObject(db);
            await db.close();
        });

        it('returns an object with a "query" function', async () => {
            const db = await createDatabase();
            assert.isFunction(db.query);
            db.close();
        });

        it('returns an object with a "close" function', async () => {
            const db = await createDatabase();
            assert.isFunction(db.close);
            db.close();
        });
    });

    describe('Queries', () => {
        it('query supports a simple query', async () => {
            const db = await createDatabase();

            const queryResult = (await db.query('SELECT 1 + 1 AS solution')) as {
                solution: number;
            }[];

            assert.deepEqual(queryResult[0].solution, 2);

            await db.close();
        });
    });

    describe('Table structure', () => {
        it('does not drop tables per default', async () => {
            let db = await createDatabase();
            await db.query('INSERT INTO current (historyId) VALUES (7)');
            await db.close();

            db = await createDatabase(false);
            const queryResult = (await db.query('SELECT historyId FROM current')) as {
                historyId: number;
            }[];
            assert.deepEqual(queryResult[0].historyId, 7);

            await db.close();
        });

        ['items', 'current', 'history'].forEach((name) => {
            it(`database has a table named ${name}`, async () => {
                const db = await createDatabase();
                await db.query(`SELECT * FROM ${name}`);
                await db.close();
            });
        });
    });

    describe('Push items', () => {
        it('returns an object with a "push" function', async () => {
            const db = await createDatabase();
            assert.isFunction(db.push);
            await db.close();
        });

        it('"push" function accepts an empty array', async () => {
            const db = await createDatabase();
            await db.push([]);
            await db.close();
        });

        it('"push" function returns a promise that provides an object', async () => {
            const db = await createDatabase();
            const pushResult = await db.push([]);

            assert.isObject(pushResult);
            assert.deepEqual(pushResult.priceUpdates.length, 0);
            assert.deepEqual(pushResult.newOffers.length, 0);
            assert.deepEqual(pushResult.offerIds.length, 0);
            await db.close();
        });

        it('"push" function handles a new item', async () => {
            const db = await createDatabase();

            const pushResult = await db.push([newOutletItem]);
            assert.isObject(pushResult);
            assert.deepEqual(pushResult.priceUpdates.length, 0);
            assert.deepEqual(pushResult.newOffers.length, 1);
            assert.deepEqual(pushResult.newOffers[0], newOutletItem);
            assert.deepEqual(pushResult.offerIds.length, 1);

            await db.close();
        });

        it('"push" function detects known items', async () => {
            const db = await createDatabase();

            const pushResult = await db.push([newOutletItem]);
            await db.updateCurrent(pushResult.offerIds);

            const secondPushResult = await db.push([newOutletItem]);
            assert.isObject(secondPushResult);
            assert.deepEqual(secondPushResult.priceUpdates.length, 0);
            assert.deepEqual(secondPushResult.newOffers.length, 0);

            await db.close();
        });

        it('"push" function discerns size of items', async () => {
            const db = await createDatabase();

            await db.push([newOutletItem]);
            const pushResult = await db.push([newOutletItemDifferentSize]);
            assert.isObject(pushResult);
            assert.deepEqual(pushResult.priceUpdates.length, 0);
            assert.deepEqual(pushResult.newOffers.length, 1);
            assert.deepEqual(pushResult.newOffers[0], newOutletItemDifferentSize);

            await db.close();
        });

        it('"push" function DOES NOT discern condition of items (Parsing for condition not stable)', async () => {
            const db = await createDatabase();

            const initialPushResult = await db.push([newOutletItem]);
            await db.updateCurrent(initialPushResult.offerIds);

            const secondPushResult = await db.push([newOutletItemDifferentCondition]);
            assert.isObject(secondPushResult);
            assert.deepEqual(secondPushResult.priceUpdates.length, 0);
            assert.deepEqual(secondPushResult.newOffers.length, 0);

            await db.close();
        });

        it('"push" function discerns price of items', async () => {
            const db = await createDatabase();

            await db.push([newOutletItem]);
            const pushResult = await db.push([newOutletItemDifferentPrice]);
            assert.isObject(pushResult);
            assert.deepEqual(pushResult.priceUpdates.length, 0);
            assert.deepEqual(pushResult.newOffers.length, 1);
            assert.deepEqual(pushResult.newOffers[0], newOutletItemDifferentPrice);

            await db.close();
        });

        it('"push" function discerns outlet items from permanent items', async () => {
            const db = await createDatabase();

            await db.push([newOutletItem]);
            const pushResult = await db.push([newPermanentItem]);
            assert.isObject(pushResult);
            assert.deepEqual(pushResult.priceUpdates.length, 0);
            assert.deepEqual(pushResult.newOffers.length, 1);
            assert.deepEqual(pushResult.newOffers[0], newPermanentItem);

            await db.close();
        });

        it('"push" function provides a price update for permanent items', async () => {
            const db = await createDatabase();

            const initialPushResult = await db.push([newPermanentItem]);
            await db.updateCurrent(initialPushResult.offerIds);

            const secondPushResult = await db.push([newPermanentItemUpdatedPrice]);
            assert.isObject(secondPushResult);
            assert.deepEqual(secondPushResult.priceUpdates.length, 1);
            assert.deepEqual(secondPushResult.priceUpdates[0].item, newPermanentItemUpdatedPrice);
            assert.deepEqual(secondPushResult.priceUpdates[0].oldPrice, newPermanentItem.price);
            assert.deepEqual(
                secondPushResult.priceUpdates[0].newPrice,
                newPermanentItemUpdatedPrice.price,
            );
            assert.deepEqual(secondPushResult.newOffers.length, 0);

            await db.close();
        });

        it('"push" function handles multiple items at once', async () => {
            const db = await createDatabase();

            const pushResult = await db.push([newOutletItem, newPermanentItem]);
            assert.isObject(pushResult);
            assert.deepEqual(pushResult.priceUpdates.length, 0);
            assert.deepEqual(pushResult.newOffers.length, 2);
            assert.deepEqual(pushResult.newOffers[0], newOutletItem);
            assert.deepEqual(pushResult.newOffers[1], newPermanentItem);
            assert.deepEqual(pushResult.offerIds.length, 2);

            await db.close();
        });

        it('"push" function updates all current items if one item matches multiple similar ones (tradeoff if we cannot discern them))', async () => {
            const db = await createDatabase();

            const pushResult = await db.push([newOutletItem, newOutletItemIdenticalOnDbLayer]);
            assert.isObject(pushResult);
            assert.deepEqual(pushResult.priceUpdates.length, 0);
            assert.deepEqual(pushResult.newOffers.length, 2);
            assert.deepEqual(pushResult.newOffers[0], newOutletItem);
            assert.deepEqual(pushResult.newOffers[1], newOutletItemIdenticalOnDbLayer);
            assert.deepEqual(pushResult.offerIds.length, 2);

            await db.updateCurrent(pushResult.offerIds);

            const secondPushResult = await db.push([
                newOutletItem,
                newOutletItemIdenticalOnDbLayer,
            ]);
            assert.isObject(secondPushResult);
            assert.deepEqual(secondPushResult.priceUpdates.length, 0);
            assert.deepEqual(secondPushResult.newOffers.length, 0);
            assert.deepEqual(secondPushResult.offerIds.length, 2);

            await db.updateCurrent(secondPushResult.offerIds);

            await db.close();
        });
    });

    describe('Update current items', () => {
        it('"updateCurrent" with empty array must empty the "current" table', async () => {
            const db = await createDatabase();

            await db.updateCurrent([]);
            const queryResult = (await db.query(
                'SELECT COUNT(historyId) AS count FROM current',
            )) as {
                count: number;
            }[];

            assert.deepEqual(queryResult[0].count, 0);

            await db.close();
        });

        it('"updateCurrent" must return an empty array if no items disappeared', async () => {
            const db = await createDatabase();

            const updateCurrentResult = await db.updateCurrent([]);
            assert.deepEqual(updateCurrentResult.length, 0);

            await db.close();
        });

        it('"updateCurrent" must handle offerIds returned by "push"', async () => {
            const db = await createDatabase();

            const pushResult = await db.push([newOutletItem, newPermanentItem]);
            await db.updateCurrent(pushResult.offerIds);

            const queryResult = (await db.query(
                'SELECT COUNT(historyId) AS count FROM current',
            )) as {
                count: number;
            }[];
            assert.deepEqual(queryResult[0].count, 2);

            await db.close();
        });

        it('"updateCurrent" must return a pushed outlet item when it is not in current anymore', async () => {
            const db = await createDatabase();

            const pushResult = await db.push([newOutletItem]);
            await db.updateCurrent(pushResult.offerIds);
            const itemsThatDisappearedAfterSecondUpdateCurrent = await db.updateCurrent([]);

            assert.deepEqual(itemsThatDisappearedAfterSecondUpdateCurrent.length, 1);
            assert.deepEqual(itemsThatDisappearedAfterSecondUpdateCurrent[0], newOutletItem);

            await db.close();
        });

        it('"updateCurrent" must return a pushed permanent item when it is not in current anymore', async () => {
            const db = await createDatabase();

            const pushResult = await db.push([newPermanentItem]);
            await db.updateCurrent(pushResult.offerIds);
            const itemsThatDisappearedAfterSecondUpdateCurrent = await db.updateCurrent([]);
            assert.deepEqual(itemsThatDisappearedAfterSecondUpdateCurrent.length, 1);
            assert.deepEqual(itemsThatDisappearedAfterSecondUpdateCurrent[0], newPermanentItem);

            await db.close();
        });

        it('"updateCurrent" must return multiple pushed items when they are not in current anymore', async () => {
            const db = await createDatabase();

            const pushResult = await db.push([newOutletItem, newPermanentItem]);
            await db.updateCurrent(pushResult.offerIds);
            const itemsThatDisappearedAfterSecondUpdateCurrent = await db.updateCurrent([]);
            assert.deepEqual(itemsThatDisappearedAfterSecondUpdateCurrent.length, 2);
            assert.deepEqual(itemsThatDisappearedAfterSecondUpdateCurrent[0], newOutletItem);
            assert.deepEqual(itemsThatDisappearedAfterSecondUpdateCurrent[1], newPermanentItem);

            await db.close();
        });

        it('"updateCurrent" must return the right item if some items went away', async () => {
            const db = await createDatabase();

            const pushResult = await db.push([newOutletItem, newPermanentItem]);

            await db.updateCurrent(pushResult.offerIds);
            const itemsThatDisappearedAfterSecondUpdateCurrent = await db.updateCurrent([
                pushResult.offerIds[0],
            ]);
            assert.deepEqual(itemsThatDisappearedAfterSecondUpdateCurrent.length, 1);
            assert.deepEqual(itemsThatDisappearedAfterSecondUpdateCurrent[0], newPermanentItem);

            await db.close();
        });

        it('"updateCurrent" must return the right item if some items went away (alternative version)', async () => {
            const db = await createDatabase();

            const pushResult = await db.push([newOutletItem, newPermanentItem]);
            await db.updateCurrent(pushResult.offerIds);
            const itemsThatDisappearedAfterSecondUpdateCurrent = await db.updateCurrent([
                pushResult.offerIds[1],
            ]);
            assert.deepEqual(itemsThatDisappearedAfterSecondUpdateCurrent.length, 1);
            assert.deepEqual(itemsThatDisappearedAfterSecondUpdateCurrent[0], newOutletItem);

            await db.close();
        });
    });
});
