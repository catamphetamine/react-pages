exports = module.exports = require('./commonjs/server/server.js').default;

exports.render = require('./commonjs/server/server.js').renderPage;
exports.renderError = require('./commonjs/server/renderError.js').default;

exports['default'] = require('./commonjs/server/server.js').default;
