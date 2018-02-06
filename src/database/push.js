'use strict';

const Logger = require('../util/logger');

function getSqlDateTime() {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function addNewItem(promiseQuery, item, modelId, permanent) {
    const dateTime = getSqlDateTime();
    return promiseQuery(
               `INSERT INTO history (modelId, itemCondition, isPermanent, size, price, durationFrom, durationTo,` +
               `                     lastSellerId, lastUrl)\n` +
               `  VALUES(${modelId}, '${item.condition}', ${permanent}, '${item.size}', ${item.price}, ` +
               `         '${dateTime}', '${dateTime}', '${item.offerId}', '${item.url}');\n` +
               'SELECT LAST_INSERT_ID() AS id')
        .then((insertQueryResult) => {
            const historyId = insertQueryResult[1][0].id;
            Logger.log(`Added new history item id=${historyId}`);
            return promiseQuery(`INSERT INTO current (historyId) VALUES (${historyId})`).then(() => {
                Logger.log(`Added item to current`);
                return {item, isNew: true, newPrice: item.price};
            });
        });
}

function updateExistingOffer(promiseQuery, item, modelId, historyId) {
    const currentDateTime = getSqlDateTime();
    return promiseQuery(
               `SELECT price\n` +
               `FROM history\n` +
               `WHERE historyId=${historyId}`)
        .then((priceQueryResult) => priceQueryResult[0].price)
        .then((oldPrice) => {
            return promiseQuery(
                       `UPDATE history\n` +
                       `SET durationTo='${currentDateTime}', lastSellerId='${item.offerId}', lastUrl='${item.url}',` +
                       `    price=${item.price}\n` +
                       `WHERE historyId=${historyId}\n`)
                .then(() => {
                    Logger.log(`Updated item historyId=${historyId}`);
                    return {item, isNew: false, oldPrice: oldPrice, newPrice: item.price};
                });
        });
}

function pushItem(promiseQuery, item) {
    return promiseQuery(`SELECT modelId FROM models WHERE name='${item.name}' AND modelYear=${item.modelYear}`)
        .then((modelQueryResult) => {
            if (modelQueryResult.length) {
                return modelQueryResult[0].modelId;
            }

            Logger.log(`Adding new model ${item.name}`);
            return promiseQuery(`INSERT INTO models (name, modelYear) VALUES ('${item.name}', ${
                                    item.modelYear}); SELECT LAST_INSERT_ID() AS id`)
                .then((insertQueryResult) => {
                    return insertQueryResult[1][0].id;
                });
        })
        .then((modelId) => {
            const permanent = item.permanent == true ? 1 : 0;

            return promiseQuery(
                       `SELECT current.historyId\n` +
                       `FROM current\n` +
                       `INNER JOIN history ON current.historyId=history.historyId\n` +
                       `WHERE history.modelId=${modelId}\n` +
                       `  AND history.isPermanent=${permanent}\n` +
                       `  AND (history.isPermanent=1 OR history.price=${item.price})\n` +
                       `  AND history.itemCondition='${item.condition}'\n` +
                       `  AND history.size='${item.size}'`)
                .then((historyQueryResult) => {return ({historyQueryResult, modelId, permanent})});
        })
        .then(({historyQueryResult, modelId, permanent}) => {
            if (historyQueryResult.length) {
                const historyId = historyQueryResult[0].historyId;
                return updateExistingOffer(promiseQuery, item, modelId, historyId);
            }

            return addNewItem(promiseQuery, item, modelId, permanent);
        });
}

function push(promiseQuery, items) {
    return Promise
        .all(items.map((item) => {
            return pushItem(promiseQuery, item);
        }))
        .then((updates) => {
            const newOffers = [];
            const priceUpdates = [];

            updates.forEach((update) => {
                if (update.isNew) {
                    newOffers.push(update.item);
                }

                if (update.oldPrice && update.oldPrice != update.newPrice) {
                    priceUpdates.push(update);
                }
            });

            return {newOffers, priceUpdates};
        });
}

module.exports = push;