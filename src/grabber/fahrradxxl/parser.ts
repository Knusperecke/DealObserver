import { Item, ShopQueryResult } from '../../types.js';
import { log } from '../../util/logger.js';

export function processItem({ data }: ShopQueryResult): Item[] {
  const returnValue: Item[] = [];

  if (!data) {
    return returnValue;
  }

  const nameMatch =
    data.match(`<meta itemprop="name" content="([^"]*)">`) || [];
  const priceMatch =
    data.match(`<div class="current-price">[^0-9]*([0-9.]*)`) || [];
  const offerIdMatch = data.match(`data-item="([^"]*)"`) || [];
  let imgUrlMatch: RegExpMatchArray | string[] =
    data.match(
      `<img.*src="([^"]*)" srcset="([^"]*) 1x,.*2x".*class="product_thumbnail__media">`,
    ) || [];
  const imgUrlMatchNewer =
    data.match(
      `<img.*srcset="([^"]*) 1x,.*2x".*src="([^"]*)".*class="product_thumbnail__media">`,
    ) || [];

  if (imgUrlMatch.length === 0) {
    const end = imgUrlMatchNewer.splice(1).reverse();
    const begin = imgUrlMatchNewer.splice(0, 1);
    imgUrlMatch = begin.concat(end);
  }

  if (nameMatch.length === 0) {
    return [];
  }

  if (
    nameMatch.length !== 2 ||
    priceMatch.length !== 2 ||
    offerIdMatch.length !== 2 ||
    imgUrlMatch.length !== 3
  ) {
    throw new Error(
      `Failed to parse an item (FahrradXXL): nameMatch.length=${nameMatch.length} priceMatch.length=${priceMatch.length} offerIdMatch.length=${offerIdMatch.length} imgUrlMatch.length=${imgUrlMatch.length}`,
    );
  }

  returnValue.push({
    name: nameMatch[1],
    id: nameMatch[1].toLowerCase(),
    price: Number(priceMatch[1].replace('.', '')),
    offerId: offerIdMatch[1],
    size: '*',
    modelYear: '0',
    permanent: false,
    condition: 'NewCondition',
    url: 'https://www.fahrrad-xxl.de' + imgUrlMatch[1].trim(),
    smallImgUrl: 'https://www.fahrrad-xxl.de' + imgUrlMatch[2].trim(),
  });

  log('Parsed ' + returnValue.length + ' items, returning them');
  return returnValue;
}
