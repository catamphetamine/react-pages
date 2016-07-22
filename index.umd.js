// just an npm package helper

var head = require('./build/webpage head')

var client = require('./build/client')

var webpage_head = head.webpage_head
var webpage_title = head.webpage_title
var webpage_meta = head.webpage_meta

exports.head  = webpage_head
exports.title = webpage_title
exports.meta  = webpage_meta

exports.render = client