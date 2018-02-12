'use strict';

const CanyonFetcher = require('./canyon/fetcher');
const CanyonParser = require('./canyon/parser');
const DefaultDatabase = require('../database/database');
const DefaultNotifier = require('../notifier/notifier');
const DefaultErrorNotifier = require('../notifier/errors');
const Logger = require('../util/logger');
const config = require('../../config');

const inputArguments = require('minimist')(process.argv.slice(2));

function run(
    Database = DefaultDatabase, Fetcher = CanyonFetcher, Parser = CanyonParser, Notifier = DefaultNotifier,
    ErrorNotifier = DefaultErrorNotifier) {
    const justSummary = inputArguments.summary || false;

    const db = Database(config.database.host, config.database.user, config.database.password, config.database.table);
    let currentItemIds = [];
    let newItems = [];
    let priceUpdates = [];
    let soldOutItems = [];

    return Promise
        .all(Fetcher().map((query) => {
            return query.then(Parser).then((items) => db.push(items)).then((updates) => {
                Logger.log(`Received updates for ${updates.offerIds.length} items, ${
                    updates.newOffers.length} new offers, ${updates.priceUpdates.length} price updates`)
                currentItemIds = currentItemIds.concat(updates.offerIds);
                newItems = newItems.concat(updates.newOffers);
                priceUpdates = priceUpdates.concat(updates.priceUpdates);
            });
        }))
        .then(() => db.updateCurrent(currentItemIds))
        .then((soldOutItemsUpdate) => soldOutItems = soldOutItemsUpdate)
        .then(() => db.close())
        .then(() => Notifier({justSummary, newItems, priceUpdates, soldOutItems}))
        .catch((error) => ErrorNotifier(error))
        .catch((error) => Logger.error(error.message));
}

module.exports = run;