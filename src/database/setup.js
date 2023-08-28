'use strict';

const Logger = require('../util/logger');

async function dropTables(query) {
  ['models', 'current', 'history'].forEach((name) => {
    query(`DROP TABLE ${name}`);
  });
}

function setup(query, wantsDropTables) {
  if (wantsDropTables) {
    dropTables(query);
  }

  query(
    'CREATE TABLE IF NOT EXISTS models (' +
      'modelId INT NOT NULL AUTO_INCREMENT,' +
      'nameId VARCHAR(255) NOT NULL,' +
      'name VARCHAR(255) NOT NULL,' +
      'modelYear INT,' +
      'UNIQUE (modelId)' +
      ')',
  );

  query(
    'CREATE TABLE IF NOT EXISTS current (' + 'historyId INT NOT NULL' + ')',
  );

  query(
    'CREATE TABLE IF NOT EXISTS history (\n' +
      'historyId INT NOT NULL AUTO_INCREMENT,\n' +
      'modelId INT NOT NULL,\n' +
      'itemCondition VARCHAR(255),\n' +
      'isPermanent TINYINT,\n' +
      'size VARCHAR(64) NOT NULL,\n' +
      'price DOUBLE,\n' +
      'durationFrom DATETIME,\n' +
      'durationTo DATETIME,\n' +
      'lastSellerId VARCHAR(255) NOT NULL,\n' +
      'lastUrl VARCHAR(255),\n' +
      'lastSmallImgUrl VARCHAR(255),\n' +
      'UNIQUE (historyId)\n' +
      ')',
  ).then(() => Logger.log('Ensured database setup'));
}

module.exports = setup;
