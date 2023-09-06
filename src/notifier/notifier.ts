import axios from 'axios';
import { Config, PriceUpdate, Item } from '../types.js';
import { log } from '../util/logger.js';

function addPluralS(count: number): string {
    return count > 1 ? 's' : '';
}

function sentenice(expressions: string[]): string {
    let ret = '';
    expressions.forEach((expression, index) => {
        ret = ret + expression;

        if (index + 2 === expressions.length) {
            ret = ret + ' and ';
        } else if (index + 2 < expressions.length) {
            ret = ret + ', ';
        }
    });
    return ret;
}

async function postNewsEntry(
    numNewOffers: number,
    numPriceUpdates: number,
    numSoldOutItems: number,
    config: Config,
): Promise<void> {
    if (
        config.slack.newsChannelName === '' ||
        (numNewOffers === 0 && numPriceUpdates === 0 && numSoldOutItems === 0)
    ) {
        return;
    }

    const pieces = [];
    if (numNewOffers > 0) {
        pieces.push(`*${numNewOffers}* new offer${addPluralS(numNewOffers)}`);
    }
    if (numPriceUpdates > 0) {
        pieces.push(`*${numPriceUpdates}* updated price${addPluralS(numPriceUpdates)}`);
    }
    if (numSoldOutItems > 0) {
        pieces.push(`*${numSoldOutItems}* item${addPluralS(numSoldOutItems)} sold out`);
    }

    const text = '*Update:* ' + sentenice(pieces);

    await axios.post(config.slack.newsWebHook, {
        channel: config.slack.newsChannelName,
        username: config.slack.notifierUserName,
        text: text.trim(),
        icon_emoji: config.slack.notifierEmoji,
    });
}

async function postSoldOutItems(soldOutItems: Item[], config: Config): Promise<void> {
    if (config.slack.soldOutChannelName === '') {
        return;
    }

    const promises = soldOutItems.map((item) => {
        let attachmentText = `~${item.name}~ for ~${item.price} EUR~`;

        if (item.permanent === false) {
            attachmentText = attachmentText + ` size ${item.size} condition ${item.condition}`;
        }

        return axios.post(config.slack.soldOutWebHook, {
            channel: config.slack.soldOutChannelName,
            username: config.slack.notifierUserName,
            text: 'Sold out:',
            icon_emoji: config.slack.soldOutEmoji,
            attachments: [
                {
                    color: '#FF8888',
                    text: attachmentText,
                    image_url: item.smallImgUrl || '',
                    footer: '=> ' + item.url || '',
                },
            ],
        });
    });

    await Promise.all(promises);
}

async function postNewOffers(newOffers: Item[], config: Config): Promise<void> {
    if (config.slack.newOffersChannelName === '') {
        return;
    }

    const promises = newOffers.map((item) => {
        const text = item.permanent === true ? 'New offer:' : 'New unique offer:';

        let attachmentText = `*${item.name}* for *${item.price}* EUR`;

        if (item.permanent === false) {
            attachmentText = attachmentText + ` size *${item.size}* condition *${item.condition}*`;
        }

        return axios.post(config.slack.newOffersWebHook, {
            channel: config.slack.newOffersChannelName,
            username: config.slack.notifierUserName,
            text: text.trim(),
            icon_emoji: config.slack.notifierEmoji,
            attachments: [
                {
                    color: '#88FF88',
                    text: attachmentText,
                    image_url: item.smallImgUrl || '',
                    footer: '=> ' + item.url || '',
                },
            ],
        });
    });

    await Promise.all(promises);
}

async function postPriceUpdates(priceUpdates: PriceUpdate[], config: Config): Promise<void> {
    const promises = priceUpdates.map(({ item, oldPrice, newPrice }) => {
        const webHookToUse =
            item.permanent === true
                ? config.slack.priceUpdatesWebHook
                : config.slack.priceUpdatesOutletWebHook;
        const channelNameToUse =
            item.permanent === true
                ? config.slack.priceUpdatesChannelName
                : config.slack.priceUpdatesOutletChannelName;

        if (webHookToUse === '') {
            return;
        }

        const text = 'Price change:';

        const sign = oldPrice > newPrice ? '-' : '+';
        const attachmentText =
            '_' +
            item.name +
            '_ in ' +
            item.size +
            ' *' +
            sign +
            Math.abs(100 - (newPrice * 100) / oldPrice).toFixed(2) +
            '%*';

        return axios.post(webHookToUse, {
            channel: channelNameToUse,
            username: config.slack.notifierUserName,
            text: text.trim(),
            icon_emoji: config.slack.notifierEmoji,
            attachments: [
                {
                    color: '#8888FF',
                    text: attachmentText,
                    image_url: item.smallImgUrl || '',
                    footer: '=> ' + item.url || '',
                    fields: [
                        { title: 'New', value: newPrice, short: true },
                        { title: 'Old', value: oldPrice, short: true },
                    ],
                },
            ],
        });
    });

    await Promise.all(promises);
}

export function notify({
    newOffers,
    priceUpdates,
    soldOutItems,
    justSummary,
    config,
}: {
    newOffers: Item[];
    priceUpdates: PriceUpdate[];
    soldOutItems: Item[];
    justSummary: boolean;
    config: Config;
}) {
    return postNewsEntry(newOffers.length, priceUpdates.length, soldOutItems.length, config)
        .then(async () => {
            if (!justSummary) {
                await postSoldOutItems(soldOutItems, config);
                await postNewOffers(newOffers, config);
                await postPriceUpdates(priceUpdates, config);
            }
        })
        .then(() => log('Finished notification handling'));
}
