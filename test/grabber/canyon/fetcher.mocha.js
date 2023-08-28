'use strict';

const Fetcher = require('../../../src/grabber/canyon/fetcher');
const sinon = require('sinon');
const assert = require('chai').assert;

describe('Canyon fetcher', () => {
  let httpGet;
  let config = {};

  beforeEach(() => {
    httpGet = sinon.stub().returns(Promise.resolve());
  });

  it('Uses the provided HttpGet implementation', () => {
    Fetcher(config, httpGet);
    assert.ok(httpGet.called);
  });

  it('Returns an array', () => {
    assert.isArray(Fetcher(config, httpGet));
  });

  it('Handles failing promises (failing http gets)', async () => {
    httpGet = sinon.stub().returns(Promise.reject());
    const promises = Fetcher(config, httpGet);

    let didAssertionFail = false;
    await Promise.all(
      promises.map(async (promise) => {
        await promise.catch(() => {
          didAssertionFail = true;
        });
      }),
    );
    assert.notOk(didAssertionFail);
  });

  it('Wraps the returned data into an object with "type" and "data"', async () => {
    const expectedData = 'example-data';
    httpGet = sinon.stub().returns(Promise.resolve(expectedData));

    const returnedObjects = [];
    await Promise.all(
      Fetcher(config, httpGet).map(async (promise) => {
        await promise.then((object) => {
          returnedObjects.push(object);
        });
      }),
    );

    assert.ok(returnedObjects.length);
    returnedObjects.forEach((object) => {
      assert.isObject(object);
      assert.property(object, 'type');
      assert.include(object, { data: expectedData });
    });
  });
});
