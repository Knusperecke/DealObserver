'use strict';

const Grabber = require('../../src/grabber/grabber');
const sinon = require('sinon');
const assert = require('chai').assert;

describe('Grabber', () => {
    let config = {};
    function createGrabber({
        fetcherMock = sinon.stub().returns([]),
        parserMock = sinon.stub().returns([]),
        pushMock = sinon.stub().returns({offerIds: [], newOffers: [], priceUpdates: []}),
        updateCurrentMock = sinon.stub().returns([]),
        errorNotifierMock = sinon.spy(),
        updatePreprocessorMock = sinon.stub().returns({newOffers: [], soldOutItems: [], priceUpdates: []})
    }) {
        config.closeDatabase = sinon.spy();
        config.push = pushMock;
        config.updateCurrent = updateCurrentMock;
        config.databaseMock =
            sinon.stub().returns({close: config.closeDatabase, push: config.push, updateCurrent: config.updateCurrent});
        config.fetcherMock = fetcherMock;
        config.parserMock = parserMock;
        config.notifierMock = sinon.spy();
        config.errorNotifierMock = errorNotifierMock;
        config.updatePreprocessorMock = updatePreprocessorMock;
        config.grabberConfig = {database: {host: '', user: '', password: '', table: ''}};

        return Grabber(
            config.databaseMock, config.fetcherMock, config.parserMock, config.notifierMock, config.errorNotifierMock,
            config.updatePreprocessorMock, config.grabberConfig);
    }

    it('Provides a function to run', () => {
        assert.isFunction(Grabber);
    });

    describe('Database handling', () => {
        it('Creates and closes the database', async () => {
            await createGrabber({});

            assert.ok(config.databaseMock.called);
            assert.ok(config.closeDatabase.called);
        });
    });

    describe('Data flow', () => {
        it('Passes fetcher results to parser', async () => {
            const expectedData = 'data';
            const fetcherMock = sinon.stub().returns([Promise.resolve(expectedData)]);
            await createGrabber({fetcherMock});

            assert.ok(config.parserMock.calledWith(expectedData));
        });

        it('Passes parser results to database.push', async () => {
            const expectedData = 'data';
            const fetcherMock = sinon.stub().returns([Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.resolve(expectedData));
            await createGrabber({fetcherMock, parserMock});

            assert.ok(config.push.calledWith([expectedData]));
        });

        it('Passes offerIds from database.push to database.updateCurrent', async () => {
            const fetcherMock = sinon.stub().returns([Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.resolve());
            const pushMock = sinon.stub().returns(Promise.resolve({offerIds: [123], newOffers: [], priceUpdates: []}));
            await createGrabber({fetcherMock, parserMock, pushMock});

            assert.ok(config.updateCurrent.calledWith([123]));
        });

        it('Passes offerIds from distinct database.push calls to database.updateCurrent', async () => {
            const expectedOfferIds = [123, 456];
            const fetcherMock = sinon.stub().returns([Promise.resolve(), Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.resolve());
            const pushMock =
                sinon.stub().returns(Promise.resolve({offerIds: [123, 456], newOffers: [], priceUpdates: []}));
            await createGrabber({fetcherMock, parserMock, pushMock});

            assert.ok(config.updateCurrent.calledWith(expectedOfferIds));
        });

        it('Passes new offers to updatePreprocessor', async () => {
            const fetcherMock = sinon.stub().returns([Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.resolve());
            const pushMock = sinon.stub().returns(Promise.resolve({offerIds: [], newOffers: [123], priceUpdates: []}));
            await createGrabber({fetcherMock, parserMock, pushMock});

            assert.ok(config.updatePreprocessorMock.calledWith({newOffers: [123], soldOutItems: [], priceUpdates: []}));
        });

        it('Passes new offers from distinct push calls to updatePreprocessor', async () => {
            const expectedNewOffers = [123, 456];
            const fetcherMock = sinon.stub().returns([Promise.resolve(), Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.resolve());
            const pushMock = sinon.stub().onFirstCall().returns(
                Promise.resolve({offerIds: [], newOffers: [123, 456], priceUpdates: []}));
            await createGrabber({fetcherMock, parserMock, pushMock});

            assert.ok(config.updatePreprocessorMock.calledWith(
                {newOffers: expectedNewOffers, soldOutItems: [], priceUpdates: []}));
        });

        it('Passes price updates to updatePreprocessor', async () => {
            const fetcherMock = sinon.stub().returns([Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.resolve());
            const pushMock = sinon.stub().returns(Promise.resolve({offerIds: [], newOffers: [], priceUpdates: [123]}));
            await createGrabber({fetcherMock, parserMock, pushMock});

            assert.ok(config.updatePreprocessorMock.calledWith({newOffers: [], soldOutItems: [], priceUpdates: [123]}));
        });

        it('Passes price updates from distinct push calls to updatePreprocessor', async () => {
            const expectedPriceUpdates = [123, 456];
            const fetcherMock = sinon.stub().returns([Promise.resolve(), Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.resolve());
            const pushMock = sinon.stub().onFirstCall().returns(
                Promise.resolve({offerIds: [], newOffers: [], priceUpdates: [123, 456]}));
            await createGrabber({fetcherMock, parserMock, pushMock});

            assert.ok(config.updatePreprocessorMock.calledWith(
                {newOffers: [], soldOutItems: [], priceUpdates: expectedPriceUpdates}));
        });

        it('Passes items that disappeared to updatePreprocessor', async () => {
            const expectedItem = 'item';

            const fetcherMock = sinon.stub().returns([Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.resolve());
            const pushMock = sinon.stub().returns(Promise.resolve({offerIds: [], newOffers: [], priceUpdates: []}));
            const updateCurrentMock = sinon.stub().returns(Promise.resolve([expectedItem]));
            await createGrabber({fetcherMock, parserMock, pushMock, updateCurrentMock});

            assert.ok(config.updatePreprocessorMock.calledWith(
                {newOffers: [], soldOutItems: [expectedItem], priceUpdates: []}));
        });

        it('Passes multiple items that disappeared to updatePreprocessor', async () => {
            const expectedItems = ['item1', 'item2'];

            const fetcherMock = sinon.stub().returns([Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.resolve());
            const pushMock = sinon.stub().returns(Promise.resolve({offerIds: [], newOffers: [], priceUpdates: []}));
            const updateCurrentMock = sinon.stub().returns(Promise.resolve(expectedItems));
            await createGrabber({fetcherMock, parserMock, pushMock, updateCurrentMock});

            assert.ok(config.updatePreprocessorMock.calledWith(
                {newOffers: [], soldOutItems: expectedItems, priceUpdates: []}));
        });

        it('Passes return value of updatePreprocessor to notifier', async () => {
            const fetcherMock = sinon.stub().returns([Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.resolve());
            const pushMock = sinon.stub().returns(Promise.resolve({offerIds: [], newOffers: [], priceUpdates: []}));
            const updatePreprocessorMock = sinon.stub().returns({expected: 'expected'});
            await createGrabber({fetcherMock, parserMock, pushMock, updatePreprocessorMock});

            assert.ok(config.notifierMock.calledWith(
                {expected: 'expected', justSummary: false, config: config.grabberConfig}));
        });
    });

    describe('Error handling', () => {
        it('Catches errors during the data flow', async () => {
            const fetcherMock = sinon.stub().returns([Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.reject(new Error('Parsing failed')));
            await createGrabber({fetcherMock, parserMock});
        });

        it('Forwards catched errors to notifier', async () => {
            const expectedError = new Error('Parsing failed');

            const fetcherMock = sinon.stub().returns([Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.reject(expectedError));
            await createGrabber({fetcherMock, parserMock});

            assert.ok(config.errorNotifierMock.calledWith(expectedError));
        });

        it('Forwards catched errors to notifier', async () => {
            const expectedError = new Error('Notifying of error failed');

            const fetcherMock = sinon.stub().returns([Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.reject('someError'));
            const errorNotifierMock = sinon.stub().returns(Promise.reject(expectedError));
            await createGrabber({fetcherMock, parserMock, errorNotifierMock});
        });
    });
});