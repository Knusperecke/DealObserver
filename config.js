'use strict';

module.exports = {
    database: {host: 'localhost', user: 'root', password: 'PinkiePie', table: 'canyon', testTable: 'test'},
    slack: {
        notifierUserName: 'PriceGrabber',
        notifierEmoji: ':zap:',
        soldOutEmoji: ':no_bicycles:',
        errorEmoji: ':bug:',
        newsWebHook: 'https://hooks.slack.com/services/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',
        newsChannelName: '#news',
        priceUpdatesWebHook: 'https://hooks.slack.com/services/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',
        priceUpdatesChannelName: '#price-updates',
        newOffersWebHook: 'https://hooks.slack.com/services/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',
        newOffersChannelName: '#new-offers',
        debugWebHook: 'https://hooks.slack.com/services/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',
        debugChannelName: '#debug'
    }
};