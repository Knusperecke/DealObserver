'use strict';

const UpdatePreprocessor = require('../../../src/grabber/canyon/updatePreprocessor');
const assert = require('chai').assert;

const emptyUpdate = {
    newOffers: [],
    soldOutItems: [],
    priceUpdates: []
};

const permanentItem = {
    name: 'Bike 2017',
    id: 'Bike 2017',
    price: 1000,
    offerId: '42',
    size: '|M|',
    modelYear: '2017',
    permanent: true,
    url: 'someUrl',
    smallImgUrl: 'someOtherUrl',
    condition: 'broken'
};

const outletItem = {
    name: 'Bike',
    id: 'Bike 2017',
    price: 1000,
    offerId: '42',
    size: '|M|',
    modelYear: '2017',
    permanent: false,
    url: 'someUrl',
    smallImgUrl: 'someOtherUrl',
    condition: 'broken'
};

const outletItemDifferentCondition = {
    name: 'Bike',
    id: 'Bike 2017',
    price: 1000,
    offerId: '42',
    size: '|M|',
    modelYear: '2017',
    permanent: false,
    url: 'someUrl',
    smallImgUrl: 'someOtherUrl',
    condition: 'new'
};

const outletItemDifferentSize = {
    name: 'Bike',
    id: 'Bike 2017',
    price: 1000,
    offerId: '42',
    size: '|XXXXL|',
    modelYear: '2017',
    permanent: false,
    url: 'someUrl',
    smallImgUrl: 'someOtherUrl',
    condition: 'broken'
};

const outletItemDifferentName = {
    name: 'Another Bike',
    id: 'Another Bike 2017',
    price: 1000,
    offerId: '42',
    size: '|M|',
    modelYear: '2017',
    permanent: false,
    url: 'someUrl',
    smallImgUrl: 'someOtherUrl',
    condition: 'broken'
};

const outletItemDifferentPrice = {
    name: 'Bike',
    id: 'Bike 2017',
    price: 999,
    offerId: '42',
    size: '|M|',
    modelYear: '2017',
    permanent: false,
    url: 'someUrl',
    smallImgUrl: 'someOtherUrl',
    condition: 'broken'
};

describe('Canyon Preprocessor for Notifier Updates', () => {
    it('Expects an object with "newOffers", "soldOutItems", and "priceUpdates"', () => {
        assert.deepEqual(UpdatePreprocessor(emptyUpdate), emptyUpdate);
    });

    it('Does not do anything for new permanent items', () => {
        const expectedUpdate = {newOffers: [permanentItem], soldOutItems: [], priceUpdates: []};
        assert.deepEqual(UpdatePreprocessor(expectedUpdate), expectedUpdate);
    });

    it('Does not do anything for sold out permanent items', () => {
        const expectedUpdate = {newOffers: [], soldOutItems: [permanentItem], priceUpdates: []};
        assert.deepEqual(UpdatePreprocessor(expectedUpdate), expectedUpdate);
    });

    it('Does not do anything for a permanent new offers that is equal permanent sold out item', () => {
        const expectedUpdate = {newOffers: [permanentItem], soldOutItems: [permanentItem], priceUpdates: []};
        assert.deepEqual(UpdatePreprocessor(expectedUpdate), expectedUpdate);
    });

    it('Removes the update if the item is both in newOffers and soldOutItems', () => {
        const inputUpdate = {newOffers: [outletItem], soldOutItems: [outletItem], priceUpdates: []};
        assert.deepEqual(UpdatePreprocessor(inputUpdate), emptyUpdate);
    });

    it('Removes the update if the item is both in newOffers and soldOutItems, even if it is in a different condition (condition from server can vary)',
       () => {
           const inputUpdate = {
               newOffers: [outletItem],
               soldOutItems: [outletItemDifferentCondition],
               priceUpdates: []
           };
           assert.deepEqual(UpdatePreprocessor(inputUpdate), emptyUpdate);
       });

    it('Does not remove an update if the size of the item is different', () => {
        const expectedUpdate = {newOffers: [outletItem], soldOutItems: [outletItemDifferentSize], priceUpdates: []};
        assert.deepEqual(UpdatePreprocessor(expectedUpdate), expectedUpdate);
    });

    it('Does not remove an update if the name of the item is different', () => {
        const expectedUpdate = {newOffers: [outletItem], soldOutItems: [outletItemDifferentName], priceUpdates: []};
        assert.deepEqual(UpdatePreprocessor(expectedUpdate), expectedUpdate);
    });

    it('Computes a price update if the item is both in newOffers and soldOutItems, but with different price', () => {
        const inputUpdate = {newOffers: [outletItem], soldOutItems: [outletItemDifferentPrice], priceUpdates: []};
        const expectedUpdate = {
            newOffers: [],
            soldOutItems: [],
            priceUpdates: [{item: outletItem, oldPrice: outletItemDifferentPrice.price, newPrice: outletItem.price}]
        };
        assert.deepEqual(UpdatePreprocessor(inputUpdate), expectedUpdate);
    });

    it('Computes multiple price updates', () => {
        const inputUpdate = {
            newOffers: [outletItem, outletItem],
            soldOutItems: [outletItemDifferentPrice, outletItemDifferentPrice],
            priceUpdates: []
        };
        const expectedUpdate = {
            newOffers: [],
            soldOutItems: [],
            priceUpdates: [
                {item: outletItem, oldPrice: outletItemDifferentPrice.price, newPrice: outletItem.price},
                {item: outletItem, oldPrice: outletItemDifferentPrice.price, newPrice: outletItem.price}
            ]
        };
        assert.deepEqual(UpdatePreprocessor(inputUpdate), expectedUpdate);
    });

    it('Computes a price update and keeps other new offers', () => {
        const inputUpdate = {
            newOffers: [permanentItem, outletItem],
            soldOutItems: [outletItemDifferentPrice],
            priceUpdates: []
        };
        const expectedUpdate = {
            newOffers: [permanentItem],
            soldOutItems: [],
            priceUpdates: [{item: outletItem, oldPrice: outletItemDifferentPrice.price, newPrice: outletItem.price}]
        };
        assert.deepEqual(UpdatePreprocessor(inputUpdate), expectedUpdate);
    });

    it('Computes a price update and keeps other sold out items', () => {
        const inputUpdate = {
            newOffers: [outletItem],
            soldOutItems: [outletItemDifferentPrice, permanentItem],
            priceUpdates: []
        };
        const expectedUpdate = {
            newOffers: [],
            soldOutItems: [permanentItem],
            priceUpdates: [{item: outletItem, oldPrice: outletItemDifferentPrice.price, newPrice: outletItem.price}]
        };
        assert.deepEqual(UpdatePreprocessor(inputUpdate), expectedUpdate);
    });

    it('Computes a price update and keeps other price updates', () => {
        const existingPriceUpdate = {item: permanentItem, oldPrice: 123, newPrice: permanentItem.price};
        const inputUpdate = {
            newOffers: [outletItem],
            soldOutItems: [outletItemDifferentPrice],
            priceUpdates: [existingPriceUpdate]
        };
        const expectedUpdate = {
            newOffers: [],
            soldOutItems: [],
            priceUpdates: [
                existingPriceUpdate,
                {item: outletItem, oldPrice: outletItemDifferentPrice.price, newPrice: outletItem.price}
            ]
        };
        assert.deepEqual(UpdatePreprocessor(inputUpdate), expectedUpdate);
    });
});