import React from 'react'

import
{
	meta,
	render,
	getState,
	getHttpClient,
	preload,
	translate,
	onPageLoaded,
	goto,
	redirect,
	PRELOAD_STARTED,
	PRELOAD_FINISHED,
	PRELOAD_FAILED,
	// PRELOAD_METHOD_NAME,
	ReduxModule,
	// Deprecated. Use `new ReduxModule()` instead.
	reduxModule,
	underscoredToCamelCase,
	eventName,
	Link,
	getCookie,
	getPreferredLocales,
	getPreferredLocale,
	getLanguageFromLocale,
	replaceLocation,
	pushLocation,
	goBack,
	indicateLoading,
	Loading,
	Route,
	Redirect,
	useRouter
}
from '../index'

describe(`exports`, function()
{
	it(`should export ES6`, () =>
	{
		meta.should.be.a('function')
		indicateLoading.should.be.a('function')
		Loading.should.be.a('function')

		render.should.be.a('function')
		getState.should.be.a('function')
		getHttpClient.should.be.a('function')
		preload.should.be.a('function')
		translate.should.be.a('function')
		onPageLoaded.should.be.a('function')

		goto.should.be.a('function')
		redirect.should.be.a('function')

		PRELOAD_STARTED.should.be.a('string')
		PRELOAD_FINISHED.should.be.a('string')
		PRELOAD_FAILED.should.be.a('string')

		// PRELOAD_METHOD_NAME.should.be.a('string')

		reduxModule.should.be.a('function')

		underscoredToCamelCase.should.be.a('function')
		eventName.should.be.a('function')

		Link.should.be.a('function')
		Route.should.be.a('function')
		Redirect.should.be.a('function')
		useRouter.should.be.a('function')

		getCookie.should.be.a('function')
		getPreferredLocales.should.be.a('function')
		getPreferredLocale.should.be.a('function')
		getLanguageFromLocale.should.be.a('function')

		replaceLocation.should.be.a('function')
		pushLocation.should.be.a('function')
		goBack.should.be.a('function')
	})

	it(`should export ES5`, () =>
	{
		const _ = require('../index.commonjs')

		_.meta.should.be.a('function')
		_.indicateLoading.should.be.a('function')
		_.Loading.should.be.a('function')

		// Combined Redux exports

		_.render.should.be.a('function')
		_.getState.should.be.a('function')
		_.getHttpClient.should.be.a('function')
		_.preload.should.be.a('function')
		_.translate.should.be.a('function')
		_.onPageLoaded.should.be.a('function')

		_.goto.should.be.a('function')
		_.redirect.should.be.a('function')

		_.PRELOAD_STARTED.should.be.a('string')
		_.PRELOAD_FINISHED.should.be.a('string')
		_.PRELOAD_FAILED.should.be.a('string')

		// _.PRELOAD_METHOD_NAME.should.be.a('string')

		_.reduxModule.should.be.a('function')
		_.ReduxModule.should.be.a('function')

		_.underscoredToCamelCase.should.be.a('function')
		_.eventName.should.be.a('function')

		_.Link.should.be.a('function')
		_.Route.should.be.a('function')
		_.Redirect.should.be.a('function')
		_.useRouter.should.be.a('function')

		_.getCookie.should.be.a('function')
		_.getPreferredLocales.should.be.a('function')
		_.getPreferredLocale.should.be.a('function')
		_.getLanguageFromLocale.should.be.a('function')

		_.replaceLocation.should.be.a('function')
		_.pushLocation.should.be.a('function')
		_.goBack.should.be.a('function')
	})

	it(`should export rendering service`, () =>
	{
		const server = require('../server')

		server.should.be.a('function')
		server.render.should.be.a('function')
		server.renderError.should.be.a('function')
	})
})