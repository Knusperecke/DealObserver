'use strict';

const Logger = require('../util/logger');

function query(connection, queryBody) {
    return new Promise((resolve) => {
        connection.query(queryBody, function(error, results) {
            if (error) {
                throw new Error(`Failed in query="${queryBody}" with error="${error}"`);
            }
            Logger.log('Query successful');
            resolve(results);
        });
    });
}

module.exports = query;