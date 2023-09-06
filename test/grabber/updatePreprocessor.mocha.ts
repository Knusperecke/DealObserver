import { assert } from 'chai';
import { preproces } from '../../src/grabber/updatePreprocessor.js';
import { Item, InventoryUpdate, PriceUpdate } from '../../src/types.js';

const emptyUpdate: InventoryUpdate = {
    newOffers: [],
    soldOutItems: [],
    priceUpdates: [],
};

const permanentItem: Item = {
    name: 'Bike 2017',
    id: 'bike 2017',
    price: 1000,
    offerId: '42',
    size: '|M|',
    modelYear: '2017',
    permanent: true,
    url: 'someUrl',
    smallImgUrl: 'someOtherUrl',
    condition: 'broken',
};

const outletItem: Item = {
    name: 'Bike',
    id: 'bike 2017',
    price: 1000,
    offerId: '42',
    size: '|M|',
    modelYear: '2017',
    permanent: false,
    url: 'someUrl',
    smallImgUrl: 'someOtherUrl',
    condition: 'broken',
};

const outletItemDifferntlySpelledName: Item = {
    name: 'BIKE',
    id: 'bike 2017',
    price: 1000,
    offerId: '42',
    size: '|M|',
    modelYear: '2017',
    permanent: false,
    url: 'someUrl',
    smallImgUrl: 'someOtherUrl',
    condition: 'broken',
};

const outletItemDifferentCondition: Item = {
    name: 'Bike',
    id: 'bike 2017',
    price: 1000,
    offerId: '42',
    size: '|M|',
    modelYear: '2017',
    permanent: false,
    url: 'someUrl',
    smallImgUrl: 'someOtherUrl',
    condition: 'new',
};

const outletItemDifferentSize: Item = {
    name: 'Bike',
    id: 'bike 2017',
    price: 1000,
    offerId: '42',
    size: '|XXXXL|',
    modelYear: '2017',
    permanent: false,
    url: 'someUrl',
    smallImgUrl: 'someOtherUrl',
    condition: 'broken',
};

const outletItemDifferentName: Item = {
    name: 'Another Bike',
    id: 'another bike 2017',
    price: 1000,
    offerId: '42',
    size: '|M|',
    modelYear: '2017',
    permanent: false,
    url: 'someUrl',
    smallImgUrl: 'someOtherUrl',
    condition: 'broken',
};

const outletItemDifferentPrice: Item = {
    name: 'Bike',
    id: 'bike 2017',
    price: 999,
    offerId: '42',
    size: '|M|',
    modelYear: '2017',
    permanent: false,
    url: 'someUrl',
    smallImgUrl: 'someOtherUrl',
    condition: 'broken',
};

describe('Canyon Preprocessor for Notifier Updates', () => {
    it('expects an object with "newOffers", "soldOutItems", and "priceUpdates"', () => {
        assert.deepEqual(preproces(emptyUpdate), emptyUpdate);
    });

    it('does not do anything for new permanent items', () => {
        const expectedUpdate: InventoryUpdate = {
            newOffers: [permanentItem],
            soldOutItems: [],
            priceUpdates: [],
        };
        assert.deepEqual(preproces(expectedUpdate), expectedUpdate);
    });

    it('does not do anything for sold out permanent items', () => {
        const expectedUpdate: InventoryUpdate = {
            newOffers: [],
            soldOutItems: [permanentItem],
            priceUpdates: [],
        };
        assert.deepEqual(preproces(expectedUpdate), expectedUpdate);
    });

    it('does not do anything for a permanent new offers that is equal permanent sold out item', () => {
        const expectedUpdate: InventoryUpdate = {
            newOffers: [permanentItem],
            soldOutItems: [permanentItem],
            priceUpdates: [],
        };
        assert.deepEqual(preproces(expectedUpdate), expectedUpdate);
    });

    it('removes the update if the item is both in newOffers and soldOutItems', () => {
        const inputUpdate: InventoryUpdate = {
            newOffers: [outletItem],
            soldOutItems: [outletItem],
            priceUpdates: [],
        };
        assert.deepEqual(preproces(inputUpdate), emptyUpdate);
    });

    it('removes the update if the item is both in newOffers and soldOutItems, name can be spelled differently, id must match', () => {
        const inputUpdate: InventoryUpdate = {
            newOffers: [outletItem],
            soldOutItems: [outletItemDifferntlySpelledName],
            priceUpdates: [],
        };
        assert.deepEqual(preproces(inputUpdate), emptyUpdate);
    });

    it('removes the update if the item is both in newOffers and soldOutItems, even if it is in a different condition (condition from server can vary)', () => {
        const inputUpdate: InventoryUpdate = {
            newOffers: [outletItem],
            soldOutItems: [outletItemDifferentCondition],
            priceUpdates: [],
        };
        assert.deepEqual(preproces(inputUpdate), emptyUpdate);
    });

    it('does not remove an update if the size of the item is different', () => {
        const expectedUpdate: InventoryUpdate = {
            newOffers: [outletItem],
            soldOutItems: [outletItemDifferentSize],
            priceUpdates: [],
        };
        assert.deepEqual(preproces(expectedUpdate), expectedUpdate);
    });

    it('does not remove an update if the name of the item is different', () => {
        const expectedUpdate: InventoryUpdate = {
            newOffers: [outletItem],
            soldOutItems: [outletItemDifferentName],
            priceUpdates: [],
        };
        assert.deepEqual(preproces(expectedUpdate), expectedUpdate);
    });

    it('computes a price update if the item is both in newOffers and soldOutItems, but with different price', () => {
        const inputUpdate: InventoryUpdate = {
            newOffers: [outletItem],
            soldOutItems: [outletItemDifferentPrice],
            priceUpdates: [],
        };
        const expectedUpdate: InventoryUpdate = {
            newOffers: [],
            soldOutItems: [],
            priceUpdates: [
                {
                    item: outletItem,
                    oldPrice: outletItemDifferentPrice.price,
                    newPrice: outletItem.price,
                    isNew: false,
                    offerId: outletItem.offerId,
                },
            ],
        };
        assert.deepEqual(preproces(inputUpdate), expectedUpdate);
    });

    it('computes multiple price updates', () => {
        const inputUpdate: InventoryUpdate = {
            newOffers: [outletItem, outletItem],
            soldOutItems: [outletItemDifferentPrice, outletItemDifferentPrice],
            priceUpdates: [],
        };
        const expectedUpdate: InventoryUpdate = {
            newOffers: [],
            soldOutItems: [],
            priceUpdates: [
                {
                    item: outletItem,
                    oldPrice: outletItemDifferentPrice.price,
                    newPrice: outletItem.price,
                    isNew: false,
                    offerId: outletItem.offerId,
                },
                {
                    item: outletItem,
                    oldPrice: outletItemDifferentPrice.price,
                    newPrice: outletItem.price,
                    isNew: false,
                    offerId: outletItem.offerId,
                },
            ],
        };
        assert.deepEqual(preproces(inputUpdate), expectedUpdate);
    });

    it('computes a price update and keeps other new offers', () => {
        const inputUpdate: InventoryUpdate = {
            newOffers: [permanentItem, outletItem],
            soldOutItems: [outletItemDifferentPrice],
            priceUpdates: [],
        };
        const expectedUpdate: InventoryUpdate = {
            newOffers: [permanentItem],
            soldOutItems: [],
            priceUpdates: [
                {
                    item: outletItem,
                    oldPrice: outletItemDifferentPrice.price,
                    newPrice: outletItem.price,
                    isNew: false,
                    offerId: outletItem.offerId,
                },
            ],
        };
        assert.deepEqual(preproces(inputUpdate), expectedUpdate);
    });

    it('computes a price update and keeps other sold out items', () => {
        const inputUpdate: InventoryUpdate = {
            newOffers: [outletItem],
            soldOutItems: [outletItemDifferentPrice, permanentItem],
            priceUpdates: [],
        };
        const expectedUpdate: InventoryUpdate = {
            newOffers: [],
            soldOutItems: [permanentItem],
            priceUpdates: [
                {
                    item: outletItem,
                    oldPrice: outletItemDifferentPrice.price,
                    newPrice: outletItem.price,
                    isNew: false,
                    offerId: outletItem.offerId,
                },
            ],
        };
        assert.deepEqual(preproces(inputUpdate), expectedUpdate);
    });

    it('computes a price update and keeps other price updates', () => {
        const existingPriceUpdate: PriceUpdate = {
            item: permanentItem,
            oldPrice: 123,
            newPrice: permanentItem.price,
            isNew: false,
            offerId: permanentItem.offerId,
        };
        const inputUpdate: InventoryUpdate = {
            newOffers: [outletItem],
            soldOutItems: [outletItemDifferentPrice],
            priceUpdates: [existingPriceUpdate],
        };
        const expectedUpdate: InventoryUpdate = {
            newOffers: [],
            soldOutItems: [],
            priceUpdates: [
                existingPriceUpdate,
                {
                    item: outletItem,
                    oldPrice: outletItemDifferentPrice.price,
                    newPrice: outletItem.price,
                    isNew: false,
                    offerId: outletItem.offerId,
                },
            ],
        };
        assert.deepEqual(preproces(inputUpdate), expectedUpdate);
    });
});
