import * as MySql from 'mysql2';
import { log } from '../util/logger.js';
import { query } from './query.js';
import { PushResult, push } from './push.js';
import { Item } from '../types.js';
import { updateCurrent } from './updateCurrent.js';
import { setupDatabase } from './setup.js';

function close(connection: MySql.Connection): Promise<void> {
  return new Promise((resolve) => {
    connection.end((error) => {
      if (error) {
        throw new Error(`Failed to close database connection error="${error}"`);
      }
      log('Closed database');
      resolve();
    });
  });
}

export interface DatabaseInterface {
  query: (queryBody: string) => Promise<unknown[]>;
  close: () => Promise<void>;
  push: (items: Item[]) => Promise<PushResult>;
  updateCurrent: (newHistoryIds: string[]) => Promise<Item[]>;
}

export async function connectDatabase(
  host: string,
  user: string,
  password: string,
  databaseName: string,
  dropTables = false,
): Promise<DatabaseInterface> {
  const connection = MySql.createConnection({
    host: host,
    user: user,
    password: password,
    database: databaseName,
    multipleStatements: true,
  });
  connection.connect((error) => {
    if (error) {
      throw new Error('Failed in database connection: ' + error);
    }

    log('Connected to database');
  });

  const queryFunction = query.bind(this, connection);

  const db: DatabaseInterface = {
    query: queryFunction,
    close: close.bind(this, connection),
    push: push.bind(this, queryFunction),
    updateCurrent: updateCurrent.bind(this, queryFunction),
  };

  await setupDatabase(db.query, dropTables);

  return db;
}
