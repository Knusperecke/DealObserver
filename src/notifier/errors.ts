import axios from 'axios';
import { Config } from '../types.js';

export async function postError(error: Error, config: Config): Promise<void> {
    await axios.post(config.slack.debugWebHook, {
        channel: config.slack.debugChannelName,
        username: config.slack.notifierUserName,
        text: `\`B0RK3N\`: \`\`\`${error.message}\`\`\`\nFrom:\`\`\`${error.stack}\`\`\``,
        icon_emoji: config.slack.errorEmoji,
    });
}
