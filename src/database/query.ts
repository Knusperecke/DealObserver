import { Connection } from 'mysql2';
import { log } from '../util/logger.js';

export function query(
  connection: Connection,
  queryBody: string,
): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    connection.query(queryBody, function (error, results) {
      if (error) {
        reject(error);
        return;
      }
      log('Query successful');
      if (!(results as any).length) {
        resolve([]);
      }
      resolve(results as Array<unknown>);
    });
  });
}
