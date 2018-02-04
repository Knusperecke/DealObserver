'use strict';

function pushItem(item) {
    return {item, isNew: false, oldPrice: 0, newPrice: 0};
}

function push(connection, items) {
    return Promise
        .all(items.map((item) => {
            return pushItem(item);
        }))
        .then((updates) => {
            const newOffers = [];
            const priceUpdats = [];

            updates.forEach((update) => {
                if (update.isNew) {
                    newOffers.push(update.item);
                }

                if (update.oldPrice && update.oldPrice != update.newPrice) {
                    priceUpdats.push(update);
                }
            });

            return {newOffers, priceUpdats};
        });
}

module.exports = push;