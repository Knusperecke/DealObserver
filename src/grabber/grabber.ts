import minimist from 'minimist';
import { defaultConfig } from '../config.js';
import { configOverride } from '../config.local.js';
import { postError } from '../notifier/errors.js';
import { notify } from '../notifier/notifier.js';
import { fetcherQueries as canyonFetcherQueries } from './canyon/fetcher.js';
import { parse as canyonParse } from './canyon/parser.js';
import { fetcherQueries as fahrradXxlFetcherQueries } from './fahrradxxl/fetcher.js';
import { processItem as fahrradXxlParser } from './fahrradxxl/parser.js';
import { preproces } from './updatePreprocessor.js';
import { Config, Item, PriceUpdate } from '../types.js';
import { log } from '../util/logger.js';
import { connectDatabase } from '../database/database.js';

export async function runGrabber(
  connectDatabaseFunction = connectDatabase,
  cycles = [
    { fetcher: canyonFetcherQueries, parser: canyonParse },
    { fetcher: fahrradXxlFetcherQueries, parser: fahrradXxlParser },
  ],
  UpdatePreprocessor = preproces,
  Notifier = notify,
  ErrorNotifier = postError,
  config = { ...defaultConfig, ...configOverride } as Config,
) {
  const justSummary = minimist(process.argv.slice(2)).summary || false;

  const db = await connectDatabaseFunction(
    config.database.host,
    config.database.user,
    config.database.password,
    config.database.table,
  );

  let grabbedItems: Item[] = [];

  let currentItemIds: string[] = [];
  let newOffers: Item[] = [];
  let priceUpdates: PriceUpdate[] = [];
  let soldOutItems: Item[] = [];

  return Promise.all(
    cycles.map(({ fetcher, parser }) => {
      return Promise.all(
        fetcher(config).map((query) => {
          return query.then(parser).then((items) => {
            grabbedItems = grabbedItems.concat(items);
          });
        }),
      );
    }),
  )
    .then(() => db.push(grabbedItems))
    .then((updates) => {
      log(
        `Received updates for ${updates.offerIds.length} items, ${updates.newOffers.length} new offers, ${updates.priceUpdates.length} price updates`,
      );
      currentItemIds = currentItemIds.concat(updates.offerIds);
      newOffers = newOffers.concat(updates.newOffers);
      priceUpdates = priceUpdates.concat(updates.priceUpdates);
    })
    .then(() => db.updateCurrent(currentItemIds))
    .then((soldOutItemsUpdate) => (soldOutItems = soldOutItemsUpdate))
    .then(async () => {
      await db.close();
    })
    .then(() =>
      Notifier(
        Object.assign(
          UpdatePreprocessor({ newOffers, priceUpdates, soldOutItems }),
          { justSummary, config },
        ),
      ),
    )
    .catch((error) => ErrorNotifier(error, config))
    .catch((error) => error(error.message));
}
