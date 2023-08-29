import { error, log } from '../util/logger.js';

export function attachQueryHandler(
  query: Promise<string>,
  url: string,
): Promise<undefined | string> {
  return query
    .catch(() => {
      error('Failed to query url=', url);
      return undefined;
    })
    .then((result) => {
      log('Got data from remote url=', url);
      return result;
    });
}
