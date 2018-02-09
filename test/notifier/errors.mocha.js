'use strict';

const ErrorNotifier = require('../../src/notifier/errors');
const sinon = require('sinon');
const assert = require('chai').assert;
const config = require('../../config');

describe('Error notifier', () => {
    it('Posts to the debug channel via its webhook', async () => {
        const httpPostMock = sinon.stub().returns(Promise.resolve());
        const inputError = new Error('Some error');
        await ErrorNotifier(inputError, httpPostMock);

        assert.ok(httpPostMock.calledWith(config.slack.debugWebHook));
    });
});
