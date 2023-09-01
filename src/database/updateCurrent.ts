import { DatabaseHistoryModelJoin, Item } from '../types.js';
import { DatabaseInterface } from './database.js';

function buildValuesString(historyIds: string[], withBraces: boolean): string {
  let ret = '';
  const leftBrace = withBraces ? '(' : '';
  const rightBrace = withBraces ? ')' : '';
  historyIds.forEach((id) => {
    if (ret != '') {
      ret = ret + ', ';
    }
    ret = ret + `${leftBrace}${id}${rightBrace}`;
  });

  return ret;
}

export async function updateCurrent(
  query: DatabaseInterface['query'],
  newHistoryIds: string[],
): Promise<Item[]> {
  let oldHistoryIds: string[] = [];

  const oldCurrentResult = (await query('SELECT historyId FROM current')) as {
    historyId: string;
  }[];
  oldHistoryIds = oldCurrentResult.map((result) => result.historyId);
  await query('DELETE FROM current');
  const valuesString = buildValuesString(newHistoryIds, true);
  if (valuesString !== '') {
    await query('INSERT INTO current (historyId) VALUES ' + valuesString);
  }
  const lostHistoryIds: string[] = [];
  oldHistoryIds.forEach((oldId) => {
    if (!newHistoryIds.includes(oldId)) {
      lostHistoryIds.push(oldId);
    }
  });
  const lostValuesString = buildValuesString(lostHistoryIds, false);
  let lostItemsQueryResult: DatabaseHistoryModelJoin[] = [];
  if (lostValuesString !== '') {
    lostItemsQueryResult = (await query(
      `SELECT items.name, items.nameId, items.modelYear, history.itemCondition,\n` +
        `       history.isPermanent, history.size, history.lastSellerId, \n` +
        `       history.lastUrl, history.lastSmallImgUrl, history.price\n` +
        `FROM history\n` +
        `INNER JOIN items ON items.itemId=history.itemId\n` +
        `WHERE history.historyId IN (${lostValuesString})`,
    )) as DatabaseHistoryModelJoin[];
  }
  return lostItemsQueryResult.map((result) => {
    return {
      name: result.name,
      id: result.nameId,
      price: result.price,
      offerId: result.lastSellerId,
      size: result.size,
      modelYear: result.modelYear.toString(),
      permanent: result.isPermanent === 1 ? true : false,
      url: result.lastUrl,
      smallImgUrl: result.lastSmallImgUrl,
      condition: result.itemCondition,
    };
  });
}
