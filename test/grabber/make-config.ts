import { Config } from '../../src/types.js';

export function createTestConfig(): Config {
    return {
        database: {
            host: 'testHost',
            user: 'testUser',
            password: 'testPassword',
            table: 'productionTable',
            testTable: 'testTable',
        },
        slack: {
            notifierUserName: 'user',
            notifierEmoji: ':notifer:',
            soldOutEmoji: ':soldout:',
            errorEmoji: ':error:',
            newsWebHook: 'news-hook',
            newsChannelName: 'news',
            priceUpdatesWebHook: 'prices-hook',
            priceUpdatesChannelName: 'prices',
            priceUpdatesOutletWebHook: 'outlet-hook',
            priceUpdatesOutletChannelName: 'outlet',
            newOffersWebHook: 'new-items-hook',
            newOffersChannelName: 'new-items',
            soldOutWebHook: 'sold-out-hook',
            soldOutChannelName: 'sold-out',
            debugWebHook: 'debug-hook',
            debugChannelName: 'debug',
        },
        fahrradxxl: {
            baseUrl: 'https://some-inventory.com',
            itemsToWatch: ['a', 'b'],
        },
    };
}
