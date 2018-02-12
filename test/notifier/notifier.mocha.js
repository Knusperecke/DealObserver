'use strict';

const Notifier = require('../../src/notifier/notifier');
const sinon = require('sinon');
const assert = require('chai').assert;
const config = require('../../config');

const item = {
    name: 'Speedmax CF 9.0 2017',
    id: 'speedmax cf 9.0 2017',
    price: 2299,
    offerId: '000000000000111695',
    size: '|XL|',
    modelYear: '2017',
    permanent: true,
    url: 'https://www.canyon.com/img/outlet/22677_img_res.png',
    smallImgUrl: 'https://static.canyon.com/img/cache/d4/9/aa4f663dac3837dc54dafdc850467.jpg',
    condition: 'new'
};

const uniqueItem = {
    name: 'Speedmax CF 9.0 2017',
    id: 'speedmax cf 9.0 2017',
    price: 2299,
    offerId: '000000000000111695',
    size: '|XL|',
    modelYear: '2017',
    permanent: false,
    url: 'https://www.canyon.com/img/outlet/22677_img_res.png',
    smallImgUrl: 'https://static.canyon.com/img/cache/d4/9/aa4f663dac3837dc54dafdc850467.jpg',
    condition: 'new'
};

const priceUpdate = {
    item: item,
    oldPrice: 2599,
    newPrice: 2299
};

const priceUpdateMoreExpensive = {
    item: item,
    oldPrice: 1000,
    newPrice: 2299
};

describe('Notifier', () => {
    let httpPostMock;

    function createNotifier(newOffers, priceUpdates, soldOutItems, justSummary = false) {
        httpPostMock = sinon.stub().returns(Promise.resolve());
        return Notifier({justSummary, newOffers, priceUpdates, soldOutItems}, httpPostMock);
    }

    it('Exports a function', () => {
        assert.isFunction(Notifier);
    });

    it('Returns a promise', async () => {
        await Notifier({justSummary: false, newOffers: [], priceUpdates: [], soldOutItems: []}).then(() => {
            assert.isOk(true);
        });
    });

    describe('Posts news', () => {
        it('Handles a new offer by posting a news message', async () => {
            await createNotifier([item], [], []).then(() => {
                assert.isOk(httpPostMock.calledWith(config.slack.newsWebHook));
            });
        });

        it('Handles two new offers by posting a news message (with plural s)', async () => {
            await createNotifier([item, item], [], []).then(() => {
                assert.isOk(httpPostMock.calledWith(config.slack.newsWebHook));
            });
        });

        it('Handles a new price by posting a news message', async () => {
            await createNotifier([], [priceUpdate], []).then(() => {
                assert.isOk(httpPostMock.calledWith(config.slack.newsWebHook));
            });
        });

        it('Handles two new prices by posting a news message (with plural s)', async () => {
            await createNotifier([], [priceUpdate, priceUpdate], []).then(() => {
                assert.isOk(httpPostMock.calledWith(config.slack.newsWebHook));
            });
        });

        it('Handles a new offer and a price update by posting a news message (with an "and" in between)', async () => {
            await createNotifier([item], [priceUpdate], []).then(() => {
                assert.isOk(httpPostMock.calledWith(config.slack.newsWebHook));
            });
        });

        it('Handles a new offer, a price update, and a sold out item by posting a news message (with a "," and an "and" in between)',
           async () => {
               await createNotifier([item], [priceUpdate], [item]).then(() => {
                   assert.isOk(httpPostMock.calledWith(config.slack.newsWebHook));
               });
           });
    });

    describe('Posts sold out items', () => {
        it('Handles a sold out item by posting into the soldOut channel', async () => {
            await createNotifier([], [], [item]).then(() => {
                assert.isOk(httpPostMock.calledWith(config.slack.soldOutWebHook));
            });
        });

        it('Handles a sold out item by posting into the soldOut channel (special formatting for unique items)',
           async () => {
               await createNotifier([], [], [uniqueItem]).then(() => {
                   assert.isOk(httpPostMock.calledWith(config.slack.soldOutWebHook));
               });
           });

        it('Handles multiple sold out items by posting multiple times into the soldOut channel', async () => {
            await createNotifier([], [], [item, item]).then(() => {
                assert.isOk(httpPostMock.withArgs(config.slack.soldOutWebHook).calledTwice);
            });
        });

        it('Does not provide a "sold out" notification if summary mode is on', async () => {
            await createNotifier([], [], [item], true).then(() => {
                assert.isNotOk(httpPostMock.calledWith(config.slack.soldOutWebHook));
            });
        });
    });

    describe('Posts new offers', () => {
        it('Handles a new offer by posting a new offer message', async () => {
            await createNotifier([item], [], []).then(() => {
                assert.isOk(httpPostMock.calledWith(config.slack.newOffersWebHook));
            });
        });

        it('Handles a new offer by posting a new offer message (special formatting for unique items)', async () => {
            await createNotifier([uniqueItem], [], []).then(() => {
                assert.isOk(httpPostMock.calledWith(config.slack.newOffersWebHook));
            });
        });

        it('Handles multiple new offer by posting a new offer message for each new offer', async () => {
            await createNotifier([item, item], [], []).then(() => {
                assert.isOk(httpPostMock.withArgs(config.slack.newOffersWebHook).calledTwice);
            });
        });

        it('Does not provide a "new offer" notification if summary mode is on', async () => {
            await createNotifier([item], [], [], true).then(() => {
                assert.isNotOk(httpPostMock.calledWith(config.slack.newOffersWebHook));
            });
        });
    });

    describe('Posts price updates', () => {
        it('Handles a price update by posting a price update message', async () => {
            await createNotifier([], [priceUpdate], []).then(() => {
                assert.isOk(httpPostMock.calledWith(config.slack.priceUpdatesWebHook));
            });
        });

        it('Handles a price update by posting a price update message (special formatting for increased price)',
           async () => {
               await createNotifier([], [priceUpdateMoreExpensive], []).then(() => {
                   assert.isOk(httpPostMock.calledWith(config.slack.priceUpdatesWebHook));
               });
           });

        it('Handles two price updates by posting two price update messages', async () => {
            await createNotifier([], [priceUpdate, priceUpdate], []).then(() => {
                assert.isOk(httpPostMock.withArgs(config.slack.priceUpdatesWebHook).calledTwice);
            });
        });

        it('Does not provide a "price update" notification if summary mode is on', async () => {
            await createNotifier([], [priceUpdate], [], true).then(() => {
                assert.isNotOk(httpPostMock.calledWith(config.slack.priceUpdatesWebHook));
            });
        });
    });
});