'use strict';

const Fetcher = require('../../../src/grabber/fahrradxxl/fetcher')
const sinon = require('sinon');
const assert = require('chai').assert;

describe('FahrradXXL fetcher', () => {
    let httpGet;
    let config = {fahrradxxl: {baseUrl: 'https://www.somewhere.com', itemsToWatch: ['a', 'b']}};

    beforeEach(() => {
        httpGet = sinon.stub().returns(Promise.resolve());
    });

    it('Uses the provided HttpGet implementation', () => {
        Fetcher(config, httpGet);
        assert.ok(httpGet.called);
    });

    it('Returns an array', () => {
        assert.isArray(Fetcher(config, httpGet));
    });

    it('Handles failing promises (failing http gets)', async () => {
        httpGet = sinon.stub().returns(Promise.reject());
        const promises = Fetcher(config, httpGet);

        let didAssertionFail = false;
        await Promise.all(promises.map(async (promise) => {
            await promise.catch(() => {
                didAssertionFail = true;
            });
        }));
        assert.notOk(didAssertionFail);
    });

    it('Fetches for each item to watch', async () => {
        const expectedData1 = 'example-data1';
        const expectedData2 = 'example-data2';
        httpGet = sinon.stub()
                      .onFirstCall()
                      .returns(Promise.resolve(expectedData1))
                      .onSecondCall()
                      .returns(Promise.resolve(expectedData2));

        const returnedObjects = [];
        await Promise.all(Fetcher(config, httpGet).map(async (promise) => {
            await promise.then((object) => {
                returnedObjects.push(object);
            });
        }));

        assert.equal(2, returnedObjects.length);
        assert.equal(expectedData1, returnedObjects[0]);
        assert.equal(expectedData2, returnedObjects[1]);
    });
});