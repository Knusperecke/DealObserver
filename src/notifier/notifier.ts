import { Config, PriceUpdate, Item } from '../types.js';
import { HttpPostFunction, post } from '../util/httpHelper.js';
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
  HttpPost: HttpPostFunction,
): Promise<string> {
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
    pieces.push(
      `*${numPriceUpdates}* updated price${addPluralS(numPriceUpdates)}`,
    );
  }
  if (numSoldOutItems > 0) {
    pieces.push(
      `*${numSoldOutItems}* item${addPluralS(numSoldOutItems)} sold out`,
    );
  }

  const text = '*Update:* ' + sentenice(pieces);

  return HttpPost(
    config.slack.newsWebHook,
    JSON.stringify({
      channel: config.slack.newsChannelName,
      username: config.slack.notifierUserName,
      text: text.trim(),
      icon_emoji: config.slack.notifierEmoji,
    }),
    new XMLHttpRequest(),
  );
}

function postSoldOutItems(
  soldOutItems: Item[],
  config: Config,
  HttpPost: HttpPostFunction,
): Promise<string[]> {
  if (config.slack.soldOutChannelName === '') {
    return Promise.resolve([]);
  }

  const promises = soldOutItems.map((item) => {
    let attachmentText = `~${item.name}~ for ~${item.price} EUR~`;

    if (item.permanent === false) {
      attachmentText =
        attachmentText + ` size ${item.size} condition ${item.condition}`;
    }

    return HttpPost(
      config.slack.soldOutWebHook,
      JSON.stringify({
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
      }),
      new XMLHttpRequest(),
    );
  });

  return Promise.all(promises);
}

function postNewOffers(
  newOffers: Item[],
  config: Config,
  HttpPost: HttpPostFunction,
): Promise<string[]> {
  if (config.slack.newOffersChannelName === '') {
    return Promise.resolve([]);
  }

  const promises = newOffers.map((item) => {
    const text = item.permanent === true ? 'New offer:' : 'New unique offer:';

    let attachmentText = `*${item.name}* for *${item.price}* EUR`;

    if (item.permanent === false) {
      attachmentText =
        attachmentText + ` size *${item.size}* condition *${item.condition}*`;
    }

    return HttpPost(
      config.slack.newOffersWebHook,
      JSON.stringify({
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
      }),
      new XMLHttpRequest(),
    );
  });

  return Promise.all(promises);
}

function postPriceUpdates(
  priceUpdates: PriceUpdate[],
  config: Config,
  HttpPost: HttpPostFunction,
): Promise<string[]> {
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
      return Promise.resolve('');
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

    return HttpPost(
      webHookToUse,
      JSON.stringify({
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
      }),
      new XMLHttpRequest(),
    );
  });

  return Promise.all(promises);
}

export function notify(
  {
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
  },
  HttpPost = post,
) {
  return postNewsEntry(
    newOffers.length,
    priceUpdates.length,
    soldOutItems.length,
    config,
    HttpPost,
  )
    .then(() => {
      let ret: Promise<string[]> = Promise.resolve([]);
      if (!justSummary) {
        ret = ret
          .then(() => postSoldOutItems(soldOutItems, config, HttpPost))
          .then(() => postNewOffers(newOffers, config, HttpPost))
          .then(() => postPriceUpdates(priceUpdates, config, HttpPost));
      }
      return ret;
    })
    .then(() => log('Finished notification handling'));
}
