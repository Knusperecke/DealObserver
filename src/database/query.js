'use strict';

const Logger = require('../util/logger');

function query(connection, queryBody, callback) {
    connection.query(queryBody, function(error, results) {
        if (error) {
            throw new Error(`Failed in query="${queryBody}" with error="${error}"`);
        }
        Logger.log('Query successful');

        if (callback) {
            callback(results);
        }
    });
}

function promiseQuery(connection, queryBody) {
    return new Promise((resolve) => {
        query(connection, queryBody, resolve);
    });
}

module.exports = {
    query,
    promiseQuery
};