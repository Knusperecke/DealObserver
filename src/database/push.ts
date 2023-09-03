import {
    DatabaseOfferItem,
    DatabaseHistoryItem,
    Item,
    PriceUpdate,
    DatabaseItemUpdate,
} from '../types.js';
import { log } from '../util/logger.js';
import { DatabaseInterface } from './database.js';

function getSqlDateTime(): string {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

async function addNewItem(
    query: DatabaseInterface['query'],
    item: Item,
    itemId: number,
    permanent: boolean,
): Promise<DatabaseItemUpdate[]> {
    const dateTime = getSqlDateTime();
    const insertQueryResult = (await query(
        `INSERT INTO history (itemId, itemCondition, isPermanent, size, price, durationFrom, durationTo,` +
            `                     lastSellerId, lastUrl, lastSmallImgUrl)\n` +
            `  VALUES(${itemId}, '${item.condition}', ${permanent}, '${item.size}', ${item.price}, ` +
            `         '${dateTime}', '${dateTime}', '${item.offerId}', '${item.url}', '${item.smallImgUrl}');\n` +
            'SELECT LAST_INSERT_ID() AS id',
    )) as { id: string }[][];

    const historyId = insertQueryResult[1][0].id;
    log(`Added new history item id=${historyId}`);
    return [{ item, isNew: true, newPrice: item.price, offerId: historyId }];
}

async function updateExistingOffer(
    query: DatabaseInterface['query'],
    item: Item,
    itemId: number,
    historyId: string,
) {
    const currentDateTime = getSqlDateTime();
    const priceQueryResult = (await query(
        `SELECT price\n` + `FROM history\n` + `WHERE historyId=${historyId}`,
    )) as DatabaseHistoryItem[];
    const oldPrice = priceQueryResult[0].price;
    await query(
        `UPDATE history\n` +
            `SET durationTo='${currentDateTime}', lastSellerId='${item.offerId}', lastUrl='${item.url}',` +
            `    price=${item.price}, lastSmallImgUrl='${item.smallImgUrl}'\n` +
            `WHERE historyId=${historyId}\n`,
    );

    log(`Updated item historyId=${historyId}`);
    return {
        item,
        isNew: false,
        oldPrice: oldPrice,
        newPrice: item.price,
        offerId: historyId,
    };
}

async function pushItem(
    query: DatabaseInterface['query'],
    item: Item,
): Promise<DatabaseItemUpdate[]> {
    const modelQueryResult = (await query(
        `SELECT itemId FROM items WHERE nameId='${item.id}' AND modelYear=${item.modelYear}`,
    )) as DatabaseOfferItem[];

    let itemId: number;
    if (modelQueryResult.length) {
        itemId = modelQueryResult[0].itemId;
    } else {
        log(`Adding new model ${item.name}`);
        const insertQueryResult = (await query(
            `INSERT INTO items (name, nameId, modelYear) VALUES ('${item.name}', '${item.id}', ${item.modelYear}); SELECT LAST_INSERT_ID() AS id`,
        )) as { id: number }[][];
        itemId = insertQueryResult[1][0].id;
    }
    const permanent = item.permanent == true ? 1 : 0;

    const historyQueryResult = (await query(
        `SELECT current.historyId\n` +
            `FROM current\n` +
            `INNER JOIN history ON current.historyId=history.historyId\n` +
            `WHERE history.itemId=${itemId}\n` +
            `  AND history.isPermanent=${permanent}\n` +
            `  AND (history.isPermanent=1 OR history.price=${item.price})\n` +
            `  AND history.size='${item.size}'`,
    )) as DatabaseHistoryItem[];

    if (historyQueryResult.length) {
        return Promise.all(
            historyQueryResult.map((result) =>
                updateExistingOffer(query, item, itemId, result.historyId),
            ),
        );
    }

    return addNewItem(query, item, itemId, !!permanent);
}

export interface PushResult {
    newOffers: Item[];
    priceUpdates: PriceUpdate[];
    offerIds: string[];
}

export function push(query: DatabaseInterface['query'], items: Item[]): Promise<PushResult> {
    const newOffers: Item[] = [];
    const priceUpdates: PriceUpdate[] = [];
    const offerIds: string[] = [];

    let promise = Promise.resolve();

    items.forEach((item) => {
        promise = promise
            .then(() => pushItem(query, item))
            .then((updates) => {
                updates.forEach((update) => {
                    if (update.isNew) {
                        newOffers.push(update.item);
                    }

                    if (update.oldPrice && update.oldPrice != update.newPrice) {
                        priceUpdates.push({ ...update, oldPrice: update.oldPrice });
                    }

                    if (!offerIds.includes(update.offerId)) {
                        offerIds.push(update.offerId);
                    }
                });
            });
    });

    return promise.then(() => {
        return { newOffers, priceUpdates, offerIds };
    });
}
