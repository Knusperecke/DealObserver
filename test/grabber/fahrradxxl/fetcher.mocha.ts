import MockAdapter from 'axios-mock-adapter';
import { createTestConfig } from '../../make-config.js';
import { Config } from '../../../src/types.js';
import axios from 'axios';
import { fetcherQueries } from '../../../src/grabber/fahrradxxl/fetcher.js';
import { assert } from 'chai';

describe('FahrradXXL fetcher', () => {
    let config: Config = {
        ...createTestConfig(),
        fahrradxxl: {
            baseUrl: 'https://www.somewhere.com',
            itemsToWatch: ['a', 'b'],
        },
    };

    let axiosMock: MockAdapter;

    beforeEach(() => {
        axiosMock = new MockAdapter(axios);
    });

    it('uses the provided HttpGet implementation', () => {
        axiosMock.onGet(/.*www[.]somewhere[.]com.*/).reply(200, 'data');
        fetcherQueries(config);
        assert.strictEqual(axiosMock.history.get.length, 2);
    });

    it('returns an array', () => {
        axiosMock.onGet(/.*www[.]somewhere[.]com.*/).reply(200, 'data');
        assert.isArray(fetcherQueries(config));
    });

    it('handles failing promises (failing http gets)', async () => {
        axiosMock.onGet(/.*www[.]somewhere[.]com.*/).reply(404);
        return assert.isRejected(Promise.all(fetcherQueries(config)), '404');
    });

    it('fetches for each item to watch', async () => {
        const expectedData1 = 'example-data1';
        const expectedData2 = 'example-data2';
        axiosMock.onGet(/.*www[.]somewhere[.]com.*/).replyOnce(200, expectedData1);
        axiosMock.onGet(/.*www[.]somewhere[.]com.*/).replyOnce(200, expectedData2);

        const returnedObjects = await Promise.all(fetcherQueries(config));

        assert.equal(2, returnedObjects.length);
        assert.equal(expectedData1, returnedObjects[0].data);
        assert.equal(expectedData2, returnedObjects[1].data);
    });
});
