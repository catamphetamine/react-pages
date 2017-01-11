// npm package helper

var web_server = require('./build/page-server/web server').default

exports = module.exports = web_server

exports.render = require('./build/page-server/render').default

exports.create_store = require('./build/redux/server/store').default
exports.createStore  = exports.create_store

exports['default'] = web_server