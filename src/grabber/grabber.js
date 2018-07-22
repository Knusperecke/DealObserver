'use strict';

const CanyonFetcher = require('./canyon/fetcher');
const CanyonParser = require('./canyon/parser');
const DefaultDatabase = require('../database/database');
const DefaultNotifier = require('../notifier/notifier');
const DefaultUpdatePreprocessor = require('./canyon/updatePreprocessor');
const DefaultErrorNotifier = require('../notifier/errors');
const Logger = require('../util/logger');
const defaultConfig = require('../../config');
const localConfig = require('../../config.local') || {};

const inputArguments = require('minimist')(process.argv.slice(2));

function run(
    Database = DefaultDatabase, Fetcher = CanyonFetcher, Parser = CanyonParser, Notifier = DefaultNotifier,
    ErrorNotifier = DefaultErrorNotifier, UpdatePreprocessor = DefaultUpdatePreprocessor,
    config = Object.assign(defaultConfig, localConfig)) {
    const justSummary = inputArguments.summary || false;

    const db = Database(config.database.host, config.database.user, config.database.password, config.database.table);

    let grabbedItems = [];

    let currentItemIds = [];
    let newOffers = [];
    let priceUpdates = [];
    let soldOutItems = [];

    return Promise
        .all(Fetcher(config).map((query) => {
            return query.then(Parser).then((items) => {grabbedItems = grabbedItems.concat(items)});
        }))
        .then(() => db.push(grabbedItems))
        .then((updates) => {
            Logger.log(`Received updates for ${updates.offerIds.length} items, ${
                updates.newOffers.length} new offers, ${updates.priceUpdates.length} price updates`)
            currentItemIds = currentItemIds.concat(updates.offerIds);
            newOffers = newOffers.concat(updates.newOffers);
            priceUpdates = priceUpdates.concat(updates.priceUpdates);
        })
        .then(() => db.updateCurrent(currentItemIds))
        .then((soldOutItemsUpdate) => soldOutItems = soldOutItemsUpdate)
        .then(() => db.close())
        .then(
            () => Notifier(
                Object.assign(UpdatePreprocessor({newOffers, priceUpdates, soldOutItems}), {justSummary, config})))
        .catch((error) => ErrorNotifier(error, config))
        .catch((error) => Logger.error(error.message));
}

module.exports = run;