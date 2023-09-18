import { Config, ShopQueryResult } from '../../types.js';
import { error, log } from '../../util/logger.js';
import axios from 'axios';

export function outlet(): Promise<ShopQueryResult>[] {
    const categories = ['Road', 'Triathlon'];
    const type = '&type=html';
    const baseUrl =
        'https://www.canyon.com/en-de/outlet-bikes/?prefn1=pc_welt&showFilters=false&format=ajax&srule=outlet_high_stock&searchredirect=false&searchType=bikes&start=0&sz=1000&prefv1=';

    return categories.map(async (category) => {
        const url = baseUrl + category + type;

        try {
            const queryResult = await axios.get(url, {
                headers: {
                    Referer:
                        'https://www.canyon.com/en-de/outlet-bikes/?searchType=bikes&srule=outlet_high_stock',
                },
            });
            log('Got data from remote url=', url);
            return {
                type: 'outlet',
                data: queryResult.data,
            } as ShopQueryResult;
        } catch (thrownError) {
            error('Failed to query url=', url);
            throw new Error(`Failed to query ${url} error ${JSON.stringify(thrownError)}`);
        }
    });
}

function normalOffers(): Promise<ShopQueryResult>[] {
    const baseUrl = 'https://www.canyon.com/en/';
    const subUrls = [
        'road/aeroad/',
        'road/ultimate/evo/',
        'road/ultimate/cf-slx/',
        'road/ultimate/cf-sl/',
        'road/ultimate/al-slx/',
        'road/endurace/cf-slx/',
        'road/endurace/cf-sl/',
        'road/endurace/cf/',
        'road/endurace/al/',
        'road/inflite/',
        'triathlon/speedmax/cf-slx/',
        'triathlon/speedmax/cf/',
    ];

    return subUrls.map(async (sub) => {
        const url = baseUrl + sub;

        try {
            const queryResult = await axios.get(url);
            log('Got data from remote url=', url);
            return {
                type: 'normalOffer',
                data: queryResult.data as string,
            } as ShopQueryResult;
        } catch {
            error('Failed to query url=', url);
            return { type: 'normalOffer', data: undefined } as ShopQueryResult;
        }
    });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function fetcherQueries(_config: Config): Promise<ShopQueryResult>[] {
    return outlet().concat(normalOffers());
}
