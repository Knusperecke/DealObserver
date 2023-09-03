import axios from 'axios';
import { Config, ShopQueryResult } from '../../types.js';
import { error, log } from '../../util/logger.js';

function watchedItems(config: Config): Promise<ShopQueryResult>[] {
  const baseUrl = config.fahrradxxl.baseUrl;
  const subUrls = config.fahrradxxl.itemsToWatch;

  return subUrls.map(async (sub) => {
    const url = baseUrl + '/' + sub;

    try {
      const queryResult = await axios.get(url);
      log('Got data from remote url=', url);
      return {
        type: 'normalOffer',
        data: queryResult.data,
      } as ShopQueryResult;
    } catch (thrownError) {
      error('Failed to query url=', url);
      throw new Error(
        `Failed to query ${url} error ${JSON.stringify(thrownError)}`,
      );
    }
  });
}

export function fetcherQueries(config: Config): Promise<ShopQueryResult>[] {
  return watchedItems(config);
}
