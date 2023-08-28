'use strict';

const HttpHelper = require('../../src/util/httpHelper');
const assert = require('chai').assert;
const sinon = require('sinon');

describe('HttpHelper', () => {
  const request = {};
  let promise;

  beforeEach(() => {
    request.open = sinon.spy();
    request.send = sinon.spy();
    request.status = 200;
    request.readyState = 4;
  });

  describe('get', () => {
    beforeEach(() => {
      promise = HttpHelper.get('example.com', request);
    });

    it('should provide a get function', () => {
      assert.isFunction(HttpHelper.get);
    });

    it('should assign an onreadystatechange callback on the http request', () => {
      assert.isFunction(request.onreadystatechange);
    });

    it('should call send and open on the request', () => {
      assert.ok(request.open.called);
      assert.ok(request.send.called);
    });

    it('should resolve when onreadystatechange is triggered with ready state 4', () => {
      request.onreadystatechange();

      return promise;
    });

    it('should reject if status is not 200', async () => {
      request.status = 400;
      request.onreadystatechange();

      let didAssertionFail = false;
      try {
        await promise;
      } catch (e) {
        didAssertionFail = true;
      }

      assert.ok(didAssertionFail);
    });

    it('should return the response from the Http get request', async () => {
      const expectedResponse = 'Hello World!';
      request.responseText = expectedResponse;
      request.onreadystatechange();

      await promise.then((response) =>
        assert.ok(response === expectedResponse),
      );
    });

    it('should do nothing for onreadystatechange with ready state != 4', async () => {
      request.readyState = 1;
      request.onreadystatechange();

      const expectedResponse = 'Hello World!';
      request.responseText = expectedResponse;
      request.readyState = 4;
      request.onreadystatechange();

      await promise.then((response) =>
        assert.ok(response === expectedResponse),
      );
    });
  });

  describe('post', () => {
    beforeEach(() => {
      request.setRequestHeader = sinon.spy();
      promise = HttpHelper.post('example.com', 'payload', request);
    });

    it('should provide a post function', () => {
      assert.isFunction(HttpHelper.get);
    });

    it('should assign an onreadystatechange callback on the http request', () => {
      assert.isFunction(request.onreadystatechange);
    });

    it('should call send and open on the request', () => {
      assert.ok(request.open.called);
      assert.ok(request.send.calledWith('payload'));
    });

    it('should set the encoding as request header', () => {
      assert.ok(
        request.setRequestHeader.calledWith('Content-type', 'application/json'),
      );
    });

    it('should resolve when onreadystatechange is triggered with ready state 4', () => {
      request.onreadystatechange();

      return promise;
    });

    it('should reject if status is not 200', async () => {
      request.status = 400;
      request.onreadystatechange();

      let didAssertionFail = false;
      try {
        await promise;
      } catch (e) {
        didAssertionFail = true;
      }

      assert.ok(didAssertionFail);
    });

    it('should return the response from the Http get request', async () => {
      const expectedResponse = 'Hello World!';
      request.responseText = expectedResponse;
      request.onreadystatechange();

      await promise.then((response) =>
        assert.ok(response === expectedResponse),
      );
    });

    it('should do nothing for onreadystatechange with ready state != 4', async () => {
      request.readyState = 1;
      request.onreadystatechange();

      const expectedResponse = 'Hello World!';
      request.responseText = expectedResponse;
      request.readyState = 4;
      request.onreadystatechange();

      await promise.then((response) =>
        assert.ok(response === expectedResponse),
      );
    });
  });
});
