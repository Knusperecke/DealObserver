import MockAdapter from 'axios-mock-adapter';
import { Config } from '../../src/types.js';
import { createTestConfig } from '../make-config.js';
import axios from 'axios';
import { postError } from '../../src/notifier/errors.js';
import { assert } from 'chai';

describe('Error notifier', () => {
    let axiosMock: MockAdapter;

    beforeEach(() => {
        axiosMock = new MockAdapter(axios);
    });

    it('Posts to the debug channel via its webhook', async () => {
        const config: Config = createTestConfig();
        config.slack.debugWebHook = 'https://url';
        config.slack.debugChannelName = 'debug';
        config.slack.notifierUserName = 'name';
        config.slack.errorEmoji = ':hi:';

        axiosMock.onPost(/https[:][/][/]url/).reply(200);
        const inputError = new Error('Some error');
        await postError(inputError, config);

        assert.strictEqual(axiosMock.history.post.length, 1);
    });
});
