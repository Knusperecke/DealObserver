import { Item, ShopQueryResult } from '../../types.js';
import { log, warn } from '../../util/logger.js';

function parseForTargets(targets: ParsingTarget[], htmlBlob: string) {
    const results: { [key: string]: string[] } = {};
    targets.forEach(({ name: targetName }) => {
        results[targetName] = [];
    });

    targets.forEach(({ name, regexp, captureExpressionIndex }) => {
        const rawMatches = htmlBlob.matchAll(regexp);
        const matches: string[] = Array.from(rawMatches)
            .filter((match) => match.length > captureExpressionIndex)
            .map((match) => match[captureExpressionIndex])
            .map((match) => match.trim());
        results[name] = results[name].concat(matches);
    });

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
    regexp: RegExp;
    captureExpressionIndex: number;
}

function processOutletData(htmlBlob: string): Item[] {
    htmlBlob = htmlBlob
        .replaceAll('&quot;', '')
        .replaceAll('&eacute;', 'é')
        .replaceAll('&nbsp;', '')
        .replaceAll('\n', ' ');
    const targets: ParsingTarget[] = [
        {
            name: 'names',
            regexp: /data-gtm-impression=[^\]]*{name:([^,]*),/g,
            captureExpressionIndex: 1,
        },
        {
            name: 'prices',
            regexp: /data-gtm-impression=[^\]]*metric4:([^,]*),/g,
            captureExpressionIndex: 1,
        },
        {
            name: 'skus',
            regexp: /data-gtm-impression=[^\]]*feedProductId:([^,]*),/g,
            captureExpressionIndex: 1,
        },
        {
            name: 'years',
            regexp: /data-gtm-impression=[^\]]*dimension50:([^,]*),/g,
            captureExpressionIndex: 1,
        },
        { name: 'sizes', regexp: /Only available in ([^<]*)[<]/g, captureExpressionIndex: 1 },
        {
            name: 'urls',
            regexp: /productTileDefault__imageLink["][^h]*href="([^"]*)["]/g,
            captureExpressionIndex: 1,
        },
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
            size: results.sizes[index],
            modelYear: results.years[index],
            permanent: false,
            condition: 'outlet',
            url:
                'https://www.canyon.com' +
                results.urls[index]
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

function parseForSmallImgUrls(htmlBlob: string): string[] {
    const offerSections = htmlBlob.split(/ productTileDefault /g).slice(1);
    const smallImgUrls = offerSections.map((section) => {
        const parseForSmallImgResult = parseForTargets(
            [
                {
                    name: 'smallImgUrls',
                    regexp: /min-width: 1200px[^"]*"[^"]*srcset=["]([^"]*)["]/g,
                    captureExpressionIndex: 1,
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
    htmlBlob = htmlBlob.replaceAll('&quot;', '');
    const targets: ParsingTarget[] = [
        {
            name: 'names',
            regexp: /data-gtm-impression=.*{name:([^,]*),/g,
            captureExpressionIndex: 1,
        },
        {
            name: 'prices',
            regexp: /data-gtm-impression=.*metric4:([^,]*),/g,
            captureExpressionIndex: 1,
        },
        {
            name: 'skus',
            regexp: /data-gtm-impression=.*feedProductId:([^,]*),/g,
            captureExpressionIndex: 1,
        },
        {
            name: 'years',
            regexp: /productTileDefault__image.*images\/full\/full_([^_]*)_/g,
            captureExpressionIndex: 1,
        },
        {
            name: 'urls',
            regexp: /productTileDefault__image["][ ]src=["]([^"]*)["]/g,
            captureExpressionIndex: 1,
        },
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
