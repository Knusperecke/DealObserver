'use strict';

const Logger = require('../util/logger');

function query (connection, query, callback) {
    connection.query(query, function(error, results) {
        if (error) {
            throw new Error(`Failed in query="${query}" with error="${error}"`);
        }
        Logger.log('Query successful');

        if(callback)
        {
            callback(results);
        }
    });
}

module.exports = query;