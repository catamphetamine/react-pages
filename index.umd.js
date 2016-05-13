// just an npm package helper

var redux_router = require('redux-router')

var head = require('./babel-transpiled-modules/webpage head')

var client = require('./babel-transpiled-modules/client')

var push = redux_router.push
var replace = redux_router.replace

var webpage_head = head.webpage_head
var webpage_title = head.webpage_title
var webpage_meta = head.webpage_meta

exports.head  = webpage_head
exports.title = webpage_title
exports.meta  = webpage_meta

exports.render = client

exports.goto     = push
exports.redirect = replace