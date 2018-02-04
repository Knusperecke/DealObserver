'use strict';

const Database = require('../../src/database/database');
const assert = require('chai').assert;

describe('Database', () => {
    function createDatabase() {
        return Database('localhost', 'root', 'PinkiePie', 'test');
    }

    it('Provides a function to connect', () => {
        assert.isFunction(Database);
    });

    it('Returns an object', () => {
        const db = createDatabase();
        assert.isObject(db);
        db.close();
    });

    it('Returns an object with a "query" function', () => {
        const db = createDatabase();
        assert.isFunction(db.query)
        db.close();
    });

    it('Returns an object with a "close" function', () => {
        const db = createDatabase();
        assert.isFunction(db.close)
        db.close();
    });

    it('Can close a newly created connection', async () => {
        const db = createDatabase();

        await new Promise((resolve) => {
            db.close(function() {
                assert.ok(true);
                resolve();
            });
        });

        db.close();
    });

    it('Query function supports a simple query', async () => {
        const db = createDatabase();

        await new Promise((resolve) => {
            db.query('SELECT 1 + 1 AS solution', function(results) {
                assert.deepEqual(results[0].solution, 2);
                resolve();
            });
        });

        db.close();
    });

    ['models', 'current', 'history'].forEach((name) => {
        it(`Database has a table named ${name}`, async () => {
            const db = createDatabase();

            await new Promise((resolve) => {
                db.query(`SELECT * FROM ${name}`, function() {
                    assert.ok(true);
                    resolve();
                });
            });

            db.close();
        });
    });
});