// npm package helper

var web_server = require('./cjs/server/server').default

exports = module.exports = web_server

exports.render = require('./cjs/server/server').render_page
exports.renderError = require('./cjs/server/render error').default

exports['default'] = web_server