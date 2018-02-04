'use strict';

const MySql = require('mysql');
const EnsureDatabaseSetup = require('./setup');
const Query = require('./query');
const Push = require('./push');
const Logger = require('../util/logger');

function close(connection, callback) {
    connection.end((error) => {
        if (error) {
            throw new Error(`Failed to close database connection error="${error}"`);
        }

        Logger.log('Closed database');
        if (callback) {
            callback();
        }
    });
}

function connect(host, user, password, databaseName) {
    const connection = MySql.createConnection({host: host, user: user, password: password, database: databaseName});
    connection.connect((error) => {
        if (error) {
            throw new Error('Failed in database connection: ' + error);
        }

        Logger.log('Connected to databse');
    });

    const db = {
        query: Query.bind(this, connection),
        close: close.bind(this, connection),
        push: Push.bind(this, connection)
    };

    EnsureDatabaseSetup(db);

    return db;
}

module.exports = connect;