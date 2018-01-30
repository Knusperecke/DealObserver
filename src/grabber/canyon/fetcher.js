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
    const baseUrl = 'https://www.canyon.com/en/';
    const subUrls = [
        'road/aeroad/', 'road/ultimate/evo/', 'road/ultimate/cf-slx/', 'road/ultimate/cf-sl/', 'road/ultimate/al-slx/',
        'road/endurace/cf-slx/', 'road/endurace/cf-sl/', 'road/endurace/cf/', 'road/endurace/al/', 'road/inflite/',
        'triathlon/speedmax/cf-slx/', 'triathlon/speedmax/cf/'
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