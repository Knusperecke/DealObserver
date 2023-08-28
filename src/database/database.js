'use strict';

const MySql = require('mysql2');
const EnsureDatabaseSetup = require('./setup');
const Query = require('./query');
const Push = require('./push');
const UpdateCurrent = require('./updateCurrent');
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

function connect(host, user, password, databaseName, dropTables = false) {
    const connection = MySql.createConnection(
        { host: host, user: user, password: password, database: databaseName, multipleStatements: true });
    connection.connect((error) => {
        if (error) {
            throw new Error('Failed in database connection: ' + error);
        }

        Logger.log('Connected to databse');
    });

    const db = {
        query: Query.bind(this, connection),
        close: close.bind(this, connection),
    };

    db.push = Push.bind(this, db.query);
    db.updateCurrent = UpdateCurrent.bind(this, db.query);

    EnsureDatabaseSetup(db.query, dropTables);

    return db;
}

module.exports = connect;