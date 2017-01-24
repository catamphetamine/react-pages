import { expect, should } from 'chai'

should()
global.expect = expect

// `navigator` is required by `robust-websocket`
// https://github.com/appuri/robust-websocket/issues/9
global.navigator = {}