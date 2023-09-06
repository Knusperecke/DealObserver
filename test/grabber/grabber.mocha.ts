import { assert } from 'chai';
import sinon from 'sinon';
import { createTestConfig } from '../make-config.js';
import { Config, InventoryUpdate, Item, PriceUpdate, ShopQueryResult } from '../../src/types.js';
import { DatabaseInterface } from '../../src/database/database.js';
import { runGrabber } from '../../src/grabber/grabber.js';
import { PushResult } from '../../src/database/push.js';
import { NotifyConfig } from '../../src/notifier/notifier.js';

const exampleItem = {
    name: 'Buntes Rad mit vielen Klingeln',
    id: 'buntes rad mit vielen klingeln',
    price: 1999,
    offerId: '150383',
    size: '*',
    modelYear: '0',
    permanent: false,
    url: 'https://picture.png',
    smallImgUrl: 'https://picture-small.png',
    condition: 'NewCondition',
};

const exampleItem2 = {
    name: 'Schnelles rad',
    id: 'id-schnelles-rad',
    price: 777,
    offerId: '150384',
    size: 'M',
    modelYear: '2023',
    permanent: true,
    url: 'https://picture-2.png',
    smallImgUrl: 'https://picture-small-2.png',
    condition: 'NewCondition',
};

const examplePriceUpdate: PriceUpdate = {
    item: exampleItem,
    newPrice: 10,
    oldPrice: exampleItem.price,
    offerId: exampleItem.offerId,
    isNew: false,
};

const examplePriceUpdate2: PriceUpdate = {
    item: exampleItem2,
    newPrice: 77,
    oldPrice: exampleItem2.price,
    offerId: exampleItem2.offerId,
    isNew: false,
};

const exampleShopQueryResult: ShopQueryResult = {
    type: 'normalOffer',
    data: 'data',
};

const exampleInventoryUpdate: InventoryUpdate = {
    newOffers: [exampleItem],
    soldOutItems: [exampleItem2],
    priceUpdates: [examplePriceUpdate],
};

describe('Grabber', () => {
    let config: {
        closeDatabase: sinon.SinonSpy<void[], Promise<void>>;
        grabberConfig: Config;
        push: sinon.SinonStub<[Item[]], Promise<PushResult>>;
        updateCurrent: sinon.SinonStub<[string[]], Promise<Item[]>>;
        databaseMock: sinon.SinonStub<
            [string, string, string, string, boolean | undefined],
            Promise<DatabaseInterface>
        >;
        fetcherMock: sinon.SinonStub<[Config], Promise<ShopQueryResult>[]>;
        parserMock: sinon.SinonStub<[ShopQueryResult], Item[]>;
        notifierMock: sinon.SinonStub<[NotifyConfig], Promise<void>>;
        errorNotifierMock: sinon.SinonStub<[Error, Config], Promise<void>>;
        updatePreprocessorMock: sinon.SinonStub<[InventoryUpdate], InventoryUpdate>;
    };
    function createGrabber({
        fetcherMock = sinon.stub<[Config], Promise<ShopQueryResult>[]>().returns([]),
        parserMock = sinon.stub<[ShopQueryResult], Item[]>().returns([]),
        pushMock = sinon
            .stub<[Item[]], Promise<PushResult>>()
            .resolves({ offerIds: [], newOffers: [], priceUpdates: [] }),
        updateCurrentMock = sinon.stub<[string[]], Promise<Item[]>>().resolves([]),
        errorNotifierMock = sinon.stub<[Error, Config], Promise<void>>().resolves(),
        updatePreprocessorMock = sinon
            .stub<[InventoryUpdate], InventoryUpdate>()
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
            fetcherMock,
            parserMock,
            notifierMock: sinon.stub<[NotifyConfig], Promise<void>>().resolves(),
            errorNotifierMock: errorNotifierMock,
            updatePreprocessorMock,
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

    // eslint-disable-next-line mocha/no-skipped-tests
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
            const fetcherMock = sinon
                .stub<[Config], Promise<ShopQueryResult>[]>()
                .returns([Promise.resolve(exampleShopQueryResult)]);
            await createGrabber({ fetcherMock });

            assert.ok(config.parserMock.calledWith(exampleShopQueryResult));
        });

        it('passes parser results to database.push', async () => {
            const fetcherMock = sinon
                .stub<[Config], Promise<ShopQueryResult>[]>()
                .returns([Promise.resolve(exampleShopQueryResult)]);
            const parserMock = sinon.stub<[ShopQueryResult], Item[]>().returns([exampleItem]);
            await createGrabber({ fetcherMock, parserMock });

            assert.ok(config.push.calledWith([exampleItem]));
        });

        it('passes offerIds from database.push to database.updateCurrent', async () => {
            const fetcherMock = sinon
                .stub<[Config], Promise<ShopQueryResult>[]>()
                .returns([Promise.resolve(exampleShopQueryResult)]);
            const parserMock = sinon.stub<[ShopQueryResult], Item[]>().resolves();
            const pushMock = sinon
                .stub<[Item[]], Promise<PushResult>>()
                .resolves({ offerIds: ['123'], newOffers: [], priceUpdates: [] });
            await createGrabber({ fetcherMock, parserMock, pushMock });

            assert.ok(config.updateCurrent.calledWith(['123']));
        });

        it('passes offerIds from distinct database.push calls to database.updateCurrent', async () => {
            const expectedOfferIds = ['123', '456'];
            const fetcherMock = sinon
                .stub<[Config], Promise<ShopQueryResult>[]>()
                .returns([
                    Promise.resolve(exampleShopQueryResult),
                    Promise.resolve(exampleShopQueryResult),
                ]);
            const parserMock = sinon.stub<[ShopQueryResult], Item[]>().resolves();
            const pushMock = sinon.stub<[Item[]], Promise<PushResult>>().resolves({
                offerIds: ['123', '456'],
                newOffers: [],
                priceUpdates: [],
            });
            await createGrabber({ fetcherMock, parserMock, pushMock });

            assert.ok(config.updateCurrent.calledWith(expectedOfferIds));
        });

        it('passes new offers to updatePreprocessor', async () => {
            const fetcherMock = sinon
                .stub<[Config], Promise<ShopQueryResult>[]>()
                .returns([Promise.resolve(exampleShopQueryResult)]);
            const parserMock = sinon.stub<[ShopQueryResult], Item[]>().resolves();
            const pushMock = sinon
                .stub<[Item[]], Promise<PushResult>>()
                .resolves({ offerIds: [], newOffers: [exampleItem], priceUpdates: [] });
            await createGrabber({ fetcherMock, parserMock, pushMock });

            assert.ok(
                config.updatePreprocessorMock.calledWith({
                    newOffers: [exampleItem],
                    soldOutItems: [],
                    priceUpdates: [],
                }),
            );
        });

        it('passes new offers from distinct push calls to updatePreprocessor', async () => {
            const fetcherMock = sinon
                .stub<[Config], Promise<ShopQueryResult>[]>()
                .returns([
                    Promise.resolve(exampleShopQueryResult),
                    Promise.resolve(exampleShopQueryResult),
                ]);
            const parserMock = sinon.stub<[ShopQueryResult], Item[]>().resolves();
            const pushMock = sinon
                .stub<[Item[]], Promise<PushResult>>()
                .onFirstCall()
                .resolves({
                    offerIds: [],
                    newOffers: [exampleItem, exampleItem2],
                    priceUpdates: [],
                });
            await createGrabber({ fetcherMock, parserMock, pushMock });

            assert.ok(
                config.updatePreprocessorMock.calledWith({
                    newOffers: [exampleItem, exampleItem2],
                    soldOutItems: [],
                    priceUpdates: [],
                }),
            );
        });

        it('passes price updates to updatePreprocessor', async () => {
            const fetcherMock = sinon
                .stub<[Config], Promise<ShopQueryResult>[]>()
                .returns([Promise.resolve(exampleShopQueryResult)]);
            const parserMock = sinon.stub<[ShopQueryResult], Item[]>().resolves();
            const pushMock = sinon.stub<[Item[]], Promise<PushResult>>().resolves({
                offerIds: [],
                newOffers: [],
                priceUpdates: [examplePriceUpdate],
            });
            await createGrabber({ fetcherMock, parserMock, pushMock });

            assert.ok(
                config.updatePreprocessorMock.calledWith({
                    newOffers: [],
                    soldOutItems: [],
                    priceUpdates: [examplePriceUpdate],
                }),
            );
        });

        it('passes price updates from distinct push calls to updatePreprocessor', async () => {
            const fetcherMock = sinon
                .stub<[Config], Promise<ShopQueryResult>[]>()
                .returns([
                    Promise.resolve(exampleShopQueryResult),
                    Promise.resolve(exampleShopQueryResult),
                ]);
            const parserMock = sinon.stub<[ShopQueryResult], Item[]>().resolves();
            const pushMock = sinon
                .stub<[Item[]], Promise<PushResult>>()
                .onFirstCall()
                .resolves({
                    offerIds: [],
                    newOffers: [],
                    priceUpdates: [examplePriceUpdate, examplePriceUpdate2],
                });
            await createGrabber({ fetcherMock, parserMock, pushMock });

            assert.ok(
                config.updatePreprocessorMock.calledWith({
                    newOffers: [],
                    soldOutItems: [],
                    priceUpdates: [examplePriceUpdate, examplePriceUpdate2],
                }),
            );
        });

        it('passes items that disappeared to updatePreprocessor', async () => {
            const fetcherMock = sinon
                .stub<[Config], Promise<ShopQueryResult>[]>()
                .returns([Promise.resolve(exampleShopQueryResult)]);
            const parserMock = sinon.stub<[ShopQueryResult], Item[]>().resolves();
            const pushMock = sinon
                .stub<[Item[]], Promise<PushResult>>()
                .resolves({ offerIds: [], newOffers: [], priceUpdates: [] });
            const updateCurrentMock = sinon
                .stub<[string[]], Promise<Item[]>>()
                .resolves([exampleItem]);
            await createGrabber({
                fetcherMock,
                parserMock,
                pushMock,
                updateCurrentMock,
            });

            assert.ok(
                config.updatePreprocessorMock.calledWith({
                    newOffers: [],
                    soldOutItems: [exampleItem],
                    priceUpdates: [],
                }),
            );
        });

        it('passes multiple items that disappeared to updatePreprocessor', async () => {
            const expectedItems = [exampleItem, exampleItem2];

            const fetcherMock = sinon
                .stub<[Config], Promise<ShopQueryResult>[]>()
                .returns([Promise.resolve(exampleShopQueryResult)]);
            const parserMock = sinon.stub<[ShopQueryResult], Item[]>().resolves();
            const pushMock = sinon
                .stub<[Item[]], Promise<PushResult>>()
                .resolves({ offerIds: [], newOffers: [], priceUpdates: [] });
            const updateCurrentMock = sinon
                .stub<[string[]], Promise<Item[]>>()
                .resolves(expectedItems);
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
            const fetcherMock = sinon
                .stub<[Config], Promise<ShopQueryResult>[]>()
                .returns([Promise.resolve(exampleShopQueryResult)]);
            const parserMock = sinon.stub<[ShopQueryResult], Item[]>().resolves();
            const pushMock = sinon
                .stub<[Item[]], Promise<PushResult>>()
                .resolves({ offerIds: [], newOffers: [], priceUpdates: [] });
            const updatePreprocessorMock = sinon
                .stub<[InventoryUpdate], InventoryUpdate>()
                .returns(exampleInventoryUpdate);
            await createGrabber({
                fetcherMock,
                parserMock,
                pushMock,
                updatePreprocessorMock,
            });

            assert.ok(
                config.notifierMock.calledWith({
                    ...exampleInventoryUpdate,
                    justSummary: false,
                    config: config.grabberConfig,
                }),
            );
        });
    });

    describe('error handling', () => {
        it('catches errors during the data flow', async () => {
            const fetcherMock = sinon
                .stub<[Config], Promise<ShopQueryResult>[]>()
                .returns([Promise.resolve(exampleShopQueryResult)]);
            const parserMock = sinon
                .stub<[ShopQueryResult], Item[]>()
                .rejects(new Error('Parsing failed'));
            await createGrabber({ fetcherMock, parserMock });
        });

        it('forwards catched errors to notifier', async () => {
            const expectedError = new Error('Parsing failed');

            const fetcherMock = sinon
                .stub<[Config], Promise<ShopQueryResult>[]>()
                .returns([Promise.resolve(exampleShopQueryResult)]);
            const parserMock = sinon.stub<[ShopQueryResult], Item[]>().rejects(expectedError);
            await createGrabber({ fetcherMock, parserMock });

            assert.ok(config.errorNotifierMock.calledWith(expectedError));
        });

        it('forwards catched errors to notifier and handles notifier errors', async () => {
            const expectedError = new Error('Notifying of error failed');

            const fetcherMock = sinon
                .stub<[Config], Promise<ShopQueryResult>[]>()
                .returns([Promise.resolve(exampleShopQueryResult)]);
            const parserMock = sinon.stub<[ShopQueryResult], Item[]>().rejects('someError');
            const errorNotifierMock = sinon
                .stub<[Error, Config], Promise<void>>()
                .rejects(expectedError);
            await createGrabber({ fetcherMock, parserMock, errorNotifierMock });
        });
    });
});
