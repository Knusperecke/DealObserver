'use strict';

const Logger = require('../util/logger');

function setup(db) {
    db.query(
        'CREATE TABLE IF NOT EXISTS models (' +
        'modelId INT NOT NULL,' +
        'name VARCHAR(255) NOT NULL,' +
        'modelYear INT,' +
        'UNIQUE (modelId)' +
        ')');

    db.query(
        'CREATE TABLE IF NOT EXISTS current (' +
        'historyId INT NOT NULL' +
        ')');

    db.query(
        'CREATE TABLE IF NOT EXISTS history (\n' +
            'historyId INT NOT NULL,\n' +
            'modelId INT NOT NULL,\n' +
            'itemCondition VARCHAR(255),\n' +
            'isPermanent TINYINT,\n' +
            'size VARCHAR(64) NOT NULL,\n' +
            'price DOUBLE,\n' +
            'durationFrom DATETIME,\n' +
            'durationTo DATETIME,\n' +
            'lastSellerId VARCHAR(255) NOT NULL,\n' +
            'lastUrl VARCHAR(255),\n' +
            'UNIQUE (historyId)\n' +
            ')',
        () => Logger.log('Ensured database setup'));
}

module.exports = setup;