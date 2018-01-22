'use strict';

const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const HttpHelper = require('../../util/httpHelper');
const Logger = require('../../util/logger');

function queries() {
    const categories = ['triathlon', 'road'];
    const type = '&type=html';
    const baseUrl = 'https://www.canyon.com/en/factory-outlet/ajax/articles.html?category='

    const openQueries = [];
    categories.forEach((category) => {
        const url = baseUrl + category + type
        openQueries.push(HttpHelper.get(url, new XMLHttpRequest())
                             .catch(() => {
                                 Logger.error('Failed to query url=', url);
                             })
                             .then((result) => {
                                 Logger.log('Got data from remote url=', url);
                                 return result;
                             }));
    });
    return openQueries;
}

module.exports = queries;