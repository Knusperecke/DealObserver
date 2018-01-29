'use strict';

const Logger = require('../../util/logger');

function parseForTargets(targets, htmlBlob) {
    const results = {};
    targets.forEach(({name: targetName}) => {
        results[targetName] = [];
    });

    targets.forEach(({name, regexp}) => {
        let names = htmlBlob.match(new RegExp(regexp + '["|/]?[^"/]*["|/]', 'g')) || [];
        names = names.filter((name) => !name.includes('"Canyon"'));
        names = names.map((hit) => {
            return hit.replace(regexp, '').replace(/"/g, '').replace(/[/]/g, '').trim();
        });
        results[name] = results[name].concat(names);
    });

    const firstTarget = targets[0].name;

    Logger.log('Filtered canyon data ', firstTarget.name, '.length=', results[firstTarget].length);

    const targetLength = results[firstTarget].length;
    targets.forEach(({name: targetName}) => {
        if (results[targetName].length !== targetLength) {
            throw new Error(
                'Failed parsing outlet data ', firstTarget.name,
                '.length=', results[firstTarget].length + ' ' + targetName + '.length=' + results[targetName].length);
        }
    });

    return results;
}

function processOutletData(htmlBlob) {
    const targets = [
        {name: 'names', regexp: '"name": '}, {name: 'prices', regexp: '"price": '}, {name: 'skus', regexp: '"sku": '},
        {name: 'sizes', regexp: 'data-size='}, {name: 'years', regexp: 'data-year='}
    ];

    const results = parseForTargets(targets, htmlBlob);

    const returnValue = [];
    results.names.forEach((name, index) => {
        let finalName = name;
        if (!finalName.includes(results.years[index])) {
            finalName = finalName + ' ' + results.years[index];
        }

        returnValue.push({
            name: finalName,
            id: finalName.toLowerCase(),
            price: Number(results.prices[index]),
            offerId: results.skus[index],
            size: results.sizes[index],
            modelYear: results.years[index],
            permanent: false
        });
    });

    Logger.log('Parsed ' + returnValue.length + ' items, returning them');
    return returnValue;
}

function processNormalOffer(htmlBlob) {
    const targets = [
        {name: 'names', regexp: '"name": '}, {name: 'prices', regexp: '"price": '}, {name: 'skus', regexp: '"sku": '},
        {name: 'years', regexp: '_img/bikes'}
    ];

    const results = parseForTargets(targets, htmlBlob);

    const returnValue = [];
    results.names.forEach((name, index) => {
        let finalName = name;
        if (!finalName.includes(results.years[index])) {
            finalName = finalName + ' ' + results.years[index];
        }

        returnValue.push({
            name: finalName,
            id: finalName.toLowerCase(),
            price: Number(results.prices[index]),
            offerId: results.skus[index],
            size: '*',
            modelYear: results.years[index],
            permanent: true
        });
    });

    Logger.log('Parsed ' + returnValue.length + ' items, returning them');
    return returnValue;
}

function parse({type, data}) {
    switch (type) {
        case 'outlet':
            return processOutletData(data);
        case 'normalOffer':
            return processNormalOffer(data);
    }

    throw new Error('Received unexpected parsing job');
}

module.exports = parse;