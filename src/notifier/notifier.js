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

function postNewOffers(newOffers, HttpPost) {
    const promises = newOffers.map((item) => {
        const text = item.permanent === true ? 'New offer:' : 'New unique offer:';

        let attachmentText = `*${item.name}* for *${item.price}* EUR`;

        if (item.permanent === false) {
            attachmentText = attachmentText + ` size *${item.size}* condition *${item.condition}*`;
        }

        return HttpPost(
            config.slack.newOffersWebHook, JSON.stringify({
                channel: config.slack.newOffersChannelName,
                username: config.slack.notifierUserName,
                text: text.trim(),
                icon_emoji: config.slack.notifierEmoji,
                attachments:
                    [{color: '#88FF88', text: attachmentText, image_url: item.smallImgUrl, footer: '=> ' + item.url}]
            }),
            new XMLHttpRequestImpl());
    });

    return Promise.all(promises);
}

function postPriceUpdates(priceUpdates, HttpPost) {
    const promises = priceUpdates.map(({item, oldPrice, newPrice}) => {
        const text = 'Price change:';

        const sign = oldPrice > newPrice ? '-' : '+';
        const attachmentText =
            '_' + item.name + '_ *' + sign + Math.abs((100 - (newPrice * 100 / oldPrice))).toFixed(2) + '%*';

        return HttpPost(
            config.slack.priceUpdatesWebHook, JSON.stringify({
                channel: config.slack.priceUpdatesChannelName,
                username: config.slack.notifierUserName,
                text: text.trim(),
                icon_emoji: config.slack.notifierEmoji,
                attachments: [{
                    color: '#8888FF',
                    text: attachmentText,
                    image_url: item.smallImgUrl,
                    footer: '=> ' + item.url,
                    fields: [
                        {title: 'New', value: newPrice, short: true}, {title: 'Old', value: oldPrice, short: true}
                    ]
                }]
            }),
            new XMLHttpRequestImpl());
    });

    return Promise.all(promises);
}

function notify(newOffers, priceUpdates, HttpPost = HttpHelper.post) {
    return postNewsEntry(newOffers.length, priceUpdates.length, HttpPost)
        .then(() => postNewOffers(newOffers, HttpPost))
        .then(() => postPriceUpdates(priceUpdates, HttpPost));
}

module.exports = notify;