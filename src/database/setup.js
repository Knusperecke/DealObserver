'use strict';

const Logger = require('../util/logger');

function setup (db) {
    db.query(
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
        ')'
    );

    Logger.log('Ensured database setup')
}

module.exports = setup;