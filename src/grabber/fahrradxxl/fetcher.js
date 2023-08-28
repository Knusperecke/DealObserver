'use strict';

const XMLHttpRequestImpl = require('xmlhttprequest').XMLHttpRequest;
const HttpHelper = require('../../util/httpHelper');
const Logger = require('../../util/logger');

function attachQueryHandler(query, url) {
  return query
    .catch(() => {
      Logger.error('Failed to query url=', url);
    })
    .then((result) => {
      Logger.log('Got data from remote url=', url);
      return result;
    });
}

function watchedItems(config, HttpGet) {
  const baseUrl = config.fahrradxxl.baseUrl;
  const subUrls = config.fahrradxxl.itemsToWatch;

  const openQueries = [];
  subUrls.forEach((sub) => {
    const url = baseUrl + '/' + sub;
    openQueries.push(
      attachQueryHandler(HttpGet(url, new XMLHttpRequestImpl()), url),
    );
  });
  return openQueries;
}

function queries(config, HttpGet = HttpHelper.get) {
  return watchedItems(config, HttpGet);
}

module.exports = queries;
