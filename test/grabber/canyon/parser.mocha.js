'use strict';

const Parser = require('../../../src/grabber/canyon/parser');
const assert = require('chai').assert;

describe('Canyon parser', () => {
    it('Expects an object with "type" and "data"', () => {
        assert.deepEqual(Parser({type: 'outlet', data: ''}), []);
    });

    it('Handles parsing type "outlet"', () => {
        assert.deepEqual(Parser({type: 'outlet', data: ''}), []);
    });

    it('Handles parsing type "normalOffer"', () => {
        assert.deepEqual(Parser({type: 'normalOffer', data: ''}), []);
    });

    it('Throws for unexpected parsing types', () => {
        assert.throws(Parser.bind(Parser, {type: 'UnknownSpecials', data: ''}), 'Received unexpected parsing job');
    });

    it('Returns an empty array for empty input', () => {
        assert.deepEqual(Parser({type: 'outlet', data: ''}), []);
    });

    it('Grabs an outlet item from the input', () => {
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
            price: 2299,
            offerId: '000000000000111695',
            size: '|XL|',
            modelYear: '2017',
            permanent: false,
            url: 'https://www.canyon.com/img/outlet/22677_img_res.png',
            condition: 'NewCondition'
        };

        assert.deepEqual(Parser({type: 'outlet', data: input}), [expectedItem]);
    });

    it('Aborts for incomplete outlet data', () => {
        const input = '{\n' +
            '            , "name": "Speedmax CF 9.0"\n' +
            '                                        , "image": "/img/outlet/22677_img_res.png"\n' +
            '                                        , "sku": "000000000000111695"\n' +
            '                        , "brand": {\n' +
            '                "@type": "Brand"\n' +
            '                , "name": "Canyon"';

        assert.throws(Parser.bind(Parser, {type: 'outlet', data: input}), 'Failed parsing outlet data');
    });

    it('Grabs a normalOffer item from the input', () => {
        const input = '{\n' +
            '            "@context": "http://schema.org/"\n' +
            '            , "@type": "Product"\n' +
            '            , "name": "Aeroad CF SLX Disc 9.0 LTD"\n' +
            '                                        , "image": "https://static.canyon.com/_img/bikes/2018/aeroad-cf-slx-disc-9-ltd_c1105.png"\n' +
            '                                        , "sku": "000000000000001810"\n' +
            '                        , "brand": {\n' +
            '                "@type": "Brand"\n' +
            '                , "name": "Canyon"\n' +
            '            }\n' +
            '                                    , "offers": {\n' +
            '                "@type": "Offer"\n' +
            '                                    , "price": "6899.00"\n' +
            '                    , "priceCurrency": "EUR"\n' +
            '                                , "itemCondition": "http://schema.org/NewCondition"\n' +
            '                , "availability": "http://schema.org/InStock"             }\n' +
            '        }';

        const expectedItem = {
            name: 'Aeroad CF SLX Disc 9.0 LTD 2018',
            id: 'aeroad cf slx disc 9.0 ltd 2018',
            price: 6899,
            offerId: '000000000000001810',
            size: '*',
            modelYear: '2018',
            permanent: true,
            url: 'https://static.canyon.com/_img/bikes/2018/aeroad-cf-slx-disc-9-ltd_c1105.png',
            condition: 'NewCondition'
        };

        assert.deepEqual(Parser({type: 'normalOffer', data: input}), [expectedItem]);
    });
});