'use strict';

const CanyonFetcher = require('./canyon/fetcher');
const CanyonParser = require('./canyon/parser');
const Logger = require('../util/logger');

function run() {
    CanyonFetcher().forEach((query) => {
        query.then(CanyonParser).then((items) => {
            Logger.log(items);
        });
    });
}

run();