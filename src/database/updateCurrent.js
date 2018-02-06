'use strict';

function buildValuesString(historyIds) {
    let ret = '';
    historyIds.forEach((id) => {
        if (ret != '') {
            ret = ret + ', ';
        }
        ret = ret + `(${id})`;
    });

    return ret;
}

function updateCurrent(promiseQuery, historyIds) {
    return promiseQuery('DELETE FROM current').then(() => buildValuesString(historyIds)).then((valuesString) => {
        if (valuesString !== '') {
            return promiseQuery('INSERT INTO current (historyId) VALUES ' + buildValuesString(historyIds))
        }
    });
}

module.exports = updateCurrent;