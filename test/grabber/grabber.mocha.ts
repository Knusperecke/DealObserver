import { assert } from 'chai';
import sinon from 'sinon';
import { createTestConfig } from './make-config.js';
import { Config } from '../../src/types.js';
import { DatabaseInterface } from '../../src/database/database.js';
import { runGrabber } from '../../src/grabber/grabber.js';

describe('Grabber', () => {
    let config: {
        closeDatabase: sinon.SinonSpy<any[], any>;
        grabberConfig: Config;
        push: sinon.SinonStub<any[], any>;
        updateCurrent: sinon.SinonStub<any[], any>;
        databaseMock: sinon.SinonStub<
            [string, string, string, string, boolean | undefined],
            Promise<DatabaseInterface>
        >;
        fetcherMock: sinon.SinonStub<any[], any>;
        parserMock: sinon.SinonStub<any[], any>;
        notifierMock: sinon.SinonSpy<any[], any>;
        errorNotifierMock: sinon.SinonSpy<any[], any>;
        updatePreprocessorMock: sinon.SinonStub<any[], any>;
    };
    function createGrabber({
        fetcherMock = sinon.stub().returns([]),
        parserMock = sinon.stub().returns([]),
        pushMock = sinon.stub().returns({ offerIds: [], newOffers: [], priceUpdates: [] }),
        updateCurrentMock = sinon.stub().returns([]),
        errorNotifierMock = sinon.spy(),
        updatePreprocessorMock = sinon
            .stub()
            .returns({ newOffers: [], soldOutItems: [], priceUpdates: [] }),
    }) {
        const closeDatabaseSpy = sinon.spy();
        config = {
            closeDatabase: closeDatabaseSpy,
            push: pushMock,
            updateCurrent: updateCurrentMock,
            databaseMock: sinon
                .stub<[string, string, string, string, boolean | undefined]>()
                .returns({
                    close: closeDatabaseSpy,
                    push: pushMock,
                    updateCurrent: updateCurrentMock,
                }),
            fetcherMock: fetcherMock,
            parserMock: parserMock,
            notifierMock: sinon.spy(),
            errorNotifierMock: errorNotifierMock,
            updatePreprocessorMock: updatePreprocessorMock,
            grabberConfig: {
                ...createTestConfig(),
                database: { host: '', user: '', password: '', table: '', testTable: '' },
            },
        };

        return runGrabber(
            config.databaseMock,
            [
                {
                    fetcher: config.fetcherMock,
                    parser: config.parserMock,
                },
            ],
            config.updatePreprocessorMock,
            config.notifierMock,
            config.errorNotifierMock,
            config.grabberConfig,
        );
    }

    it.skip('debugging target via mocha', () => {
        runGrabber();
    });

    it('provides a function to run', () => {
        assert.isFunction(runGrabber);
    });

    describe('database handling', () => {
        it('creates and closes the database', async () => {
            await createGrabber({});

            assert.ok(config.databaseMock.called);
            assert.ok(config.closeDatabase.called);
        });
    });

    describe('data flow', () => {
        it('passes fetcher results to parser', async () => {
            const expectedData = 'data';
            const fetcherMock = sinon.stub().returns([Promise.resolve(expectedData)]);
            await createGrabber({ fetcherMock });

            assert.ok(config.parserMock.calledWith(expectedData));
        });

        it('passes parser results to database.push', async () => {
            const expectedData = 'data';
            const fetcherMock = sinon.stub().returns([Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.resolve(expectedData));
            await createGrabber({ fetcherMock, parserMock });

            assert.ok(config.push.calledWith([expectedData]));
        });

        it('passes offerIds from database.push to database.updateCurrent', async () => {
            const fetcherMock = sinon.stub().returns([Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.resolve());
            const pushMock = sinon
                .stub()
                .returns(Promise.resolve({ offerIds: [123], newOffers: [], priceUpdates: [] }));
            await createGrabber({ fetcherMock, parserMock, pushMock });

            assert.ok(config.updateCurrent.calledWith([123]));
        });

        it('passes offerIds from distinct database.push calls to database.updateCurrent', async () => {
            const expectedOfferIds = [123, 456];
            const fetcherMock = sinon.stub().returns([Promise.resolve(), Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.resolve());
            const pushMock = sinon.stub().returns(
                Promise.resolve({
                    offerIds: [123, 456],
                    newOffers: [],
                    priceUpdates: [],
                }),
            );
            await createGrabber({ fetcherMock, parserMock, pushMock });

            assert.ok(config.updateCurrent.calledWith(expectedOfferIds));
        });

        it('passes new offers to updatePreprocessor', async () => {
            const fetcherMock = sinon.stub().returns([Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.resolve());
            const pushMock = sinon
                .stub()
                .returns(Promise.resolve({ offerIds: [], newOffers: [123], priceUpdates: [] }));
            await createGrabber({ fetcherMock, parserMock, pushMock });

            assert.ok(
                config.updatePreprocessorMock.calledWith({
                    newOffers: [123],
                    soldOutItems: [],
                    priceUpdates: [],
                }),
            );
        });

        it('passes new offers from distinct push calls to updatePreprocessor', async () => {
            const expectedNewOffers = [123, 456];
            const fetcherMock = sinon.stub().returns([Promise.resolve(), Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.resolve());
            const pushMock = sinon
                .stub()
                .onFirstCall()
                .returns(
                    Promise.resolve({
                        offerIds: [],
                        newOffers: [123, 456],
                        priceUpdates: [],
                    }),
                );
            await createGrabber({ fetcherMock, parserMock, pushMock });

            assert.ok(
                config.updatePreprocessorMock.calledWith({
                    newOffers: expectedNewOffers,
                    soldOutItems: [],
                    priceUpdates: [],
                }),
            );
        });

        it('passes price updates to updatePreprocessor', async () => {
            const fetcherMock = sinon.stub().returns([Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.resolve());
            const pushMock = sinon
                .stub()
                .returns(Promise.resolve({ offerIds: [], newOffers: [], priceUpdates: [123] }));
            await createGrabber({ fetcherMock, parserMock, pushMock });

            assert.ok(
                config.updatePreprocessorMock.calledWith({
                    newOffers: [],
                    soldOutItems: [],
                    priceUpdates: [123],
                }),
            );
        });

        it('passes price updates from distinct push calls to updatePreprocessor', async () => {
            const expectedPriceUpdates = [123, 456];
            const fetcherMock = sinon.stub().returns([Promise.resolve(), Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.resolve());
            const pushMock = sinon
                .stub()
                .onFirstCall()
                .returns(
                    Promise.resolve({
                        offerIds: [],
                        newOffers: [],
                        priceUpdates: [123, 456],
                    }),
                );
            await createGrabber({ fetcherMock, parserMock, pushMock });

            assert.ok(
                config.updatePreprocessorMock.calledWith({
                    newOffers: [],
                    soldOutItems: [],
                    priceUpdates: expectedPriceUpdates,
                }),
            );
        });

        it('passes items that disappeared to updatePreprocessor', async () => {
            const expectedItem = 'item';

            const fetcherMock = sinon.stub().returns([Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.resolve());
            const pushMock = sinon
                .stub()
                .returns(Promise.resolve({ offerIds: [], newOffers: [], priceUpdates: [] }));
            const updateCurrentMock = sinon.stub().returns(Promise.resolve([expectedItem]));
            await createGrabber({
                fetcherMock,
                parserMock,
                pushMock,
                updateCurrentMock,
            });

            assert.ok(
                config.updatePreprocessorMock.calledWith({
                    newOffers: [],
                    soldOutItems: [expectedItem],
                    priceUpdates: [],
                }),
            );
        });

        it('passes multiple items that disappeared to updatePreprocessor', async () => {
            const expectedItems = ['item1', 'item2'];

            const fetcherMock = sinon.stub().returns([Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.resolve());
            const pushMock = sinon
                .stub()
                .returns(Promise.resolve({ offerIds: [], newOffers: [], priceUpdates: [] }));
            const updateCurrentMock = sinon.stub().returns(Promise.resolve(expectedItems));
            await createGrabber({
                fetcherMock,
                parserMock,
                pushMock,
                updateCurrentMock,
            });

            assert.ok(
                config.updatePreprocessorMock.calledWith({
                    newOffers: [],
                    soldOutItems: expectedItems,
                    priceUpdates: [],
                }),
            );
        });

        it('passes return value of updatePreprocessor to notifier', async () => {
            const fetcherMock = sinon.stub().returns([Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.resolve());
            const pushMock = sinon
                .stub()
                .returns(Promise.resolve({ offerIds: [], newOffers: [], priceUpdates: [] }));
            const updatePreprocessorMock = sinon.stub().returns({ expected: 'expected' });
            await createGrabber({
                fetcherMock,
                parserMock,
                pushMock,
                updatePreprocessorMock,
            });

            assert.ok(
                config.notifierMock.calledWith({
                    expected: 'expected',
                    justSummary: false,
                    config: config.grabberConfig,
                }),
            );
        });
    });

    describe('error handling', () => {
        it('catches errors during the data flow', async () => {
            const fetcherMock = sinon.stub().returns([Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.reject(new Error('Parsing failed')));
            await createGrabber({ fetcherMock, parserMock });
        });

        it('forwards catched errors to notifier', async () => {
            const expectedError = new Error('Parsing failed');

            const fetcherMock = sinon.stub().returns([Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.reject(expectedError));
            await createGrabber({ fetcherMock, parserMock });

            assert.ok(config.errorNotifierMock.calledWith(expectedError));
        });

        it('forwards catched errors to notifier and handles notifier errors', async () => {
            const expectedError = new Error('Notifying of error failed');

            const fetcherMock = sinon.stub().returns([Promise.resolve()]);
            const parserMock = sinon.stub().returns(Promise.reject('someError'));
            const errorNotifierMock = sinon.stub().returns(Promise.reject(expectedError));
            await createGrabber({ fetcherMock, parserMock, errorNotifierMock });
        });
    });
});
