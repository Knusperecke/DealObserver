"use strict";

const HttpHelper = require("../../src/util/httpHelper");
const assert = require("chai").assert;
const sinon = require("sinon");

describe("HttpHelper", () => {
  describe("get", () => {
    const request = {};
    let promise;

    beforeEach(function() {
      request.open = sinon.spy();
      request.send = sinon.spy();
      request.status = 200;
      request.readyState = 4;

      promise = HttpHelper.get("example.com", request);
    });

    it("should assign an onreadystatechange callback on the http request",
       () => { assert.isFunction(request.onreadystatechange); });

    it("should call send and open on the request", () => {
      assert.ok(request.open.called);
      assert.ok(request.send.called);
    });

    it("should resolve when onreadystatechange is triggered", () => {
      const promise = HttpHelper.get("example.com", request);
      request.onreadystatechange();

      return promise;
    });

    it("should reject if status is not 200", async () => {
      const promise = HttpHelper.get("example.com", request);
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
  });
});