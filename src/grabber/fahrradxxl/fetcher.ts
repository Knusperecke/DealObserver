import { Config, ShopQueryResult } from '../../types.js';
import { HttpGetFunction, get } from '../../util/httpHelper.js';
import { attachQueryHandler } from '../common.js';

function watchedItems(
  config: Config,
  HttpGet: HttpGetFunction,
): Promise<ShopQueryResult>[] {
  const baseUrl = config.fahrradxxl.baseUrl;
  const subUrls = config.fahrradxxl.itemsToWatch;

  const openQueries: Promise<ShopQueryResult>[] = [];
  subUrls.forEach((sub) => {
    const url = baseUrl + '/' + sub;
    openQueries.push(
      attachQueryHandler(HttpGet(url, new XMLHttpRequest()), url).then(
        (data: string | undefined) => {
          return { type: 'normalOffer', data };
        },
      ),
    );
  });
  return openQueries;
}

export function fetcherQueries(
  config: Config,
  HttpGet = get,
): Promise<ShopQueryResult>[] {
  return watchedItems(config, HttpGet);
}
