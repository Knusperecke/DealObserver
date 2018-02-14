'use strict';

const XMLHttpRequestImpl = require('xmlhttprequest').XMLHttpRequest;
const HttpHelper = require('../util/httpHelper');
const Logger = require('../util/logger');
const config = require('../../config');

function addPluralS(count) {
    return count > 1 ? 's' : '';
}

function sentenice(expressions) {
    let ret = '';
    expressions.forEach((expression, index) => {
        ret = ret + expression;

        if (index + 2 === expressions.length) {
            ret = ret + ' and ';
        } else if (index + 2 < expressions.length) {
            ret = ret + ', ';
        }
    });
    return ret;
}

function postNewsEntry(numNewOffers, numPriceUpdates, numSoldOutItems, HttpPost) {
    if (config.slack.newsChannelName === '' || (numNewOffers === 0 && numPriceUpdates === 0 && numSoldOutItems === 0)) {
        return Promise.resolve();
    }

    const pieces = [];
    if (numNewOffers > 0) {
        pieces.push(`*${numNewOffers}* new offer${addPluralS(numNewOffers)}`);
    }
    if (numPriceUpdates > 0) {
        pieces.push(`*${numPriceUpdates}* updated price${addPluralS(numPriceUpdates)}`);
    }
    if (numSoldOutItems > 0) {
        pieces.push(`*${numSoldOutItems}* item${addPluralS(numSoldOutItems)} sold out`);
    }

    const text = '*Update:* ' + sentenice(pieces);

    return HttpPost(
        config.slack.newsWebHook, JSON.stringify({
            channel: config.slack.newsChannelName,
            username: config.slack.notifierUserName,
            text: text.trim(),
            icon_emoji: config.slack.notifierEmoji
        }),
        new XMLHttpRequestImpl());
}

function postSoldOutItems(soldOutItems, HttpPost) {
    if (config.slack.soldOutChannelName === '') {
        return Promise.resolve();
    }

    const promises = soldOutItems.map((item) => {
        let attachmentText = `~${item.name}~ for ~${item.price} EUR~`;

        if (item.permanent === false) {
            attachmentText = attachmentText + ` size ${item.size} condition ${item.condition}`;
        }

        return HttpPost(
            config.slack.soldOutWebHook, JSON.stringify({
                channel: config.slack.soldOutChannelName,
                username: config.slack.notifierUserName,
                text: 'Sold out:',
                icon_emoji: config.slack.soldOutEmoji,
                attachments: [{
                    color: '#FF8888',
                    text: attachmentText,
                    image_url: item.smallImgUrl || '',
                    footer: '=> ' + item.url || ''
                }]
            }),
            new XMLHttpRequestImpl());
    });

    return Promise.all(promises);
}

function postNewOffers(newOffers, HttpPost) {
    if (config.slack.newOffersChannelName === '') {
        return Promise.resolve();
    }

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
                attachments: [{
                    color: '#88FF88',
                    text: attachmentText,
                    image_url: item.smallImgUrl || '',
                    footer: '=> ' + item.url || ''
                }]
            }),
            new XMLHttpRequestImpl());
    });

    return Promise.all(promises);
}

function postPriceUpdates(priceUpdates, HttpPost) {
    const promises = priceUpdates.map(({item, oldPrice, newPrice}) => {
        const webHookToUse =
            item.permanent === true ? config.slack.priceUpdatesWebHook : config.slack.priceUpdatesOutletWebHook;
        const channelNameToUse =
            item.permanent === true ? config.slack.priceUpdatesChannelName : config.slack.priceUpdatesOutletChannelName;

        if (webHookToUse === '') {
            return Promise.resolve();
        }

        const text = 'Price change:';

        const sign = oldPrice > newPrice ? '-' : '+';
        const attachmentText = '_' + item.name + '_ in ' + item.size + ' *' + sign +
            Math.abs((100 - (newPrice * 100 / oldPrice))).toFixed(2) + '%*';

        return HttpPost(
            webHookToUse, JSON.stringify({
                channel: channelNameToUse,
                username: config.slack.notifierUserName,
                text: text.trim(),
                icon_emoji: config.slack.notifierEmoji,
                attachments: [{
                    color: '#8888FF',
                    text: attachmentText,
                    image_url: item.smallImgUrl || '',
                    footer: '=> ' + item.url || '',
                    fields: [
                        {title: 'New', value: newPrice, short: true}, {title: 'Old', value: oldPrice, short: true}
                    ]
                }]
            }),
            new XMLHttpRequestImpl());
    });

    return Promise.all(promises);
}

function notify({newOffers, priceUpdates, soldOutItems, justSummary}, HttpPost = HttpHelper.post) {
    return postNewsEntry(newOffers.length, priceUpdates.length, soldOutItems.length, HttpPost)
        .then(() => {
            let ret = Promise.resolve();
            if (!justSummary) {
                ret = ret.then(() => postSoldOutItems(soldOutItems, HttpPost))
                          .then(() => postNewOffers(newOffers, HttpPost))
                          .then(() => postPriceUpdates(priceUpdates, HttpPost))
            }
            return ret;
        })
        .then(() => Logger.log('Finished notification handling'));
}

module.exports = notify;