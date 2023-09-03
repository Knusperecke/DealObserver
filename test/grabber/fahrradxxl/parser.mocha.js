'use strict';

const Parser = require('../../../src/grabber/fahrradxxl/parser');
const assert = require('chai').assert;

describe('FahrradXXL parser', () => {
    it('Returns an empty array for empty input', () => {
        assert.deepEqual(Parser(''), []);
    });

    it('Grabs an item from the input', () => {
        const input = `<div itemscope="" itemtype="http://schema.org/Product" class="product et_sticky_limiter">
            <meta itemprop="brand" content="Radler">
            <meta itemprop="name" content="Buntes Rad mit vielen Klingeln">
            <div class="product__thumbnail product_thumbnail">
            <a data-idx="0" data-item="150383" title="Buntes Rad mit vielen Klingeln " class="product_thumbnail__link gtm__artikel-detail--image-detail">
                <span class="product_thumbnail__helper"></span>
                <img src="/img/large.jpg" srcset="/img/standard.jpg 1x,/img/large.jpg 2x" width="1259" height="805" alt="Buntes Rad mit vielen Klingeln" itemprop="image" class="product_thumbnail__media">
            </a>
            </div>
                'src': '/img/large.jpg',
                'thumb': '/img/thumb.jpg',
                'subHtml': 'Buntes Rad mit vielen Klingeln'
            <div class="product_prices">
                <div class="price-container">
                <div class="current-price">
                        1.999,- €
                </div>
                <div class="strike-price">
                        2.999,- €  
                </div>
            </div>
            </div>
            </div>`;

        const expectedItem = {
            name: 'Buntes Rad mit vielen Klingeln',
            id: 'buntes rad mit vielen klingeln',
            price: 1999,
            offerId: '150383',
            size: '*',
            modelYear: '0',
            permanent: false,
            url: 'https://www.fahrrad-xxl.de/img/large.jpg',
            smallImgUrl: 'https://www.fahrrad-xxl.de/img/standard.jpg',
            condition: 'NewCondition',
        };

        assert.deepEqual(Parser(input), [expectedItem]);
    });

    it('Grabs an item from newer form of input', () => {
        const input = `<div itemscope="" itemtype="http://schema.org/Product" class="product et_sticky_limiter">
            <meta itemprop="brand" content="Radler">
            <meta itemprop="name" content="Buntes Rad mit vielen Klingeln">
            <div class="product__thumbnail product_thumbnail">
            <a data-idx="0" data-item="150383" title="Buntes Rad mit vielen Klingeln " class="product_thumbnail__link gtm__artikel-detail--image-detail">
                <span class="product_thumbnail__helper"></span>
                <img width="1259" height="805" srcset="/img/standard.jpg 1x,/img/large.jpg 2x" src="/img/large.jpg" alt="Buntes Rad mit vielen Klingeln" itemprop="image" class="product_thumbnail__media">
            </a>            
            </div>
                'src': '/img/large.jpg',
                'thumb': '/img/thumb.jpg',
                'subHtml': 'Buntes Rad mit vielen Klingeln'
            <div class="product_prices">
                <div class="price-container">
                <div class="current-price">
                        1.999,- €
                </div>
                <div class="strike-price">
                        2.999,- €  
                </div>
            </div>
            </div>
            </div>`;

        const expectedItem = {
            name: 'Buntes Rad mit vielen Klingeln',
            id: 'buntes rad mit vielen klingeln',
            price: 1999,
            offerId: '150383',
            size: '*',
            modelYear: '0',
            permanent: false,
            url: 'https://www.fahrrad-xxl.de/img/large.jpg',
            smallImgUrl: 'https://www.fahrrad-xxl.de/img/standard.jpg',
            condition: 'NewCondition',
        };

        assert.deepEqual(Parser(input), [expectedItem]);
    });

    it('Aborts for incomplete data', () => {
        const input = `<div itemscope="" itemtype="http://schema.org/Product" class="product et_sticky_limiter">
        <meta itemprop="brand" content="Radler">
        <meta itemprop="name" content="Buntes Rad mit vielen Klingeln">
        <div class="product__thumbnail product_thumbnail">`;

        assert.throws(Parser.bind(Parser, input), 'Failed to parse an item');
    });
});
