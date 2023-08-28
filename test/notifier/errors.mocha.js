'use strict';

const ErrorNotifier = require('../../src/notifier/errors');
const sinon = require('sinon');
const assert = require('chai').assert;

describe('Error notifier', () => {
  it('Posts to the debug channel via its webhook', async () => {
    const config = {
      slack: {
        debugWebHook: 'https://url',
        debugChannelName: 'debug',
        notifierUserName: 'name',
        errorEmoji: ':hi:',
      },
    };
    const httpPostMock = sinon.stub().returns(Promise.resolve());
    const inputError = new Error('Some error');
    await ErrorNotifier(inputError, config, httpPostMock);

    assert.ok(httpPostMock.calledWith(config.slack.debugWebHook));
  });
});
