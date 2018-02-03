'use strict';

const CanyonFetcher = require('./canyon/fetcher');
const CanyonParser = require('./canyon/parser');
const DefaultDatabase = require('../database/database');
const Logger = require('../util/logger');

function run(Database = DefaultDatabase, Fetcher = CanyonFetcher, Parser = CanyonParser) {
    const db = Database('localhost', 'root', 'PinkiePie', 'canyon');

    return Promise
        .all(Fetcher().map((query) => {
            return query.then(Parser).then((items) => {
                Logger.log(items);
            });
        }))
        .then(() => db.close());
}

module.exports = run;