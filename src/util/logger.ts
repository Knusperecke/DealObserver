export function log(message: string, context?: unknown) {
    // eslint-disable-next-line no-console
    console.log(message, context);
}

export function warn(message: string, context?: unknown) {
    // eslint-disable-next-line no-console
    console.warn(message, context);
}

export function error(message: string, context?: unknown) {
    // eslint-disable-next-line no-console
    console.error(message, context);
}
