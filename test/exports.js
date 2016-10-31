import chai from 'chai'
chai.should()

import { head, title, meta, render } from '../index.es6'

import
{
	render as redux_render,
	preload,
	goto,
	redirect,
	Preload_started,
	Preload_finished,
	Preload_failed,
	Preload_method_name,
	Preload_options_name
}
from '../source/redux/index'

describe(`exports`, function()
{
	it(`should export ES6`, () =>
	{
		head.should.be.a('function')
		title.should.be.a('function')
		meta.should.be.a('function')
		render.should.be.a('function')

		redux_render.should.be.a('function')
		preload.should.be.a('function')

		goto.should.be.a('function')
		redirect.should.be.a('function')

		Preload_started.should.be.a('string')
		Preload_finished.should.be.a('string')
		Preload_failed.should.be.a('string')

		Preload_method_name.should.be.a('string')
		Preload_options_name.should.be.a('string')
	})

	it(`should export ES5`, () =>
	{
		const _ = require('../index.umd')

		_.head.should.be.a('function')
		_.title.should.be.a('function')
		_.meta.should.be.a('function')
		_.render.should.be.a('function')

		const redux = require('../build/redux/index')

		redux.render.should.be.a('function')
		redux.preload.should.be.a('function')

		redux.goto.should.be.a('function')
		redux.redirect.should.be.a('function')

		redux.Preload_started.should.be.a('string')
		redux.Preload_finished.should.be.a('string')
		redux.Preload_failed.should.be.a('string')

		redux.Preload_method_name.should.be.a('string')
		redux.Preload_options_name.should.be.a('string')

		const server = require('../server')

		// (for backwards compatibility; use `react-isomorphic-render/server` instead)
		const page_server = require('../page-server')
		page_server.should.equal(server)

		server.should.be.a('function')
		server.render.should.be.a('function')
	})
})