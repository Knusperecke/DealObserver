import { Item, PriceUpdate } from '../types.js';

function isSimilarOutletItem(newItem: Item, oldItem: Item): boolean {
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

export interface InventoryUpdate {
  newOffers: Item[];
  soldOutItems: Item[];
  priceUpdates: PriceUpdate[];
}

export function preproces({
  newOffers,
  soldOutItems,
  priceUpdates,
}: InventoryUpdate): InventoryUpdate {
  newOffers = newOffers.filter((newItem) => {
    let isReallyNew = true;
    soldOutItems = soldOutItems.filter((soldItem) => {
      if (isReallyNew && isSimilarOutletItem(newItem, soldItem)) {
        isReallyNew = false;

        if (newItem.price !== soldItem.price) {
          priceUpdates.push({
            item: newItem,
            oldPrice: soldItem.price,
            newPrice: newItem.price,
            isNew: false,
            offerId: newItem.offerId,
          });
        }

        return false;
      }
      return true;
    });

    return isReallyNew;
  });

  return {
    newOffers,
    soldOutItems,
    priceUpdates,
  };
}
