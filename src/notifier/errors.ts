import { Config } from '../types.js';
import { post } from '../util/httpHelper.js';

export function postError(error: Error, config: Config, HttpPost = post): Promise<string> {
    return HttpPost(
        config.slack.debugWebHook,
        JSON.stringify({
            channel: config.slack.debugChannelName,
            username: config.slack.notifierUserName,
            text: `\`B0RK3N\`: \`\`\`${error.message}\`\`\`\nFrom:\`\`\`${error.stack}\`\`\``,
            icon_emoji: config.slack.errorEmoji,
        }),
        new XMLHttpRequest(),
    );
}
