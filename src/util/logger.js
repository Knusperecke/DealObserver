'use strict';

function log() {
    // eslint-disable-next-line no-console
    console.log.apply(console, arguments);
}

function warn() {
    // eslint-disable-next-line no-console
    console.warn.apply(console, arguments);
}

function error() {
    // eslint-disable-next-line no-console
    console.error().apply(console, arguments);
}

module.exports = {
    log,
    warn,
    error
};