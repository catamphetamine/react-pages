import React from 'react'

import Library from '../index.cjs'
import Server from '../server.cjs'

import
{
	getState,
	getHttpClient,
	goto,
	redirect,
	PRELOAD_STARTED,
	PRELOAD_FINISHED,
	PRELOAD_FAILED,
	ReduxModule,
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
	goBackTwoPages,
	goForward,
	indicateLoading,
	Loading,
	Route,
	Redirect,
	useRoute,
	useRouter,
	useNavigationEffect,
	useLocation
}
from '../index.js'

import server, {
	render,
	renderError
} from '../server.js'

describe(`exports`, function()
{
	it(`should export ES6`, () =>
	{
		indicateLoading.should.be.a('function')
		Loading.WrappedComponent.should.be.a('function')

		getState.should.be.a('function')
		getHttpClient.should.be.a('function')

		goto.should.be.a('function')
		redirect.should.be.a('function')

		PRELOAD_STARTED.should.be.a('string')
		PRELOAD_FINISHED.should.be.a('string')
		PRELOAD_FAILED.should.be.a('string')

		underscoredToCamelCase.should.be.a('function')
		eventName.should.be.a('function')

		Link.render.should.be.a('function')
		Route.should.be.a('function')
		Redirect.should.be.a('function')
		useRoute.should.be.a('function')
		useRouter.should.be.a('function')
		useNavigationEffect.should.be.a('function')

		getCookie.should.be.a('function')
		getPreferredLocales.should.be.a('function')
		getPreferredLocale.should.be.a('function')
		getLanguageFromLocale.should.be.a('function')

		replaceLocation.should.be.a('function')
		pushLocation.should.be.a('function')
		goBack.should.be.a('function')
		goBackTwoPages.should.be.a('function')
		goForward.should.be.a('function')

		useLocation.should.be.a('function')
	})

	it(`should export CommonJS`, () =>
	{
		Library.indicateLoading.should.be.a('function')
		Library.Loading.WrappedComponent.should.be.a('function')

		Library.getState.should.be.a('function')
		Library.getHttpClient.should.be.a('function')

		Library.goto.should.be.a('function')
		Library.redirect.should.be.a('function')

		Library.PRELOAD_STARTED.should.be.a('string')
		Library.PRELOAD_FINISHED.should.be.a('string')
		Library.PRELOAD_FAILED.should.be.a('string')

		Library.underscoredToCamelCase.should.be.a('function')
		Library.eventName.should.be.a('function')

		Library.Link.render.should.be.a('function')
		Library.Route.should.be.a('function')
		Library.Redirect.should.be.a('function')
		Library.useRoute.should.be.a('function')
		Library.useRouter.should.be.a('function')
		Library.useNavigationEffect.should.be.a('function')

		Library.getCookie.should.be.a('function')
		Library.getPreferredLocales.should.be.a('function')
		Library.getPreferredLocale.should.be.a('function')
		Library.getLanguageFromLocale.should.be.a('function')

		Library.replaceLocation.should.be.a('function')
		Library.pushLocation.should.be.a('function')
		Library.goBack.should.be.a('function')
		Library.goBackTwoPages.should.be.a('function')
		Library.goForward.should.be.a('function')

		Library.useLocation.should.be.a('function')
	})

	it(`should export rendering service`, () =>
	{
		server.should.be.a('function')
		render.should.be.a('function')
		renderError.should.be.a('function')
	})

	it(`should export rendering service (CommonJS)`, () =>
	{
		Server.should.be.a('function')
		Server.default.should.be.a('function')
		Server.render.should.be.a('function')
		Server.renderError.should.be.a('function')
	})
})