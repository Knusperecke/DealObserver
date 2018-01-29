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

function outlet(HttpGet) {
    const categories = ['triathlon', 'road'];
    const type = '&type=html';
    const baseUrl = 'https://www.canyon.com/en/factory-outlet/ajax/articles.html?category=';

    const openQueries = [];
    categories.forEach((category) => {
        const url = baseUrl + category + type;
        openQueries.push(attachQueryHandler(HttpGet(url, new XMLHttpRequestImpl()), url).then((data) => {
            return {type: 'outlet', data: data};
        }));
    });
    return openQueries;
}

function normalOffers(HttpGet) {
    const baseUrl = 'https://www.canyon.com/en/road/';
    const subUrls = [
        'aeroad/', 'ultimate/evo/', 'ultimate/cf-slx/', 'ultimate/cf-sl/', 'ultimate/al-slx/', 'endurace/cf-slx/',
        'endurace/cf-sl/', 'endurace/cf/', 'endurace/al/', 'inflite/'
    ];
    const openQueries = [];

    subUrls.forEach((sub) => {
        const url = baseUrl + sub
        openQueries.push(attachQueryHandler(HttpGet(url, new XMLHttpRequestImpl()), url).then((data) => {
            return {type: 'normalOffer', data: data};
        }));
    });
    return openQueries;
}

function queries(HttpGet = HttpHelper.get) {
    return outlet(HttpGet).concat(normalOffers(HttpGet));
}

module.exports = queries;