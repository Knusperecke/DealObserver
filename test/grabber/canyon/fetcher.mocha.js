'use strict';

const Fetcher = require('../../../src/grabber/canyon/fetcher')
const sinon = require('sinon');
const assert = require('chai').assert;

describe('Canyon fetcher', () => {
    let httpGet;

    beforeEach(() => {
        httpGet = sinon.stub().returns(Promise.resolve());
    });

    it('Uses the provided HttpGet implementation', () => {
        Fetcher(httpGet);
        assert.ok(httpGet.called);
    });

    it('Returns an array', () => {
        assert.isArray(Fetcher(httpGet));
    });

    it('Handles failing promises (failing http gets)', async () => {
        httpGet = sinon.stub().returns(Promise.reject());
        const promises = Fetcher(httpGet);

        let didAssertionFail = false;
        await Promise.all(promises.map(async (promise) => {
            promise.catch(() => {
                didAssertionFail = true;
            });
        }));
        assert.notOk(didAssertionFail);
    });
});