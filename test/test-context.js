require('babel-polyfill');

var context = require.context('./', true, /\.mocha\.js$/);
context.keys().forEach(context);