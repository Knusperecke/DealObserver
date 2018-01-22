'use strict';

const Parser = require('../../../src/grabber/canyon/parser');
const assert = require('chai').assert;

describe('Canyon Parser', () => {
    it('Returns an empty array for empty input', () => {
        assert.deepEqual(Parser(''), []);
    });

    it('Grabs an item from the input', () => {
        const input = '{\n' +
            '            , "name": "Speedmax CF 9.0"\n' +
            '                                        , "image": "/img/outlet/22677_img_res.png"\n' +
            '                                        , "sku": "000000000000111695"\n' +
            '                        , "brand": {\n' +
            '                "@type": "Brand"\n' +
            '                , "name": "Canyon"\n' +
            '            }\n' +
            '                                    , "offers": {\n' +
            '                "@type": "Offer"\n' +
            '                                    , "price": "2299"\n' +
            '                    , "priceCurrency": "EUR"\n' +
            '                                , "itemCondition": "http://schema.org/NewCondition"\n' +
            '                , "availability": "http://schema.org/InStock"             }\n' +
            '        }\n' +
            '        ... data-size="|XL|" ...\n' +
            '        ... data-year="2017" ...';

        const expectedItem = {
            name: 'Speedmax CF 9.0 2017',
            id: 'speedmax cf 9.0 2017',
            price: '2299',
            offerId: '000000000000111695',
            size: '|XL|',
            modelYear: '2017'
        };

        assert.deepEqual(Parser(input), [expectedItem]);
    });

    it('Aborts for incomplete data', () => {
        const input = '{\n' +
            '            , "name": "Speedmax CF 9.0"\n' +
            '                                        , "image": "/img/outlet/22677_img_res.png"\n' +
            '                                        , "sku": "000000000000111695"\n' +
            '                        , "brand": {\n' +
            '                "@type": "Brand"\n' +
            '                , "name": "Canyon"';

        assert.throws(Parser.bind(Parser, input), 'Failed parsing outlet data, names.length=1 prices.length=0');
    });
});