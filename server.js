// npm package helper

var web_server = require('./build/server/server').default

exports = module.exports = web_server

exports.render = require('./build/server/render').default

exports['default'] = web_server