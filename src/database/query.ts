import { Connection } from 'mysql2';
import { log } from '../util/logger.js';

export function query(connection: Connection, queryBody: string) {
  return new Promise((resolve) => {
    connection.query(queryBody, function (error, results) {
      if (error) {
        throw new Error(`Failed in query="${queryBody}" with error="${error}"`);
      }
      log('Query successful');
      resolve(results);
    });
  });
}
