import { log } from '../util/logger.js';
import { DatabaseInterface } from './database.js';

async function dropTables(query: DatabaseInterface['query']): Promise<void> {
    await Promise.all(
        ['items', 'current', 'history'].map(async (name) => {
            try {
                await query(`DROP TABLE ${name}`);
            } catch (error) {
                log('Could not drop table, assuming it did not exist', { error, name });
            }
        }),
    );
}

export async function setupDatabase(
    query: DatabaseInterface['query'],
    wantsDropTables: boolean,
): Promise<void> {
    if (wantsDropTables) {
        await dropTables(query);
    }

    await query(
        'CREATE TABLE IF NOT EXISTS items (' +
            'itemId INT NOT NULL AUTO_INCREMENT,' +
            'nameId VARCHAR(255) NOT NULL,' +
            'name VARCHAR(255) NOT NULL,' +
            'modelYear INT,' +
            'UNIQUE (itemId)' +
            ')',
    );

    await query('CREATE TABLE IF NOT EXISTS current (' + 'historyId INT NOT NULL' + ')');

    await query(
        'CREATE TABLE IF NOT EXISTS history (\n' +
            'historyId INT NOT NULL AUTO_INCREMENT,\n' +
            'itemId INT NOT NULL,\n' +
            'itemCondition VARCHAR(255),\n' +
            'isPermanent TINYINT,\n' +
            'size VARCHAR(64) NOT NULL,\n' +
            'price DOUBLE,\n' +
            'durationFrom DATETIME,\n' +
            'durationTo DATETIME,\n' +
            'lastSellerId VARCHAR(255) NOT NULL,\n' +
            'lastUrl VARCHAR(255),\n' +
            'lastSmallImgUrl VARCHAR(255),\n' +
            'UNIQUE (historyId)\n' +
            ')',
    );
    log('Ensured database setup');
}
