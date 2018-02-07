'use strict';

const Notifier = require('../../src/notifier/notifier');
const sinon = require('sinon');
const assert = require('chai').assert;
const config = require('../../config');

describe('Notifier', () => {
    let httpPostMock;

    function createNotifier(newOffers, priceUpdates) {
        httpPostMock = sinon.stub().returns(Promise.resolve());
        return Notifier(newOffers, priceUpdates, httpPostMock);
    }

    it('Exports a function', () => {
        assert.isFunction(Notifier);
    });

    it('Returns a promise', async () => {
        await Notifier([], []).then(() => {
            assert.isOk(true);
        });
    });

    it('Handles a new offer by posting a news message', async () => {
        await createNotifier(['item'], []).then(() => {
            assert.isOk(httpPostMock.calledWith(config.slack.newsWebHook));
        });
    });

    it('Handles two new offers by posting a news message (with plural s)', async () => {
        await createNotifier(['item1', 'item2'], []).then(() => {
            assert.isOk(httpPostMock.calledWith(config.slack.newsWebHook));
        });
    });

    it('Handles a new price by posting a news message', async () => {
        await createNotifier([], ['priceUpdate']).then(() => {
            assert.isOk(httpPostMock.calledWith(config.slack.newsWebHook));
        });
    });

    it('Handles two new prices by posting a news message (with plural s)', async () => {
        await createNotifier([], ['priceUpdate1', 'priceUpdate2']).then(() => {
            assert.isOk(httpPostMock.calledWith(config.slack.newsWebHook));
        });
    });

    it('Handles a new offer and a price update by posting a news message (with an and in between)', async () => {
        await createNotifier(['item'], ['priceUpdate']).then(() => {
            assert.isOk(httpPostMock.calledWith(config.slack.newsWebHook));
        });
    });
});