import { Item, ShopQueryResult } from '../../types.js';
import { log, warn } from '../../util/logger.js';

function parseForTargets(targets: ParsingTarget[], htmlBlob: string) {
    const results: { [key: string]: string[] } = {};
    targets.forEach(({ name: targetName }) => {
        results[targetName] = [];
    });

    targets.forEach(
        ({ name, regexp, keepSlashes, matchWhat = '[^"/]', endDelimiter = '["|/]' }) => {
            const rawNames = htmlBlob.match(
                new RegExp(regexp + `["|/]?${matchWhat}*${endDelimiter}`, 'g'),
            );
            const filteredNames =
                rawNames?.filter((name) => !name.match('"[Cc][Aa][Nn][Yy][Oo][Nn]"')) || [];
            const names = filteredNames.map((hit) => {
                let temp = hit.replace(regexp, '').replace(/"/g, '');

                if (!keepSlashes) {
                    temp = temp.replace(/[/]/g, '');
                }

                return temp.trim();
            });
            results[name] = results[name].concat(names);
        },
    );

    const firstTarget = targets[0].name;

    // Hack to filter out gadgets
    if (results['years'] && results['urls'] && results['years'].length == results['urls'].length) {
        targets.forEach(({ name: targetName }) => {
            results[targetName].splice(results['years'].length);
        });
    }

    log(`Filtered canyon data: ${firstTarget}.length=${results[firstTarget].length}`);

    const targetLength = results[firstTarget].length;
    targets.forEach(({ name: targetName }) => {
        const message = `Failed parsing outlet data ${firstTarget}.length=${targetLength} ${targetName}.length=${results[targetName].length}`;
        if (results[targetName].length > targetLength) {
            warn(message);
        } else if (results[targetName].length < targetLength) {
            throw new Error(message);
        }
    });

    return results;
}

interface ParsingTarget {
    name: string;
    regexp: string;
    keepSlashes?: boolean;
    matchWhat?: string;
    endDelimiter?: string;
}

function processOutletData(htmlBlob: string): Item[] {
    const targets: ParsingTarget[] = [
        { name: 'names', regexp: ', "name": ' },
        { name: 'prices', regexp: '"price": ' },
        { name: 'skus', regexp: '"sku": ' },
        { name: 'sizes', regexp: 'data-size=' },
        { name: 'years', regexp: 'data-year=' },
        { name: 'conditions', regexp: 'itemCondition": "http://schema.org' },
        { name: 'urls', regexp: '"image": "[^"]*"', keepSlashes: true },
        {
            name: 'smallImgUrls',
            regexp: '1199w, ',
            keepSlashes: true,
            matchWhat: '[^ ]',
            endDelimiter: '[ ]',
        },
    ];

    const results = parseForTargets(targets, htmlBlob);

    const returnValue: Item[] = [];
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
            permanent: false,
            condition: results.conditions[index],
            url:
                'https://www.canyon.com' +
                results.urls[index]
                    .replace('image: ', '')
                    .replace('\n', '')
                    .replace(',', '')
                    .trim(),
            smallImgUrl: results.smallImgUrls[index],
        });
    });

    log('Parsed ' + returnValue.length + ' items, returning them');
    return returnValue;
}

function parseForSmallImgUrls(htmlBlob: string): string[] {
    const singleLineBlob = htmlBlob.replace(/[\r]?\n/g, ' ');
    const offerSections = singleLineBlob.split(/"image": "/g).slice(1);
    const smallImgUrls = offerSections.map((section) => {
        const parseForSmallImgResult = parseForTargets(
            [
                {
                    name: 'smallImgUrls',
                    regexp: '1199w, ',
                    keepSlashes: true,
                    matchWhat: '[^ ]',
                    endDelimiter: '[ ]',
                },
            ],
            section,
        );
        const smallImgUrls = parseForSmallImgResult.smallImgUrls;
        if (smallImgUrls.length < 1) {
            throw new Error('Could not find small img in section');
        }
        return smallImgUrls[0];
    });

    return smallImgUrls;
}

function processNormalOffer(htmlBlob: string) {
    const targets = [
        { name: 'names', regexp: ', "name": ' },
        { name: 'prices', regexp: '"price": ' },
        { name: 'skus', regexp: '"sku": ' },
        { name: 'years', regexp: 'img/bikes' },
        { name: 'urls', regexp: '"image": "[^"]*"', keepSlashes: true },
    ];

    const results = parseForTargets(targets, htmlBlob);
    const smallImgUrls = parseForSmallImgUrls(htmlBlob);

    const returnValue: Item[] = [];
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
            permanent: true,
            condition: 'NewCondition',
            url: results.urls[index]
                .replace('image: ', '')
                .replace('\n', '')
                .replace(',', '')
                .trim(),
            smallImgUrl: smallImgUrls[index],
        });
    });

    log('Parsed ' + returnValue.length + ' items, returning them');
    return returnValue;
}

export function parse({ type, data }: ShopQueryResult): Item[] {
    if (!data) {
        return [];
    }

    switch (type) {
        case 'outlet':
            return processOutletData(data);
        case 'normalOffer':
            return processNormalOffer(data);
    }
}
