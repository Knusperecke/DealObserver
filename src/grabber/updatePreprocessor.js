'use strict';

function isSimilarOutletItem(newItem, oldItem) {
    if (newItem.permanent || oldItem.permanent) {
        return false;
    }

    if (newItem.id !== oldItem.id) {
        return false;
    }

    if (newItem.size !== oldItem.size) {
        return false;
    }

    return true;
}

function preproces({newOffers, soldOutItems, priceUpdates}) {
    newOffers = newOffers.filter((newItem) => {
        let isReallyNew = true;
        soldOutItems = soldOutItems.filter((soldItem) => {
            if (isReallyNew && isSimilarOutletItem(newItem, soldItem)) {
                isReallyNew = false;

                if (newItem.price !== soldItem.price) {
                    priceUpdates.push({item: newItem, oldPrice: soldItem.price, newPrice: newItem.price});
                }

                return false;
            }
            return true;
        });

        return isReallyNew;
    });

    return {
        newOffers, soldOutItems, priceUpdates
    }
}

module.exports = preproces