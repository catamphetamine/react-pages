// npm package helper

var web_server = require('./build/page-server/web server')

exports = module.exports = web_server

exports.render = require('./build/page-server/render')

exports['default'] = web_server