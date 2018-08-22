// npm package helper

var webServer = require('./commonjs/server/server').default

exports = module.exports = webServer

exports.render = require('./commonjs/server/server').renderPage
exports.renderError = require('./commonjs/server/renderError').default

exports['default'] = webServer