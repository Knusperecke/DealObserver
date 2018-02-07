'use strict';

const XMLHttpRequestImpl = require('xmlhttprequest').XMLHttpRequest;
const HttpHelper = require('../util/httpHelper');
const config = require('../../config');

function postNewsEntry(numNewOffers, numPriceUpdates, HttpPost) {
    if (numNewOffers === 0 && numPriceUpdates === 0) {
        return Promise.resolve();
    }

    let text = '*Update:* ';

    if (numNewOffers > 0) {
        text = text + `*${numNewOffers}* new offer`;
        if (numNewOffers > 1) {
            text = text + `s `;
        } else {
            text = text + ` `;
        }
    }

    if (numNewOffers > 0 && numPriceUpdates > 0) {
        text = text + 'and ';
    }

    if (numPriceUpdates > 0) {
        text = text + `*${numPriceUpdates}* updated price`;
        if (numPriceUpdates > 1) {
            text = text + `s`;
        }
    }

    return HttpPost(
        config.slack.newsWebHook, JSON.stringify({
            channel: config.slack.newsChannelName,
            username: config.slack.notifierUserName,
            text: text.trim(),
            icon_emoji: config.slack.notifierEmoji
        }),
        new XMLHttpRequestImpl());
}

function notify(newOffers, priceUpdates, HttpPost = HttpHelper.post) {
    return postNewsEntry(newOffers.length, priceUpdates.length, HttpPost);
}

module.exports = notify;