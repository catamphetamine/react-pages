import chai from 'chai'
chai.should()

import { head, title, meta } from '../index.es6'

import
{
	render,
	preload,
	goto,
	redirect,
	Preload_started,
	PRELOAD_STARTED,
	Preload_finished,
	PRELOAD_FINISHED,
	Preload_failed,
	PRELOAD_FAILED,
	Preload_method_name,
	PRELOAD_METHOD_NAME,
	Preload_options_name,
	PRELOAD_OPTIONS_NAME
}
from '../index.es6'

describe(`exports`, function()
{
	it(`should export ES6`, () =>
	{
		head.should.be.a('function')
		title.should.be.a('function')
		meta.should.be.a('function')

		render.should.be.a('function')
		preload.should.be.a('function')

		goto.should.be.a('function')
		redirect.should.be.a('function')

		Preload_started.should.be.a('string')
		PRELOAD_STARTED.should.be.a('string')
		Preload_finished.should.be.a('string')
		PRELOAD_FINISHED.should.be.a('string')
		Preload_failed.should.be.a('string')
		PRELOAD_FAILED.should.be.a('string')

		Preload_method_name.should.be.a('string')
		PRELOAD_METHOD_NAME.should.be.a('string')
		Preload_options_name.should.be.a('string')
		PRELOAD_OPTIONS_NAME.should.be.a('string')
	})

	it(`should export ES5`, () =>
	{
		const _ = require('../index.common')

		_.head.should.be.a('function')
		_.title.should.be.a('function')
		_.meta.should.be.a('function')

		// Combined Redux exports

		_.render.should.be.a('function')
		_.preload.should.be.a('function')

		_.goto.should.be.a('function')
		_.redirect.should.be.a('function')

		_.Preload_started.should.be.a('string')
		_.PRELOAD_STARTED.should.be.a('string')
		_.Preload_finished.should.be.a('string')
		_.PRELOAD_FINISHED.should.be.a('string')
		_.Preload_failed.should.be.a('string')
		_.PRELOAD_FAILED.should.be.a('string')

		_.Preload_method_name.should.be.a('string')
		_.PRELOAD_METHOD_NAME.should.be.a('string')
		_.Preload_options_name.should.be.a('string')
		_.PRELOAD_OPTIONS_NAME.should.be.a('string')

		// Backwards compatibility for `/redux` export
		// (will be removed in version 9.0.0)
		const redux = require('../redux')

		redux.render.should.be.a('function')
		redux.preload.should.be.a('function')

		redux.goto.should.be.a('function')
		redux.redirect.should.be.a('function')

		redux.Preload_started.should.be.a('string')
		redux.PRELOAD_STARTED.should.be.a('string')
		redux.Preload_finished.should.be.a('string')
		redux.PRELOAD_FINISHED.should.be.a('string')
		redux.Preload_failed.should.be.a('string')
		redux.PRELOAD_FAILED.should.be.a('string')

		redux.Preload_method_name.should.be.a('string')
		redux.PRELOAD_METHOD_NAME.should.be.a('string')
		redux.Preload_options_name.should.be.a('string')
		redux.PRELOAD_OPTIONS_NAME.should.be.a('string')
	})

	it(`should export rendering service`, () =>
	{
		const server = require('../server')

		server.should.be.a('function')
		server.render.should.be.a('function')
	})
})