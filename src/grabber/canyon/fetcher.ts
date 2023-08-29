import { Config, ShopQueryResult } from '../../types.js';
import { HttpGetFunction, get } from '../../util/httpHelper.js';
import { attachQueryHandler } from '../common.js';

function outlet(HttpGet: HttpGetFunction): Promise<ShopQueryResult>[] {
  const categories = ['triathlon', 'road'];
  const type = '&type=html';
  const baseUrl =
    'https://www.canyon.com/en/factory-outlet/ajax/articles.html?category=';

  const openQueries: Promise<ShopQueryResult>[] = [];
  categories.forEach((category) => {
    const url = baseUrl + category + type;
    openQueries.push(
      attachQueryHandler(HttpGet(url, new XMLHttpRequest()), url).then(
        (data: string | undefined) => {
          return { type: 'outlet', data };
        },
      ),
    );
  });
  return openQueries;
}

function normalOffers(HttpGet: HttpGetFunction): Promise<ShopQueryResult>[] {
  const baseUrl = 'https://www.canyon.com/en/';
  const subUrls = [
    'road/aeroad/',
    'road/ultimate/evo/',
    'road/ultimate/cf-slx/',
    'road/ultimate/cf-sl/',
    'road/ultimate/al-slx/',
    'road/endurace/cf-slx/',
    'road/endurace/cf-sl/',
    'road/endurace/cf/',
    'road/endurace/al/',
    'road/inflite/',
    'triathlon/speedmax/cf-slx/',
    'triathlon/speedmax/cf/',
  ];

  const openQueries: Promise<ShopQueryResult>[] = [];
  subUrls.forEach((sub) => {
    const url = baseUrl + sub;
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
  return outlet(HttpGet).concat(normalOffers(HttpGet));
}
