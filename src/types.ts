export interface DatabaseConfig {
    host: string;
    user: string;
    password: string;
    table: string;
    testTable: string;
}

export interface SlackConfig {
    notifierUserName: string;
    notifierEmoji: string;
    soldOutEmoji: string;
    errorEmoji: string;
    newsWebHook: string;
    newsChannelName: string;
    priceUpdatesWebHook: string;
    priceUpdatesChannelName: string;
    priceUpdatesOutletWebHook: string;
    priceUpdatesOutletChannelName: string;
    newOffersWebHook: string;
    newOffersChannelName: string;
    soldOutWebHook: string;
    soldOutChannelName: string;
    debugWebHook: string;
    debugChannelName: string;
}

export interface FahradXxlConfig {
    baseUrl: string;
    itemsToWatch: string[];
}

export interface Config {
    database: DatabaseConfig;
    slack: SlackConfig;
    fahrradxxl: FahradXxlConfig;
}

export interface Item {
    name: string;
    price: number;
    permanent: boolean;
    size: string;
    condition: string;
    smallImgUrl: string;
    url: string;
    offerId: string;
    id: string;
    modelYear: string;
}

export interface DatabaseOfferItem extends Item {
    itemId: number;
}

export interface DatabaseHistoryModelJoin {
    name: string;
    nameId: string;
    price: number;
    lastSellerId: string;
    size: string;
    modelYear: string;
    isPermanent: number;
    lastUrl: string;
    lastSmallImgUrl: string;
    itemCondition: string;
}

export interface DatabaseHistoryItem {
    historyId: string;
    price: number;
}

export interface DatabaseItemUpdate {
    item: Item;
    isNew: boolean;
    newPrice: number;
    oldPrice?: number;
    offerId: string;
}

export interface PriceUpdate extends DatabaseItemUpdate {
    oldPrice: number;
}

export interface ShopQueryResult {
    type: 'outlet' | 'normalOffer';
    data?: string;
}

export interface InventoryUpdate {
    newOffers: Item[];
    soldOutItems: Item[];
    priceUpdates: PriceUpdate[];
}
