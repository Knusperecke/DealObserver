'use strict';

function buildValuesString(historyIds, withBraces) {
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

function updateCurrent(promiseQuery, newHistoryIds) {
    let oldHistoryIds = [];

    return promiseQuery('SELECT historyId FROM current')
        .then((oldCurrentResult) => {
            oldHistoryIds = oldCurrentResult.map((result) => result.historyId);
        })
        .then(() => promiseQuery('DELETE FROM current'))
        .then(() => buildValuesString(newHistoryIds, true))
        .then((valuesString) => {
            if (valuesString !== '') {
                return promiseQuery('INSERT INTO current (historyId) VALUES ' + valuesString)
            }
        })
        .then(() => {
            const lostHistoryIds = [];
            oldHistoryIds.forEach((oldId) => {
                if (!newHistoryIds.includes(oldId)) {
                    lostHistoryIds.push(oldId);
                }
            });
            return lostHistoryIds;
        })
        .then((lostIds) => buildValuesString(lostIds, false))
        .then((valuesString) => {
            if (valuesString !== '') {
                return promiseQuery(
                    `SELECT models.name, models.nameId, models.modelYear, history.itemCondition,\n` +
                    `       history.isPermanent, history.size, history.lastSellerId, \n` +
                    `       history.lastUrl, history.lastSmallImgUrl, history.price\n` +
                    `FROM history\n` +
                    `INNER JOIN models ON models.modelId=history.modelId\n` +
                    `WHERE history.historyId IN (${valuesString})`);
            }
            return [];
        })
        .then((lostItemsQueryResult) => {
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
                    condition: result.itemCondition
                };
            });
        });
}

module.exports = updateCurrent;