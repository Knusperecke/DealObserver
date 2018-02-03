'use strict';

const Grabber = require('../../src/grabber/grabber');
const sinon = require('sinon');
const assert = require('chai').assert;

describe('Grabber', () => {
    let config = {};
    function createGrabber(fetchPromises = []) {
        config.closeDatabase = sinon.spy();
        config.databaseMock = sinon.stub().returns({close: config.closeDatabase});
        config.fetcherMock = sinon.stub().returns(fetchPromises);
        config.parserSpy = sinon.spy();

        return Grabber(config.databaseMock, config.fetcherMock, config.parserSpy);
    }

    it('Provides a function to run', () => {
        assert.isFunction(Grabber);
    });

    it('Creates and closes the database', async () => {
        await createGrabber();

        assert.ok(config.databaseMock.called);
        assert.ok(config.closeDatabase.called);
    });

    it('Passes fetcher results to parser', async () => {
        const expectedData = 'data';
        const fetchPromise = new Promise((resolve) => resolve(expectedData));
        await createGrabber([fetchPromise]);

        assert.ok(config.parserSpy.calledWith(expectedData));
    });
});