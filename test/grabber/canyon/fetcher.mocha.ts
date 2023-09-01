import { Config } from '../../../src/types.js';
import { createTestConfig } from '../make-config.js';
import chai from 'chai';
import { fetcherQueries } from '../../../src/grabber/canyon/fetcher.js';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const assert = chai.assert;

describe('Canyon fetcherQueries', () => {
  let config: Config = createTestConfig();
  let axiosMock: MockAdapter;

  beforeEach(() => {
    axiosMock = new MockAdapter(axios);
  });

  it('posts get queries via axios', async () => {
    axiosMock.onGet(/.*www[.]canyon[.]com.*/).reply(200, 'data');
    await fetcherQueries(config);
    assert.strictEqual(axiosMock.history.get.length, 14);
  });

  it('returns an array', async () => {
    axiosMock.onGet(/.*www[.]canyon[.]com.*/).reply(200, 'data');
    assert.isArray(await fetcherQueries(config));
  });

  it('handles failing promises (failing http gets)', () => {
    axiosMock.onGet(/.*www[.]canyon[.]com.*/).reply(404);
    return assert.isRejected(Promise.all(fetcherQueries(config)), 'error');
  });

  it('wraps the returned data in an object with "type" and "data"', async () => {
    const expectedData = 'example-data';
    axiosMock.onGet(/.*www[.]canyon[.]com.*/).reply(200, expectedData);

    const returnedObjects = await Promise.all(fetcherQueries(config));

    assert.ok(returnedObjects.length);
    returnedObjects.forEach((object) => {
      assert.isObject(object);
      assert.property(object, 'type');
      assert.include(object, { data: expectedData });
    });
  });
});
