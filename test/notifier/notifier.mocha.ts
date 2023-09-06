import MockAdapter from 'axios-mock-adapter';
import { Config, Item, PriceUpdate } from '../../src/types.js';
import { createTestConfig } from '../make-config.js';
import { notify } from '../../src/notifier/notifier.js';
import { assert } from 'chai';
import axios from 'axios';

const item: Item = {
    name: 'MoxiSpeed CF 9.0 2017',
    id: 'moxispeed cf 9.0 2017',
    price: 2299,
    offerId: '000000000000111695',
    size: '|XL|',
    modelYear: '2017',
    permanent: true,
    url: 'https://bluber/22677_img_res.png',
    smallImgUrl: 'https://blob/d4/9/aa4f663dac3837dc54dafdc850467.jpg',
    condition: 'new',
};

const uniqueItem: Item = {
    name: 'MoxiSpeed CF 9.0 2017',
    id: 'MoxiSpeed cf 9.0 2017',
    price: 2299,
    offerId: '000000000000111695',
    size: '|XL|',
    modelYear: '2017',
    permanent: false,
    url: 'https://bluber/22677_img_res.png',
    smallImgUrl: 'https://blob/d4/9/aa4f663dac3837dc54dafdc850467.jpg',
    condition: 'new',
};

const priceUpdate: PriceUpdate = {
    item: item,
    oldPrice: 2599,
    newPrice: 2299,
    isNew: false,
    offerId: item.offerId,
};

const priceUpdateMoreExpensive: PriceUpdate = {
    item: item,
    oldPrice: 1000,
    newPrice: 2299,
    isNew: false,
    offerId: item.offerId,
};

const priceUpdateUnique: PriceUpdate = {
    item: uniqueItem,
    oldPrice: 9999,
    newPrice: 2299,
    isNew: false,
    offerId: uniqueItem.offerId,
};

describe('Notifier', () => {
    let axiosMock: MockAdapter;
    let config: Config;

    const expectedNewsUrl = 'https://url-1';
    const expectedPriceUpdatesUrl = 'https://url-2';
    const expectedPriceUpdatesOutletUrl = 'https://url-3';
    const expectedNewOffersUrl = 'https://url-4';
    const expectedSoldOutUrl = 'https://url-5';
    const expectedDebugUrl = 'https://url-6';

    beforeEach(() => {
        axiosMock = new MockAdapter(axios);
        config = createTestConfig();
        config.slack.newsWebHook = expectedNewsUrl;
        config.slack.priceUpdatesWebHook = expectedPriceUpdatesUrl;
        config.slack.priceUpdatesOutletWebHook = expectedPriceUpdatesOutletUrl;
        config.slack.newOffersWebHook = expectedNewOffersUrl;
        config.slack.soldOutWebHook = expectedSoldOutUrl;
        config.slack.debugWebHook = expectedDebugUrl;
    });

    function createNotifier(
        newOffers: Item[],
        priceUpdates: PriceUpdate[],
        soldOutItems: Item[],
        justSummary = false,
    ) {
        axiosMock.onPost(/.*/).reply(200, '');
        return notify({ justSummary, newOffers, priceUpdates, soldOutItems, config });
    }

    it('exports a function', () => {
        assert.isFunction(notify);
    });

    describe('Posts news', () => {
        it('handles a new offer by posting a news message', async () => {
            await createNotifier([item], [], []);
            assert.strictEqual(
                axiosMock.history.post.filter((config) => config.url === expectedNewsUrl).length,
                1,
            );
        });

        it('handles two new offers by posting a news message (with plural s)', async () => {
            await createNotifier([item, item], [], []);
            assert.strictEqual(
                axiosMock.history.post.filter((config) => config.url === expectedNewsUrl).length,
                1,
            );
        });

        it('handles a new price by posting a news message', async () => {
            await createNotifier([], [priceUpdate], []);
            assert.strictEqual(
                axiosMock.history.post.filter((config) => config.url === expectedNewsUrl).length,
                1,
            );
        });

        it('handles two new prices by posting a news message (with plural s)', async () => {
            await createNotifier([], [priceUpdate, priceUpdate], []);
            assert.strictEqual(
                axiosMock.history.post.filter((config) => config.url === expectedNewsUrl).length,
                1,
            );
        });

        it('handles a new offer and a price update by posting a news message (with an "and" in between)', async () => {
            await createNotifier([item], [priceUpdate], []);
            assert.strictEqual(
                axiosMock.history.post.filter((config) => config.url === expectedNewsUrl).length,
                1,
            );
        });

        it('handles a new offer, a price update, and a sold out item by posting a news message (with a "," and an "and" in between)', async () => {
            await createNotifier([item], [priceUpdate], [item]);
            assert.strictEqual(
                axiosMock.history.post.filter((config) => config.url === expectedNewsUrl).length,
                1,
            );
        });
    });

    describe('Posts sold out items', () => {
        it('handles a sold out item by posting into the soldOut channel', async () => {
            await createNotifier([], [], [item]);
            assert.strictEqual(
                axiosMock.history.post.filter((config) => config.url === expectedSoldOutUrl).length,
                1,
            );
        });

        it('handles a sold out item by posting into the soldOut channel (special formatting for unique items)', async () => {
            await createNotifier([], [], [uniqueItem]);
            assert.strictEqual(
                axiosMock.history.post.filter((config) => config.url === expectedSoldOutUrl).length,
                1,
            );
        });

        it('handles multiple sold out items by posting multiple times into the soldOut channel', async () => {
            await createNotifier([], [], [item, item]);
            assert.strictEqual(
                axiosMock.history.post.filter((config) => config.url === expectedSoldOutUrl).length,
                2,
            );
        });

        it('does not provide a "sold out" notification if summary mode is on', async () => {
            await createNotifier([], [], [item], true);
            assert.strictEqual(
                axiosMock.history.post.filter((config) => config.url === expectedSoldOutUrl).length,
                0,
            );
        });
    });

    describe('Posts new offers', () => {
        it('handles a new offer by posting a new offer message', async () => {
            await createNotifier([item], [], []);
            assert.strictEqual(
                axiosMock.history.post.filter((config) => config.url === expectedNewOffersUrl)
                    .length,
                1,
            );
        });

        it('handles a new offer by posting a new offer message (special formatting for unique items)', async () => {
            await createNotifier([uniqueItem], [], []);
            assert.strictEqual(
                axiosMock.history.post.filter((config) => config.url === expectedNewOffersUrl)
                    .length,
                1,
            );
        });

        it('handles multiple new offer by posting a new offer message for each new offer', async () => {
            await createNotifier([item, item], [], []);
            assert.strictEqual(
                axiosMock.history.post.filter((config) => config.url === expectedNewOffersUrl)
                    .length,
                2,
            );
        });

        it('does not provide a "new offer" notification if summary mode is on', async () => {
            await createNotifier([item], [], [], true);
            assert.strictEqual(
                axiosMock.history.post.filter((config) => config.url === expectedNewOffersUrl)
                    .length,
                0,
            );
        });
    });

    describe('Posts price updates', () => {
        it('handles a price update by posting a price update message', async () => {
            await createNotifier([], [priceUpdate], []);
            assert.strictEqual(
                axiosMock.history.post.filter((config) => config.url === expectedPriceUpdatesUrl)
                    .length,
                1,
            );
        });

        it('handles a price update by posting a price update message (special formatting for increased price)', async () => {
            await createNotifier([], [priceUpdateMoreExpensive], []);
            assert.strictEqual(
                axiosMock.history.post.filter((config) => config.url === expectedPriceUpdatesUrl)
                    .length,
                1,
            );
        });

        it('handles two price updates by posting two price update messages', async () => {
            await createNotifier([], [priceUpdate, priceUpdate], []);
            assert.strictEqual(
                axiosMock.history.post.filter((config) => config.url === expectedPriceUpdatesUrl)
                    .length,
                2,
            );
        });

        it('handles a price update by posting a price update message, specific channel for unique items', async () => {
            await createNotifier([], [priceUpdateUnique], []);
            assert.strictEqual(
                axiosMock.history.post.filter(
                    (config) => config.url === expectedPriceUpdatesOutletUrl,
                ).length,
                1,
            );
        });

        it('does not provide a "price update" notification if summary mode is on', async () => {
            await createNotifier([], [priceUpdate], [], true);
            assert.strictEqual(
                axiosMock.history.post.filter((config) => config.url === expectedPriceUpdatesUrl)
                    .length,
                0,
            );
        });
    });
});
