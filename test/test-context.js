require('babel-polyfill');

var context = require.context(
  './',
  true,
  /(grabber|notifier|util|viewer)\/.*\.mocha\.js$/,
); // (?!database)
context.keys().forEach(context);
