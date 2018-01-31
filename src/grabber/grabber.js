'use strict';

const CanyonFetcher = require('./canyon/fetcher');
const CanyonParser = require('./canyon/parser');
const Logger = require('../util/logger');
const MySql = require('mysql');

function run() {
    const connection =
        MySql.createConnection({host: 'localhost', user: 'root', password: 'PinkiePie', database: 'canyon'});
    connection.connect((error) => {
        if (error) {
            throw new Error('Failed in database connection: ' + error);
        }

        Logger.log('Connected to databse');
    });
    connection.query('SELECT 1 + 1 AS solution', function(error, results) {
        if (error) {
            throw new Error('Failed in query: ' + error);
        }
        Logger.log('The solution is: ', results[0].solution);
    });
    connection.query(
        'CREATE TABLE IF NOT EXISTS Items (' +
            'ID INT NOT NULL,' +
            'name VARCHAR(255) NOT NULL,' +
            'price DOUBLE,' +
            'offerId VARCHAR(255) NOT NULL,' +
            'size VARCHAR(64) NOT NULL,' +
            'modelYear INT,' +
            'isPermanent TINYINT,' +
            'foundTime DATETIME,' +
            'lostTime DATETIME,' +
            'foundCount INT' +
            ')',
        (error) => {
            if (error) {
                throw new Error('Failed in query: ' + error);
            }
        });
    connection.end((error) => {
        if (error) {
            throw new Error('Failed to close database connection: ' + error);
        }
    });

    CanyonFetcher().forEach((query) => {
        query.then(CanyonParser).then((items) => {
            Logger.log(items);
        });
    });
}

run();