'use strict';

module.exports = {
  database: {
    host: 'localhost',
    user: 'canyon',
    password: 'PinkiePie',
    table: 'canyon',
    testTable: 'test',
  },
  slack: {
    notifierUserName: 'PriceGrabber',
    notifierEmoji: ':zap:',
    soldOutEmoji: ':no_bicycles:',
    errorEmoji: ':bug:',
    newsWebHook: '',
    newsChannelName: '#news',
    priceUpdatesWebHook: '',
    priceUpdatesChannelName: '#price-updates',
    priceUpdatesOutletWebHook: '',
    priceUpdatesOutletChannelName: '#price-updates-outlet',
    newOffersWebHook: '',
    newOffersChannelName: '#new-offers',
    soldOutWebHook: '',
    soldOutChannelName: '#new-offers',
    debugWebHook: '',
    debugChannelName: '#debug',
  },
  fahrradxxl: { baseUrl: 'https://www.fahrrad-xxl.de', itemsToWatch: [] },
};
