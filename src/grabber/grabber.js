'use strict';

const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const HttpHelper = require('../util/httpHelper');

function pass() {
    /*
     * https://www.canyon.com/en/road/ultimate/f-ultimate-cf-sl-disc-me.html
     * -> value: '1499',
                currency: 'EUR',
                content_type: 'product',
                content_ids: ['000000000000001495']
     * -> <h4 class="modal-title" id="bike-name">
                    Ultimate CF SL Disc Frameset Mechanical
     */

    const categories = ['triathlon', 'road'];
    const type = '&type=html';
    const baseUrl = 'https://www.canyon.com/en/factory-outlet/ajax/articles.html?category='

    categories.forEach((category) => {
        const url = baseUrl + category + type
        HttpHelper.get(url, new XMLHttpRequest())
            .catch(() => {
                console.log('Failed to querry url=', url);
            })
            .then((result) => {
                console.log('Got data from remote url=', url);
                const items = processOutletData(result);
                console.log(items);
                // TODO go on here
            });
    });
}

function processOutletData(htmlBlob) {
    const targets = [
        {name: 'names', regexp: '"name": '}, {name: 'prices', regexp: '"price": '},
        {name: 'skus', regexp: '"sku": '}, {name: 'sizes', regexp: 'data-size='}
    ];

    const results = {names: [], prices: [], skus: [], sizes: []};

    targets.forEach(({name, regexp}) => {
        let names = htmlBlob.match(new RegExp(regexp + '".*"', 'g'));
        names = names.filter((name) => !name.includes('"Canyon"'));
        names = names.map((hit) => {
            return hit.replace(regexp, '').replace(/"/g, '').trim();
        });
        results[name] = results[name].concat(names);
    });

    console.log(
        'Filtered outlet data names.length=', results.names.length, ' prices.length=', results.prices.length,
        ' skus.length=', results.skus.length, 'sizes.length=', results.sizes.length);

    const targetLength = results.names.length;
    targets.forEach(({name}) => {
        if (results[name].length !== targetLength) {
            throw new Error(
                'Failed parsing outlet data, names.length=' + targetLength + ' ' + name +
                '.length=' + results[name].length);
        }
    });

    const returnValue = [];
    results.names.forEach((name, index) => {
        returnValue.push(
            {name: name, price: results.prices[index], sku: results.skus[index], size: results.sizes[index]});
    });

    console.log('Parsed ' + returnValue.length + ' items, returning them');
    return returnValue;
}

pass();