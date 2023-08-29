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

function addNewItem(
  query: DatabaseInterface['query'],
  item: Item,
  modelId: string,
  permanent: boolean,
): Promise<DatabaseItemUpdate[]> {
  const dateTime = getSqlDateTime();
  return query(
    `INSERT INTO history (modelId, itemCondition, isPermanent, size, price, durationFrom, durationTo,` +
      `                     lastSellerId, lastUrl, lastSmallImgUrl)\n` +
      `  VALUES(${modelId}, '${item.condition}', ${permanent}, '${item.size}', ${item.price}, ` +
      `         '${dateTime}', '${dateTime}', '${item.offerId}', '${item.url}', '${item.smallImgUrl}');\n` +
      'SELECT LAST_INSERT_ID() AS id',
  ).then((insertQueryResult: { id: string }[][]) => {
    const historyId = insertQueryResult[1][0].id;
    log(`Added new history item id=${historyId}`);
    return [{ item, isNew: true, newPrice: item.price, offerId: historyId }];
  });
}

function updateExistingOffer(
  query: DatabaseInterface['query'],
  item: Item,
  modelId: string,
  historyId: string,
) {
  const currentDateTime = getSqlDateTime();
  return query(
    `SELECT price\n` + `FROM history\n` + `WHERE historyId=${historyId}`,
  )
    .then(
      (priceQueryResult: DatabaseHistoryItem[]) => priceQueryResult[0].price,
    )
    .then((oldPrice) => {
      return query(
        `UPDATE history\n` +
          `SET durationTo='${currentDateTime}', lastSellerId='${item.offerId}', lastUrl='${item.url}',` +
          `    price=${item.price}, lastSmallImgUrl='${item.smallImgUrl}'\n` +
          `WHERE historyId=${historyId}\n`,
      ).then(() => {
        log(`Updated item historyId=${historyId}`);
        return {
          item,
          isNew: false,
          oldPrice: oldPrice,
          newPrice: item.price,
          offerId: historyId,
        };
      });
    });
}

function pushItem(
  query: DatabaseInterface['query'],
  item: Item,
): Promise<DatabaseItemUpdate[]> {
  return query(
    `SELECT modelId FROM models WHERE nameId='${item.id}' AND modelYear=${item.modelYear}`,
  )
    .then((modelQueryResult: DatabaseOfferItem[]) => {
      if (modelQueryResult.length) {
        return modelQueryResult[0].modelId;
      }

      log(`Adding new model ${item.name}`);
      return query(
        `INSERT INTO models (name, nameId, modelYear) VALUES ('${item.name}', '${item.id}', ${item.modelYear}); SELECT LAST_INSERT_ID() AS id`,
      ).then((insertQueryResult: { id: string }[][]) => {
        return insertQueryResult[1][0].id;
      });
    })
    .then((modelId) => {
      const permanent = item.permanent == true ? 1 : 0;

      return query(
        `SELECT current.historyId\n` +
          `FROM current\n` +
          `INNER JOIN history ON current.historyId=history.historyId\n` +
          `WHERE history.modelId=${modelId}\n` +
          `  AND history.isPermanent=${permanent}\n` +
          `  AND (history.isPermanent=1 OR history.price=${item.price})\n` +
          `  AND history.size='${item.size}'`,
      ).then((historyQueryResult: DatabaseHistoryItem[]) => {
        return { historyQueryResult, modelId, permanent };
      });
    })
    .then(({ historyQueryResult, modelId, permanent }) => {
      if (historyQueryResult.length) {
        return Promise.all(
          historyQueryResult.map((result) =>
            updateExistingOffer(query, item, modelId, result.historyId),
          ),
        );
      }

      return addNewItem(query, item, modelId, !!permanent);
    });
}

export interface PushResult {
  newOffers: Item[];
  priceUpdates: PriceUpdate[];
  offerIds: string[];
}

export function push(
  query: DatabaseInterface['query'],
  items: Item[],
): Promise<PushResult> {
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
