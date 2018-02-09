'use strict';

const XMLHttpRequestImpl = require('xmlhttprequest').XMLHttpRequest;
const HttpHelper = require('../util/httpHelper');
const config = require('../../config');


function postError(error, HttpPost = HttpHelper.post) {
    return HttpPost(
        config.slack.debugWebHook, JSON.stringify({
            channel: config.slack.debugChannelName,
            username: config.slack.notifierUserName,
            text: `\`B0RK3N\`: \`\`\`${error.message}\`\`\`\nFrom:\`\`\`${error.stack}\`\`\``,
            icon_emoji: config.slack.errorEmoji,
        }),
        new XMLHttpRequestImpl());
}

module.exports = postError;