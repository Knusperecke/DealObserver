'use strict';

const Logger = require('../../util/logger');

function processOutletData(htmlBlob) {
    const targets = [
        {name: 'names', regexp: '"name": '}, {name: 'prices', regexp: '"price": '}, {name: 'skus', regexp: '"sku": '},
        {name: 'sizes', regexp: 'data-size='}, {name: 'years', regexp: 'data-year='}
    ];

    const results = {names: [], prices: [], skus: [], sizes: [], years: []};

    targets.forEach(({name, regexp}) => {
        let names = htmlBlob.match(new RegExp(regexp + '".*"', 'g')) || [];
        names = names.filter((name) => !name.includes('"Canyon"'));
        names = names.map((hit) => {
            return hit.replace(regexp, '').replace(/"/g, '').trim();
        });
        results[name] = results[name].concat(names);
    });

    Logger.log('Filtered outlet data names.length=', results.names.length);

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
        let finalName = name;
        if (!finalName.includes(results.years[index])) {
            finalName = finalName + ' ' + results.years[index];
        }

        returnValue.push({
            name: finalName,
            id: finalName.toLowerCase(),
            price: results.prices[index],
            offerId: results.skus[index],
            size: results.sizes[index],
            modelYear: results.years[index]
        });
    });

    Logger.log('Parsed ' + returnValue.length + ' items, returning them');
    return returnValue;
}

function parse(blob) {
    return processOutletData(blob);
}

module.exports = parse;