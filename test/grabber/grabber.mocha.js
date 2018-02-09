'use strict';

const Grabber = require('../../src/grabber/grabber');
const sinon = require('sinon');
const assert = require('chai').assert;

describe('Grabber', () => {
    let config = {};
    function createGrabber(
        fetcherMock = sinon.stub().returns([]), parserMock = sinon.stub().returns([]),
        pushMock = sinon.stub().returns({offerIds: [], newOffers: [], priceUpdates: []}),
        updateCurrentMock = sinon.stub().returns([]), errorNotifierMock = sinon.spy()) {
        config.closeDatabase = sinon.spy();
        config.push = pushMock;
        config.updateCurrent = updateCurrentMock;
        config.databaseMock =
            sinon.stub().returns({close: config.closeDatabase, push: config.push, updateCurrent: config.updateCurrent});
        config.fetcherMock = fetcherMock;
        config.parserMock = parserMock;
        config.notifierMock = sinon.spy();
        config.errorNotifierMock = errorNotifierMock;

        return Grabber(
            config.databaseMock, config.fetcherMock, config.parserMock, config.notifierMock, config.errorNotifierMock);
    }

    it('Provides a function to run', () => {
        assert.isFunction(Grabber);
    });

    describe('Database handling', () => {
        it('Creates and closes the database', async () => {
            await createGrabber();

            assert.ok(config.databaseMock.called);
            assert.ok(config.closeDatabase.called);
        });
    });

    describe('Data flow', () => {
        it('Passes fetcher results to parser', async () => {
            const expectedData = 'data';
            const fetcherMock = sinon.stub().returns([Promise.resolve(expectedData)]);
            await createGrabber(fetcherMock);

            assert.ok(config.parserMock.calledWith(expectedData));
        });

        it('Passes parser results to database.push', async () => {
            const expectedData = 'data';
            const fetcherMock = sinon.stub().returns([Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.resolve(expectedData));
            await createGrabber(fetcherMock, parserMock);

            assert.ok(config.push.calledWith(expectedData));
        });

        it('Passes offerIds from database.push to database.updateCurrent', async () => {
            const fetcherMock = sinon.stub().returns([Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.resolve());
            const dbPushMock =
                sinon.stub().returns(Promise.resolve({offerIds: [123], newOffers: [], priceUpdates: []}));
            await createGrabber(fetcherMock, parserMock, dbPushMock);

            assert.ok(config.updateCurrent.calledWith([123]));
        });

        it('Passes offerIds from distinct database.push calls to database.updateCurrent', async () => {
            const expectedOfferIds = [123, 456];
            const fetcherMock = sinon.stub().returns([Promise.resolve(), Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.resolve());
            const dbPushMock = sinon.stub()
                                   .onFirstCall()
                                   .returns(Promise.resolve({offerIds: [123], newOffers: [], priceUpdates: []}))
                                   .onSecondCall()
                                   .returns(Promise.resolve({offerIds: [456], newOffers: [], priceUpdates: []}));
            await createGrabber(fetcherMock, parserMock, dbPushMock);

            assert.ok(config.updateCurrent.calledWith(expectedOfferIds));
        });

        it('Passes new offers to notifier', async () => {
            const fetcherMock = sinon.stub().returns([Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.resolve());
            const dbPushMock =
                sinon.stub().returns(Promise.resolve({offerIds: [], newOffers: [123], priceUpdates: []}));
            await createGrabber(fetcherMock, parserMock, dbPushMock);

            assert.ok(config.notifierMock.calledWith([123]));
        });

        it('Passes new offers from distinct push calls to notifier', async () => {
            const expectedNewOffers = [123, 456];
            const fetcherMock = sinon.stub().returns([Promise.resolve(), Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.resolve());
            const dbPushMock = sinon.stub()
                                   .onFirstCall()
                                   .returns(Promise.resolve({offerIds: [], newOffers: [123], priceUpdates: []}))
                                   .onSecondCall()
                                   .returns(Promise.resolve({offerIds: [], newOffers: [456], priceUpdates: []}));
            await createGrabber(fetcherMock, parserMock, dbPushMock);

            assert.ok(config.notifierMock.calledWith(expectedNewOffers));
        });

        it('Passes price updates to notifier', async () => {
            const fetcherMock = sinon.stub().returns([Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.resolve());
            const dbPushMock =
                sinon.stub().returns(Promise.resolve({offerIds: [], newOffers: [], priceUpdates: [123]}));
            await createGrabber(fetcherMock, parserMock, dbPushMock);

            assert.ok(config.notifierMock.calledWith([], [123]));
        });

        it('Passes price updates from distinct push calls to notifier', async () => {
            const expectedPriceUpdates = [123, 456];
            const fetcherMock = sinon.stub().returns([Promise.resolve(), Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.resolve());
            const dbPushMock = sinon.stub()
                                   .onFirstCall()
                                   .returns(Promise.resolve({offerIds: [], newOffers: [], priceUpdates: [123]}))
                                   .onSecondCall()
                                   .returns(Promise.resolve({offerIds: [], newOffers: [], priceUpdates: [456]}));
            await createGrabber(fetcherMock, parserMock, dbPushMock);

            assert.ok(config.notifierMock.calledWith([], expectedPriceUpdates));
        });

        it('Passes items that disappeared to notifier', async () => {
            const expectedItem = 'item';

            const fetcherMock = sinon.stub().returns([Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.resolve());
            const dbPushMock = sinon.stub().returns(Promise.resolve({offerIds: [], newOffers: [], priceUpdates: []}));
            const dbUpdateCurrentMock = sinon.stub().returns(Promise.resolve([expectedItem]));
            await createGrabber(fetcherMock, parserMock, dbPushMock, dbUpdateCurrentMock);

            assert.ok(config.notifierMock.calledWith([], [], [expectedItem]));
        });

        it('Passes multiple items that disappeared to notifier', async () => {
            const expectedItems = ['item1', 'item2'];

            const fetcherMock = sinon.stub().returns([Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.resolve());
            const dbPushMock = sinon.stub().returns(Promise.resolve({offerIds: [], newOffers: [], priceUpdates: []}));
            const dbUpdateCurrentMock = sinon.stub().returns(Promise.resolve(expectedItems));
            await createGrabber(fetcherMock, parserMock, dbPushMock, dbUpdateCurrentMock);

            assert.ok(config.notifierMock.calledWith([], [], expectedItems));
        });
    });

    describe('Error handling', () => {
        it('Catches errors during the data flow', async () => {
            const fetcherMock = sinon.stub().returns([Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.reject(new Error('Parsing failed')));
            await createGrabber(fetcherMock, parserMock);
        });

        it('Forwards catched errors to notifier', async () => {
            const expectedError = new Error('Parsing failed');

            const fetcherMock = sinon.stub().returns([Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.reject(expectedError));
            await createGrabber(fetcherMock, parserMock);

            assert.ok(config.errorNotifierMock.calledWith(expectedError));
        });

        it('Forwards catched errors to notifier', async () => {
            const expectedError = new Error('Notifying of error failed');

            const fetcherMock = sinon.stub().returns([Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.reject('someError'));
            const errorNotifierMock = sinon.stub().returns(Promise.reject(expectedError));
            await createGrabber(fetcherMock, parserMock, {}, {}, errorNotifierMock);
        });
    });
});